import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TeamRequest, TeamRequestStatus } from './entities/team-request.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateTeamRequestDto } from './dto/create-team-request.dto';
import { ProcessTeamRequestDto } from './dto/process-team-request.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class TeamRequestsService {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(TeamRequest)
    private teamRequestRepository: Repository<TeamRequest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuration Supabase manquante: SUPABASE_URL et SUPABASE_ANON_KEY requis');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async create(createTeamRequestDto: CreateTeamRequestDto): Promise<TeamRequest> {
    const { project_share_token, requester_email } = createTeamRequestDto;

    // Vérifier que le projet existe et est partagé
    const project = await this.projectRepository.findOne({
      where: {
        public_share_token: project_share_token,
        is_public_shared: true,
      },
      relations: ['company'],
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé ou lien de partage invalide');
    }

    if (project.public_share_expires_at && new Date() > project.public_share_expires_at) {
      throw new BadRequestException('Le lien de partage a expiré');
    }

    // Vérifier si l'utilisateur existe déjà dans l'entreprise
    const existingUser = await this.userRepository.findOne({
      where: {
        email: requester_email,
        company_id: project.company_id,
      },
    });

    if (existingUser) {
      throw new ConflictException('Cet email fait déjà partie de cette entreprise');
    }

    // Vérifier s'il y a déjà une demande en attente
    const existingRequest = await this.teamRequestRepository.findOne({
      where: {
        requester_email,
        company_id: project.company_id,
        status: TeamRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new ConflictException('Une demande est déjà en cours pour cet email');
    }

    const teamRequest = this.teamRequestRepository.create({
      ...createTeamRequestDto,
      company_id: project.company_id,
    });

    return await this.teamRequestRepository.save(teamRequest);
  }

  async findAllForCompany(companyId: string): Promise<TeamRequest[]> {
    return await this.teamRequestRepository.find({
      where: { company_id: companyId },
      relations: ['processedBy'],
      order: { created_at: 'DESC' },
    });
  }

  async getNotificationsCount(companyId: string): Promise<{ count: number }> {
    const count = await this.teamRequestRepository.count({
      where: { 
        company_id: companyId,
        status: TeamRequestStatus.PENDING 
      },
    });
    
    return { count };
  }

  async findOne(id: string, companyId: string): Promise<TeamRequest> {
    const request = await this.teamRequestRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['processedBy', 'company'],
    });

    if (!request) {
      throw new NotFoundException(`Demande avec l'ID ${id} non trouvée`);
    }

    return request;
  }

  async process(
    id: string, 
    processTeamRequestDto: ProcessTeamRequestDto, 
    companyId: string, 
    processedByUserId: string
  ): Promise<TeamRequest> {
    const request = await this.findOne(id, companyId);

    if (request.status !== TeamRequestStatus.PENDING) {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    const updatedRequest = await this.teamRequestRepository.save({
      ...request,
      status: processTeamRequestDto.status,
      processed_by: processedByUserId,
      processed_at: new Date(),
      rejection_reason: processTeamRequestDto.rejection_reason,
    });

    // Si approuvée, créer le compte utilisateur
    if (processTeamRequestDto.status === TeamRequestStatus.APPROVED) {
      await this.createUserAccount(request);
    }

    return updatedRequest;
  }

  private async createUserAccount(request: TeamRequest): Promise<User> {
    try {
      // Récupérer les informations de l'entreprise
      const company = await this.projectRepository.findOne({
        where: { public_share_token: request.project_share_token },
        relations: ['company'],
      }).then(project => project?.company);

      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      // Utiliser Supabase pour inviter l'utilisateur et envoyer l'email
      console.log('📨 Envoi d\'invitation Supabase pour:', request.requester_email);
      const { data, error } = await this.supabase.auth.admin.inviteUserByEmail(
        request.requester_email,
        {
          data: {
            name: request.requester_name,
            role: UserRole.HR,
            company_id: request.company_id,
            company_name: company.name,
            invitation_context: 'team_request', // Pour différencier des invitations admin
          },
          redirectTo: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/invitation-callback`,
        }
      );

      console.log('📧 Réponse Supabase invitation:', { 
        user: data?.user?.id, 
        email: data?.user?.email,
        error: error?.message 
      });

      if (error) {
        console.error('❌ Erreur Supabase invitation:', error);
        throw new Error(`Erreur lors de l'envoi de l'invitation: ${error.message}`);
      }

      // Créer l'utilisateur invité dans notre base de données
      const user = this.userRepository.create({
        email: request.requester_email,
        name: request.requester_name,
        company_id: request.company_id,
        role: UserRole.HR, // Par défaut rôle HR
        is_invited: true,
        is_active: false, // Inactif jusqu'à ce qu'il complète son inscription
        google_id: data.user?.id, // ID Supabase
      });

      const savedUser = await this.userRepository.save(user);
      
      console.log('✅ Compte utilisateur créé et invitation envoyée à:', request.requester_email);
      return savedUser;

    } catch (error) {
      console.error('❌ Erreur lors de la création du compte et envoi d\'invitation:', error);
      throw new BadRequestException('Erreur lors de l\'envoi de l\'invitation par email');
    }
  }

  async remove(id: string, companyId: string): Promise<void> {
    const request = await this.findOne(id, companyId);
    await this.teamRequestRepository.remove(request);
  }
}