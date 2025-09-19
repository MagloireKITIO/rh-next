import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, DataSource } from 'typeorm';
import { Project } from './entities/project.entity';
import { Candidate, CandidateSource } from '../candidates/entities/candidate.entity';
import { Analysis } from '../analysis/entities/analysis.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { StorageService } from '../storage/storage.service';
import { AnalysisQueueService } from '../candidates/analysis-queue.service';
import { PipelineService } from '../pipeline/pipeline.service';
// ✅ Imports supprimés - automatisations gérées par AutomationSubscriber
// import { AutomationTriggerService } from '../mail-automation/services/automation-trigger.service';
// import { AutomationTrigger, AutomationEntityType } from '../mail-automation/entities/mail-automation.entity';
import { randomBytes } from 'crypto';
import * as pdf from 'pdf-parse';
import { CandidateFilters, PaginatedResponse } from '../candidates/candidates.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectDataSource()
    private dataSource: DataSource,
    private storageService: StorageService,
    private analysisQueueService: AnalysisQueueService,
    private pipelineService: PipelineService,
    // ✅ Service supprimé - automatisations gérées par AutomationSubscriber
    // private automationTriggerService: AutomationTriggerService,
  ) {}

  async create(createProjectDto: CreateProjectDto, companyId: string, userId: string): Promise<Project> {
    this.logger.log(`🎯 Creating new project: ${createProjectDto.name} for company ${companyId}`);

    const project = this.projectRepository.create({
      ...createProjectDto,
      company_id: companyId,
      created_by: userId,
    });

    const savedProject = await this.projectRepository.save(project);
    this.logger.log(`✅ Project created successfully with ID: ${savedProject.id}`);

    // ✅ Automatisations désormais gérées automatiquement par AutomationSubscriber
    // Les triggers ON_CREATE sont déclenchés automatiquement lors de la sauvegarde

    // 🎯 Créer automatiquement le pipeline par défaut pour le projet
    this.logger.log(`🔄 Starting pipeline creation for project ${savedProject.id}...`);
    try {
      const pipeline = await this.pipelineService.createDefaultPipeline(savedProject.id);
      this.logger.log(`✅ Default recruitment pipeline created successfully:`, {
        projectId: savedProject.id,
        pipelineId: pipeline.id,
        stagesCount: pipeline.stages?.length || 0
      });
    } catch (error) {
      this.logger.error(`❌ Failed to create default pipeline for project ${savedProject.id}:`, {
        error: error.message,
        stack: error.stack,
        projectId: savedProject.id
      });
      // Ne pas faire échouer la création du projet si le pipeline échoue
    }

    this.logger.log(`🎉 Project creation completed for ${savedProject.id}`);
    return savedProject;
  }

  async findAll(companyId: string): Promise<Project[]> {
    return await this.projectRepository.find({
      where: { company_id: companyId },
      relations: ['candidates'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string, withRelations: string[] = []): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, company_id: companyId },
      relations: withRelations,
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found in your company`);
    }

    return project;
  }

  async findOneWithPaginatedRelations(id: string, companyId: string, candidateLimit: number = 50): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, company_id: companyId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found in your company`);
    }

    // Charger les candidats avec pagination
    const candidates = await this.candidateRepository.find({
      where: { projectId: id },
      take: candidateLimit,
      order: { createdAt: 'DESC' },
    });

    // Charger les analyses avec pagination
    const analyses = await this.analysisRepository.find({
      where: { projectId: id },
      take: candidateLimit,
      order: { createdAt: 'DESC' },
    });

    return {
      ...project,
      candidates,
      analyses,
    } as Project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, companyId: string): Promise<Project> {
    // Vérifier que le projet appartient à l'entreprise
    const project = await this.findOne(id, companyId);
    await this.projectRepository.update(id, updateProjectDto);
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    // Transaction atomique pour garantir la cohérence des données
    return await this.dataSource.transaction(async manager => {
      
      // 1. Vérifier que le projet existe et appartient à l'entreprise
      const project = await manager.findOne(Project, {
        where: { id, company_id: companyId },
        select: ['id', 'name'] // Optimiser la requête
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found in your company`);
      }

      this.logger.log(`Starting transactional deletion of project ${project.name} (${id})`);

      // 2. Compter les éléments à supprimer (pour les logs)
      const [analysisCount, candidateCount] = await Promise.all([
        manager.count(Analysis, { where: { projectId: id } }),
        manager.count(Candidate, { where: { projectId: id } })
      ]);

      this.logger.log(`Found ${analysisCount} analyses and ${candidateCount} candidates to delete`);

      // 3. Suppression atomique dans l'ordre des dépendances
      // Les analyses dépendent des candidats, donc on les supprime en premier
      if (analysisCount > 0) {
        await manager.delete(Analysis, { projectId: id });
        this.logger.log(`✅ Deleted ${analysisCount} analyses`);
      }

      if (candidateCount > 0) {
        await manager.delete(Candidate, { projectId: id });
        this.logger.log(`✅ Deleted ${candidateCount} candidates`);
      }

      // 4. Supprimer le projet lui-même
      const result = await manager.delete(Project, { id });
      if (result.affected === 0) {
        throw new NotFoundException(`Project with ID ${id} not found during deletion`);
      }

      this.logger.log(`✅ Successfully deleted project ${project.name} and all associated data atomically`);
      
      // 🎯 Si on arrive ici, TOUTES les opérations ont réussi
      // 🚨 Si erreur n'importe où, RIEN n'est supprimé (rollback automatique)
    });
  }

  async getProjectStats(id: string, companyId: string) {
    // Vérifier que le projet existe sans charger les relations
    const project = await this.projectRepository.findOne({
      where: { id, company_id: companyId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found in your company`);
    }

    // Requêtes optimisées séparées
    const totalCandidates = await this.candidateRepository.count({ 
      where: { projectId: id } 
    });
    
    const analyzedCandidates = await this.candidateRepository.count({ 
      where: { projectId: id, status: 'analyzed' } 
    });

    // Calculer la moyenne des scores avec une requête SQL directe
    const avgScoreResult = await this.candidateRepository
      .createQueryBuilder('candidate')
      .select('AVG(CAST(candidate.score AS DECIMAL))', 'avgScore')
      .where('candidate.projectId = :projectId', { projectId: id })
      .andWhere('candidate.score IS NOT NULL')
      .getRawOne();
    
    const avgScore = avgScoreResult?.avgScore ? parseFloat(avgScoreResult.avgScore) : 0;

    // Top 5 candidats avec pagination
    const topCandidates = await this.candidateRepository.find({
      where: { projectId: id },
      select: ['id', 'name', 'score', 'summary'],
      order: { score: 'DESC' },
      take: 5,
    });

    return {
      totalCandidates,
      analyzedCandidates,
      pendingAnalysis: totalCandidates - analyzedCandidates,
      averageScore: Math.round(avgScore * 100) / 100,
      topCandidates: topCandidates.map(c => ({
        id: c.id,
        name: c.name,
        score: c.score,
        summary: c.summary,
      })),
    };
  }

  async generateShareLink(id: string, companyId: string, expirationDays: number = 30): Promise<{ shareToken: string, expiresAt: Date }> {
    const project = await this.findOne(id, companyId); // Pas de relations nécessaires
    
    const shareToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    await this.projectRepository.update(id, {
      public_share_token: shareToken,
      is_public_shared: true,
      public_share_expires_at: expiresAt,
    });

    return { shareToken, expiresAt };
  }

  async getSharedProject(shareToken: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { 
        public_share_token: shareToken,
        is_public_shared: true,
      },
      relations: ['candidates', 'analyses', 'company'],
    });

    if (!project) {
      throw new NotFoundException('Lien de partage invalide ou expiré');
    }

    if (project.public_share_expires_at && new Date() > project.public_share_expires_at) {
      throw new NotFoundException('Lien de partage expiré');
    }

    return project;
  }

  async getSharedProjectCandidates(shareToken: string, page: number = 1, limit: number = 20, filters?: CandidateFilters): Promise<PaginatedResponse<Candidate>> {
    // Vérifier d'abord que le projet partagé existe et est valide
    const project = await this.projectRepository.findOne({
      where: { 
        public_share_token: shareToken,
        is_public_shared: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Lien de partage invalide ou expiré');
    }

    if (project.public_share_expires_at && new Date() > project.public_share_expires_at) {
      throw new NotFoundException('Lien de partage expiré');
    }

    // Maintenant rechercher les candidats avec pagination et filtres
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.dataSource
      .getRepository(Candidate)
      .createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.project', 'project')
      .leftJoinAndSelect('candidate.analyses', 'analyses')
      .where('candidate.projectId = :projectId', { projectId: project.id });

    // Filtrage par recherche (nom, email, résumé, texte extrait)
    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(candidate.name) LIKE :search OR LOWER(candidate.email) LIKE :search OR LOWER(candidate.summary) LIKE :search OR LOWER(candidate.extractedText) LIKE :search)',
        { search: searchTerm }
      );
    }

    // Filtrage par statut
    if (filters?.status) {
      queryBuilder.andWhere('candidate.status = :status', { status: filters.status });
    }

    // Filtrage par score
    if (filters?.scoreFilter && filters.scoreFilter !== 'all') {
      switch (filters.scoreFilter) {
        case 'excellent':
          queryBuilder.andWhere('candidate.score >= 80');
          break;
        case 'good':
          queryBuilder.andWhere('candidate.score >= 60 AND candidate.score < 80');
          break;
        case 'average':
          queryBuilder.andWhere('candidate.score >= 40 AND candidate.score < 60');
          break;
        case 'poor':
          queryBuilder.andWhere('candidate.score < 40');
          break;
      }
    }

    // Ordre et pagination
    queryBuilder
      .orderBy('candidate.score', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
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

  async revokeShare(id: string, companyId: string): Promise<void> {
    const project = await this.findOne(id, companyId); // Pas de relations nécessaires
    
    await this.projectRepository.update(id, {
      public_share_token: null,
      is_public_shared: false,
      public_share_expires_at: null,
    });
  }

  // Nouvelles méthodes pour les offres d'emploi publiques
  async getActiveJobOffers(companyId?: string): Promise<Project[]> {
    const now = new Date();
    const whereCondition: any = {
      status: 'active',
    };

    if (companyId) {
      whereCondition.company_id = companyId;
    }

    return await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.company', 'company')
      .where('project.status = :status', { status: 'active' })
      .andWhere(companyId ? 'project.company_id = :companyId' : '1=1', companyId ? { companyId } : {})
      .andWhere('(project.startDate IS NULL OR project.startDate <= :now)', { now })
      .andWhere('(project.endDate IS NULL OR project.endDate >= :now)', { now })
      .select([
        'project.id',
        'project.name',
        'project.jobDescription',
        'project.offerDescription',
        'project.startDate',
        'project.endDate',
        'project.createdAt',
        'company.id',
        'company.name'
      ])
      .orderBy('project.createdAt', 'DESC')
      .getMany();
  }

  async getJobOffer(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { 
        id,
        status: 'active',
      },
      relations: ['company'],
      select: {
        id: true,
        name: true,
        jobDescription: true,
        offerDescription: true,
        offerDocumentUrl: true,
        offerDocumentFileName: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        company: {
          id: true,
          name: true,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Offre d\'emploi non trouvée ou inactive');
    }

    // Vérifier si l'offre est encore active (dans la période)
    const now = new Date();
    if (project.endDate && now > project.endDate) {
      throw new NotFoundException('Cette offre d\'emploi a expiré');
    }
    if (project.startDate && now < project.startDate) {
      throw new NotFoundException('Cette offre d\'emploi n\'est pas encore active');
    }

    return project;
  }

  private extractNameFromFilename(filename: string): string | null {
    try {
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      const patterns = [
        /(?:CV|Curriculum|Resume).*?([A-Za-z]+)[_\-\s]+([A-Za-z]+)/i,
        /^([A-Za-z]+)[_\-\s]+([A-Za-z]+)/i,
        /([A-Za-z]{2,})/i
      ];

      for (const pattern of patterns) {
        const match = nameWithoutExt.match(pattern);
        if (match) {
          if (match[2]) {
            return `${match[1]} ${match[2]}`.replace(/[_\-]/g, ' ');
          } else if (match[1]) {
            return match[1].replace(/[_\-]/g, ' ');
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error extracting name from filename:', error);
      return null;
    }
  }

  async applyToJobOffer(id: string, file: Express.Multer.File, applicationData: any): Promise<{ success: boolean; message: string; candidateId?: string }> {
    // Vérifier que l'offre existe et est active
    const project = await this.getJobOffer(id);

    if (!file) {
      throw new BadRequestException('CV file is required');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are accepted for CV');
    }

    // Transaction atomique pour la candidature complète
    return await this.dataSource.transaction(async manager => {
      let fileUrl: string;
      
      try {
        // 1. Extraire le texte du PDF
        let extractedText = '';
        let candidateName = applicationData.name || 'Candidat Inconnu';
        
        try {
          const pdfData = await pdf(file.buffer);
          extractedText = pdfData.text?.trim() || '';
          
          if (!extractedText || extractedText.length < 10) {
            this.logger.warn(`PDF text extraction failed for application to job ${id}`);
            extractedText = `[PDF extraction failed] File: ${file.originalname}`;
          } else {
            this.logger.log(`Successfully extracted ${extractedText.length} characters from application CV`);
          }
        } catch (error) {
          this.logger.error(`Error extracting text from application CV:`, error);
          extractedText = `[PDF processing error] File: ${file.originalname} - Error: ${error.message}`;
        }

        // Si pas de nom fourni, essayer d'extraire du nom de fichier
        if (!candidateName || candidateName === 'Candidat Inconnu') {
          candidateName = this.extractNameFromFilename(file.originalname) || applicationData.name || 'Candidat Inconnu';
        }

        // 2. Sauvegarder le fichier CV
        try {
          fileUrl = await this.storageService.uploadFile(
            file.buffer, 
            file.originalname, 
            file.mimetype,
            'cv'
          );
          this.logger.log(`CV uploaded successfully for job application: ${fileUrl}`);
        } catch (error) {
          this.logger.error('Error uploading CV file:', error);
          throw new BadRequestException('Failed to upload CV file');
        }

        // 3. Créer le candidat avec les données de candidature (dans la transaction)
        const candidate = manager.create(Candidate, {
          name: candidateName,
          email: applicationData.email,
          phone: applicationData.phone,
          extractedText,
          fileName: file.originalname,
          fileUrl: fileUrl,
          projectId: project.id,
          status: 'pending',
          source: CandidateSource.APPLICATION, // Candidat venu via postulation
          extractedData: {
            name: candidateName,
            email: applicationData.email,
            phone: applicationData.phone,
          }
        });

        const savedCandidate = await manager.save(candidate);
        
        this.logger.log(`✅ New job application saved atomically for ${project.name}: ${candidateName}`);

        // Ajouter le candidat à la queue d'analyse
        await this.analysisQueueService.addToQueue(savedCandidate.id, savedCandidate, project);
        this.logger.log(`🔍 Candidate added to analysis queue: ${candidateName}`);

        // ✅ Les automatisations sont maintenant déclenchées automatiquement par AutomationSubscriber
        this.logger.log(`📧 Automation triggers will be executed automatically for candidate: ${candidateName}`);

        return {
          success: true,
          message: 'Votre candidature a été reçue avec succès et sera analysée prochainement',
          candidateId: savedCandidate.id
        };
        
      } catch (error) {
        this.logger.error('Error processing job application:', error);
        
        // En cas d'erreur, on tente de nettoyer le fichier uploadé si nécessaire
        // (le rollback de la transaction s'occupera des données BDD)
        if (fileUrl) {
          try {
            // TODO: Implémenter la suppression du fichier Azure si nécessaire
            // await this.storageService.deleteFile(fileUrl);
          } catch (cleanupError) {
            this.logger.error('Error cleaning up uploaded file:', cleanupError);
          }
        }
        
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Failed to process job application');
      }
    });
  }

  async uploadOfferDocument(id: string, companyId: string, file: Express.Multer.File): Promise<Project> {
    const project = await this.findOne(id, companyId); // Pas de relations nécessaires

    if (!file) {
      throw new NotFoundException('Aucun fichier fourni');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new NotFoundException('Seuls les fichiers PDF sont autorisés');
    }

    try {
      // Upload du fichier vers Azure Storage
      const documentUrl = await this.storageService.uploadOfferDocument(
        file.buffer,
        file.originalname
      );

      // Mise à jour du projet avec l'URL du document
      await this.projectRepository.update(id, {
        offerDocumentUrl: documentUrl,
        offerDocumentFileName: file.originalname,
      });

      this.logger.log(`Offer document uploaded successfully for project ${id}`);
      return this.findOne(id, companyId); // Pas de relations nécessaires
    } catch (error) {
      this.logger.error('Error uploading offer document:', error);
      throw new NotFoundException('Erreur lors de l\'upload du document');
    }
  }
}