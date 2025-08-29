import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { Company } from '../companies/entities/company.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Analysis } from '../analysis/entities/analysis.entity';
import { ApiKey } from '../api-keys/entities/api-key.entity';
import { MailService } from '../mail-configuration/mail.service';

@Injectable()
export class AdminService {
  private supabase;

  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_ANON_KEY'), // Utilise la clé existante
    );
  }

  // Dashboard & Stats
  async getGlobalStats() {
    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      activeUsers,
      totalProjects,
      totalCandidates,
      totalAnalyses,
    ] = await Promise.all([
      this.companyRepository.count(),
      this.companyRepository.count({ where: { is_active: true } }),
      this.userRepository.count(),
      this.userRepository.count({ where: { is_active: true } }),
      this.projectRepository.count(),
      this.candidateRepository.count(),
      this.analysisRepository.count(),
    ]);

    // Calculer la moyenne globale des scores
    const averageScoreResult = await this.candidateRepository
      .createQueryBuilder('candidate')
      .select('AVG(candidate.score)', 'avg')
      .where('candidate.score > 0')
      .getRawOne();

    const averageScoreGlobal = Math.round(averageScoreResult?.avg || 0);

    // Calculer les croissances (simulation - à implémenter avec des données historiques)
    const companiesGrowth = 12; // +12% ce mois
    const usersGrowth = 8; // +8% ce mois
    const projectsGrowth = 15; // +15% ce mois

    return {
      totalCompanies,
      activeCompanies,
      totalUsers,
      activeUsers,
      totalProjects,
      totalCandidates,
      totalAnalyses,
      averageScoreGlobal,
      companiesGrowth,
      usersGrowth,
      projectsGrowth,
    };
  }

  async getCompaniesStats() {
    const companies = await this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.users', 'users')
      .leftJoinAndSelect('company.projects', 'projects')
      .loadRelationCountAndMap('company.totalUsers', 'company.users')
      .loadRelationCountAndMap('company.activeUsers', 'company.users', 'activeUsers', (qb) => 
        qb.where('activeUsers.is_active = :isActive', { isActive: true }))
      .loadRelationCountAndMap('company.totalProjects', 'company.projects')
      .getMany();

    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        // Calculer le nombre total de candidats pour cette entreprise
        const totalCandidates = await this.candidateRepository
          .createQueryBuilder('candidate')
          .leftJoin('candidate.project', 'project')
          .where('project.company_id = :companyId', { companyId: company.id })
          .getCount();

        // Calculer la moyenne des scores pour cette entreprise
        const averageScoreResult = await this.candidateRepository
          .createQueryBuilder('candidate')
          .select('AVG(candidate.score)', 'avg')
          .leftJoin('candidate.project', 'project')
          .where('project.company_id = :companyId', { companyId: company.id })
          .andWhere('candidate.score > 0')
          .getRawOne();

        const averageScore = Math.round(averageScoreResult?.avg || 0);

        // Dernière activité (dernière création de projet ou candidat)
        const lastProjectDate = await this.projectRepository
          .createQueryBuilder('project')
          .select('project.createdAt')
          .where('project.company_id = :companyId', { companyId: company.id })
          .orderBy('project.createdAt', 'DESC')
          .limit(1)
          .getOne();

        return {
          id: company.id,
          name: company.name,
          domain: company.domain,
          totalUsers: company['totalUsers'] || 0,
          activeUsers: company['activeUsers'] || 0,
          totalProjects: company['totalProjects'] || 0,
          totalCandidates,
          averageScore,
          lastActivity: lastProjectDate?.createdAt?.toISOString() || company.created_at?.toISOString(),
        };
      })
    );

    return companiesWithStats;
  }

  // Companies Management
  async getAllCompanies() {
    return this.companyRepository.find({
      relations: ['users', 'projects'],
      order: { created_at: 'DESC' },
    });
  }

  async getCompanyById(id: string) {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['users', 'projects'],
    });

    if (!company) {
      throw new NotFoundException('Entreprise introuvable');
    }

    return company;
  }

  async createCompany(createCompanyDto: { name: string; domain: string; description?: string }, createdBy: string) {
    // Vérifier si le domaine existe déjà
    const existingCompany = await this.companyRepository.findOne({
      where: { domain: createCompanyDto.domain },
    });

    if (existingCompany) {
      throw new BadRequestException('Une entreprise avec ce domaine existe déjà');
    }

    const company = this.companyRepository.create({
      ...createCompanyDto,
      is_active: true,
    });

    return this.companyRepository.save(company);
  }

  async updateCompany(id: string, updateData: any) {
    const company = await this.companyRepository.findOne({ where: { id } });
    
    if (!company) {
      throw new NotFoundException('Entreprise introuvable');
    }

    // Vérifier le domaine unique si modifié
    if (updateData.domain && updateData.domain !== company.domain) {
      const existingCompany = await this.companyRepository.findOne({
        where: { domain: updateData.domain },
      });

      if (existingCompany) {
        throw new BadRequestException('Une entreprise avec ce domaine existe déjà');
      }
    }

    Object.assign(company, updateData);
    return this.companyRepository.save(company);
  }

  async deleteCompany(id: string) {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['users', 'projects'],
    });

    if (!company) {
      throw new NotFoundException('Entreprise introuvable');
    }

    // Vérifier s'il y a des données associées
    if (company.users?.length > 0 || company.projects?.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer cette entreprise : elle contient des utilisateurs ou des projets'
      );
    }

    await this.companyRepository.remove(company);
    return { message: 'Entreprise supprimée avec succès' };
  }

  async toggleCompanyStatus(id: string) {
    const company = await this.companyRepository.findOne({ where: { id } });
    
    if (!company) {
      throw new NotFoundException('Entreprise introuvable');
    }

    company.is_active = !company.is_active;
    await this.companyRepository.save(company);

    return {
      message: `Entreprise ${company.is_active ? 'activée' : 'désactivée'} avec succès`,
      company,
    };
  }

  // Users Management
  async getAllUsers() {
    return this.userRepository.find({
      relations: ['company'],
      order: { created_at: 'DESC' },
    });
  }

  async getUsersByCompany(companyId: string) {
    return this.userRepository.find({
      where: { company_id: companyId },
      relations: ['company'],
      order: { created_at: 'DESC' },
    });
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  async createUser(createUserDto: {
    email: string;
    name: string;
    role: string;
    company_id?: string;
  }) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà');
    }

    // Vérifier que l'entreprise existe si spécifiée
    let company = null;
    if (createUserDto.company_id) {
      company = await this.companyRepository.findOne({
        where: { id: createUserDto.company_id },
      });

      if (!company) {
        throw new BadRequestException('Entreprise introuvable');
      }
    }

    try {
      // Générer un token d'invitation unique
      const invitationToken = `invite_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Créer l'utilisateur dans notre base de données
      const user = this.userRepository.create({
        ...createUserDto,
        role: createUserDto.role as UserRole,
        is_active: true,
        is_invited: true,
        email_verified: false,
        invitation_token: invitationToken,
      });

      const savedUser = await this.userRepository.save(user);

      // Envoyer l'invitation via notre MailService personnalisé
      console.log('📨 Envoi d\'invitation personnalisée pour:', createUserDto.email);
      const redirectUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/callback?token=${invitationToken}`;
      
      const mailResult = await this.mailService.sendInvitationEmail(
        createUserDto.email,
        {
          name: createUserDto.name,
          companyName: company?.name || 'RH Analytics Pro',
          role: createUserDto.role,
          redirectUrl: redirectUrl,
        },
        createUserDto.company_id
      );

      if (!mailResult.success) {
        console.error('❌ Erreur envoi invitation:', mailResult.error);
        throw new BadRequestException(`Erreur lors de l'envoi de l'invitation: ${mailResult.error}`);
      }

      console.log('✅ Utilisateur créé et invitation envoyée à:', createUserDto.email);
      
      return {
        ...savedUser,
        invitation_sent: true,
        message: `Invitation envoyée à ${createUserDto.email}`,
      };

    } catch (error) {
      console.error('❌ Erreur lors de la création du compte et envoi d\'invitation:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Erreur lors de la création de l\'utilisateur et de l\'envoi de l\'invitation');
    }
  }

  async updateUser(id: string, updateData: any) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Vérifier l'email unique si modifié
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email },
      });

      if (existingUser) {
        throw new BadRequestException('Un utilisateur avec cet email existe déjà');
      }
    }

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    await this.userRepository.remove(user);
    return { message: 'Utilisateur supprimé avec succès' };
  }

  async resendUserInvitation(id: string) {
    const user = await this.userRepository.findOne({ 
      where: { id, is_invited: true },
      relations: ['company']
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable ou déjà activé');
    }

    try {
      // Générer un nouveau token d'invitation
      const newInvitationToken = `invite_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Mettre à jour le token d'invitation
      user.invitation_token = newInvitationToken;
      await this.userRepository.save(user);

      // Renvoyer l'invitation via notre MailService personnalisé
      console.log('📨 Renvoi d\'invitation personnalisée pour:', user.email);
      const redirectUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/callback?token=${newInvitationToken}`;
      
      const mailResult = await this.mailService.sendInvitationEmail(
        user.email,
        {
          name: user.name,
          companyName: user.company?.name || 'RH Analytics Pro',
          role: user.role,
          redirectUrl: redirectUrl,
        },
        user.company_id
      );

      if (!mailResult.success) {
        console.error('❌ Erreur renvoi invitation:', mailResult.error);
        throw new BadRequestException(`Erreur lors du renvoi de l'invitation: ${mailResult.error}`);
      }

      console.log('✅ Invitation renvoyée à:', user.email);
      
      return {
        message: `Invitation renvoyée à ${user.email}`,
        invitation_sent: true,
      };

    } catch (error) {
      console.error('❌ Erreur lors du renvoi d\'invitation:', error);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Erreur lors du renvoi de l\'invitation');
    }
  }

  async toggleUserStatus(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    user.is_active = !user.is_active;
    await this.userRepository.save(user);

    return {
      message: `Utilisateur ${user.is_active ? 'activé' : 'désactivé'} avec succès`,
      user,
    };
  }

  // Projects Management
  async getAllProjects() {
    return this.projectRepository.find({
      relations: ['company', 'createdBy', 'candidates'],
      order: { createdAt: 'DESC' },
    });
  }

  async getProjectsByCompany(companyId: string) {
    return this.projectRepository.find({
      where: { company_id: companyId },
      relations: ['company', 'createdBy', 'candidates'],
      order: { createdAt: 'DESC' },
    });
  }

  // API Keys Management
  async getAllApiKeys() {
    return this.apiKeyRepository.find({
      relations: ['company'],
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        name: true,
        key: false, // Ne pas exposer la clé complète
        isActive: true,
        requestCount: true,
        lastUsedAt: true,
        provider: true,
        company_id: true,
        createdAt: true,
        updatedAt: true,
        company: {
          id: true,
          name: true,
          domain: true,
        }
      },
    });
  }

  async getApiKeyById(id: string) {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id },
      relations: ['company'],
      select: {
        id: true,
        name: true,
        key: false, // Ne pas exposer la clé complète
        isActive: true,
        requestCount: true,
        lastUsedAt: true,
        provider: true,
        company_id: true,
        createdAt: true,
        updatedAt: true,
        company: {
          id: true,
          name: true,
          domain: true,
        }
      },
    });

    if (!apiKey) {
      throw new NotFoundException('Clé API introuvable');
    }

    return apiKey;
  }

  async createApiKey(createApiKeyDto: {
    key: string;
    name?: string;
    provider?: string;
    company_id?: string;
  }) {
    // Vérifier si la clé existe déjà
    const existingKey = await this.apiKeyRepository.findOne({
      where: { key: createApiKeyDto.key }
    });

    if (existingKey) {
      throw new BadRequestException('Une clé API avec cette valeur existe déjà');
    }

    // Vérifier que l'entreprise existe si spécifiée
    if (createApiKeyDto.company_id) {
      const company = await this.companyRepository.findOne({
        where: { id: createApiKeyDto.company_id },
      });

      if (!company) {
        throw new BadRequestException('Entreprise introuvable');
      }
    }

    const apiKey = this.apiKeyRepository.create({
      ...createApiKeyDto,
      provider: createApiKeyDto.provider || 'together_ai',
      isActive: true,
    });

    const savedKey = await this.apiKeyRepository.save(apiKey);

    // Retourner sans exposer la clé complète
    return this.getApiKeyById(savedKey.id);
  }

  async updateApiKey(id: string, updateData: {
    name?: string;
    company_id?: string;
    provider?: string;
  }) {
    const apiKey = await this.apiKeyRepository.findOne({ where: { id } });
    
    if (!apiKey) {
      throw new NotFoundException('Clé API introuvable');
    }

    // Vérifier que l'entreprise existe si spécifiée
    if (updateData.company_id) {
      const company = await this.companyRepository.findOne({
        where: { id: updateData.company_id },
      });

      if (!company) {
        throw new BadRequestException('Entreprise introuvable');
      }
    }

    Object.assign(apiKey, updateData);
    await this.apiKeyRepository.save(apiKey);

    return this.getApiKeyById(id);
  }

  async deleteApiKey(id: string) {
    const apiKey = await this.apiKeyRepository.findOne({ where: { id } });

    if (!apiKey) {
      throw new NotFoundException('Clé API introuvable');
    }

    await this.apiKeyRepository.remove(apiKey);
    return { message: 'Clé API supprimée avec succès' };
  }

  async toggleApiKeyStatus(id: string) {
    const apiKey = await this.apiKeyRepository.findOne({ where: { id } });
    
    if (!apiKey) {
      throw new NotFoundException('Clé API introuvable');
    }

    apiKey.isActive = !apiKey.isActive;
    await this.apiKeyRepository.save(apiKey);

    return {
      message: `Clé API ${apiKey.isActive ? 'activée' : 'désactivée'} avec succès`,
      isActive: apiKey.isActive,
    };
  }

  async getApiKeysStats() {
    try {
      const [
        totalKeys,
        activeKeys,
        inactiveKeys,
        totalRequestsResult,
      ] = await Promise.all([
        this.apiKeyRepository.count(),
        this.apiKeyRepository.count({ where: { isActive: true } }),
        this.apiKeyRepository.count({ where: { isActive: false } }),
        this.apiKeyRepository
          .createQueryBuilder('apiKey')
          .select('SUM(apiKey.requestCount)', 'total')
          .getRawOne(),
      ]);
      
      const totalRequests = parseInt(totalRequestsResult?.total || '0');

      const keysByCompany = await this.apiKeyRepository
        .createQueryBuilder('apiKey')
        .leftJoin('apiKey.company', 'company')
        .select([
          'CASE WHEN company.name IS NULL THEN \'Clés globales\' ELSE company.name END as "companyName"',
          'company.id as "companyId"',
          'COUNT(apiKey.id) as "keyCount"',
          'COALESCE(SUM(apiKey.requestCount), 0) as "totalRequests"'
        ])
        .groupBy('company.id')
        .addGroupBy('company.name')
        .orderBy('"keyCount"', 'DESC')
        .getRawMany();

      const processedKeysByCompany = (keysByCompany || []).map(item => ({
        ...item,
        companyId: item.companyId || 'global',
        keyCount: parseInt(item.keyCount || '0'),
        totalRequests: parseInt(item.totalRequests || '0'),
      }));

      return {
        totalKeys,
        activeKeys,
        inactiveKeys,
        totalRequests,
        keysByCompany: processedKeysByCompany,
      };
      
    } catch (error) {
      return {
        totalKeys: 0,
        activeKeys: 0,
        inactiveKeys: 0,
        totalRequests: 0,
        keysByCompany: [],
      };
    }
  }

  // System Settings
  async getSystemSettings() {
    // À implémenter selon vos besoins
    return {
      maintenance_mode: false,
      max_companies: null,
      max_users_per_company: null,
      features: {
        ai_analysis: true,
        team_requests: true,
        public_jobs: true,
      },
    };
  }

  async updateSystemSettings(settings: any) {
    // À implémenter selon vos besoins
    return {
      message: 'Paramètres système mis à jour avec succès',
      settings,
    };
  }
}