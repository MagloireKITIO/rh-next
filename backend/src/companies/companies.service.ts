import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateCompanyDto, InviteUserDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

@Injectable()
export class CompaniesService {
  private supabase;

  constructor(
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_ANON_KEY'),
    );
  }

  async create(createCompanyDto: CreateCompanyDto, adminUser: Partial<User>): Promise<Company> {
    // Vérifier si le domaine existe déjà
    const existingCompany = await this.companiesRepository.findOne({
      where: { domain: createCompanyDto.domain }
    });

    if (existingCompany) {
      throw new ConflictException('Une entreprise avec ce domaine existe déjà');
    }

    // Créer l'entreprise
    const company = this.companiesRepository.create(createCompanyDto);
    const savedCompany = await this.companiesRepository.save(company);

    // Créer l'utilisateur admin
    const admin = this.usersRepository.create({
      ...adminUser,
      company_id: savedCompany.id,
      role: UserRole.ADMIN,
      is_active: true,
    });
    await this.usersRepository.save(admin);

    return savedCompany;
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: { id },
      relations: ['users', 'projects'],
    });

    if (!company) {
      throw new NotFoundException('Entreprise non trouvée');
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);
    
    // Vérifier si le nouveau domaine existe déjà (si fourni)
    if (updateCompanyDto.domain && updateCompanyDto.domain !== company.domain) {
      const existingCompany = await this.companiesRepository.findOne({
        where: { domain: updateCompanyDto.domain }
      });

      if (existingCompany) {
        throw new ConflictException('Une entreprise avec ce domaine existe déjà');
      }
    }

    Object.assign(company, updateCompanyDto);
    return this.companiesRepository.save(company);
  }

  async getUsers(companyId: string, page: number = 1, limit: number = 50): Promise<PaginatedResponse<User>> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.usersRepository.findAndCount({
      where: { company_id: companyId },
      select: ['id', 'email', 'name', 'avatar_url', 'role', 'is_active', 'is_invited', 'created_at'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  async inviteUser(companyId: string, inviteUserDto: InviteUserDto): Promise<{ message: string; invitation_sent: boolean }> {
    // Vérifier que l'entreprise existe
    const company = await this.findOne(companyId);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.usersRepository.findOne({
      where: { email: inviteUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    try {
      // Utiliser Supabase pour inviter l'utilisateur
      console.log('📨 Tentative d\'invitation Supabase pour:', inviteUserDto.email);
      const { data, error } = await this.supabase.auth.admin.inviteUserByEmail(
        inviteUserDto.email,
        {
          data: {
            name: inviteUserDto.name,
            role: inviteUserDto.role,
            company_id: companyId,
            company_name: company.name,
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
        throw new BadRequestException(`Erreur lors de l'envoi de l'invitation: ${error.message}`);
      }

      // Créer l'utilisateur invité dans notre base de données
      const user = this.usersRepository.create({
        email: inviteUserDto.email,
        name: inviteUserDto.name,
        role: inviteUserDto.role as UserRole,
        company_id: companyId,
        is_invited: true,
        is_active: false,
        google_id: data.user?.id, // ID Supabase
      });

      await this.usersRepository.save(user);

      return { 
        message: 'Invitation envoyée avec succès par email',
        invitation_sent: true 
      };
    } catch (error) {
      console.error('Erreur lors de l\'invitation:', error);
      throw new BadRequestException('Erreur lors de l\'envoi de l\'invitation');
    }
  }

  async updateUserRole(companyId: string, userId: string, role: UserRole): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, company_id: companyId }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé dans cette entreprise');
    }

    user.role = role;
    return this.usersRepository.save(user);
  }

  async deactivateUser(companyId: string, userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, company_id: companyId }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé dans cette entreprise');
    }

    user.is_active = false;
    return this.usersRepository.save(user);
  }

  async reactivateUser(companyId: string, userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, company_id: companyId }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé dans cette entreprise');
    }

    user.is_active = true;
    return this.usersRepository.save(user);
  }

  async resendInvitation(companyId: string, userId: string): Promise<{ message: string; invitation_sent: boolean }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, company_id: companyId, is_invited: true },
      relations: ['company']
    });

    if (!user) {
      throw new NotFoundException('Utilisateur invité non trouvé dans cette entreprise');
    }

    if (!user.is_invited) {
      throw new BadRequestException('Cet utilisateur a déjà accepté son invitation');
    }

    try {
      // Pour renvoyer une invitation, il faut d'abord supprimer l'utilisateur Supabase puis le recréer
      if (user.google_id) {
        // Supprimer l'utilisateur existant de Supabase
        const { error: deleteError } = await this.supabase.auth.admin.deleteUser(user.google_id);
        if (deleteError) {
          console.warn('⚠️ Impossible de supprimer l\'utilisateur Supabase:', deleteError.message);
        }
      }

      // Recréer l'invitation
      const { data, error } = await this.supabase.auth.admin.inviteUserByEmail(
        user.email,
        {
          data: {
            name: user.name,
            role: user.role,
            company_id: companyId,
            company_name: user.company.name,
          },
          redirectTo: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/invitation-callback`,
        }
      );

      if (error) {
        console.error('❌ Erreur Supabase renvoi invitation:', error);
        throw new BadRequestException(`Erreur lors du renvoi de l'invitation: ${error.message}`);
      }

      // Mettre à jour l'ID Supabase si nécessaire
      if (data.user && data.user.id !== user.google_id) {
        user.google_id = data.user.id;
        await this.usersRepository.save(user);
      }

      return { 
        message: 'Invitation renvoyée avec succès par email',
        invitation_sent: true 
      };

    } catch (error) {
      console.error('❌ Erreur lors du renvoi d\'invitation:', error);
      throw new BadRequestException(error.message || 'Erreur lors du renvoi de l\'invitation');
    }
  }

  async deleteUser(companyId: string, userId: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, company_id: companyId }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé dans cette entreprise');
    }

    // Supprimer l'utilisateur
    await this.usersRepository.remove(user);

    return { message: 'Utilisateur supprimé avec succès' };
  }
}