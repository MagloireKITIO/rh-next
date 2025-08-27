import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { Project } from './entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Analysis } from '../analysis/entities/analysis.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AzureStorageService } from '../storage/azure-storage.service';
import { randomBytes } from 'crypto';
import * as pdf from 'pdf-parse';

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
    private azureStorageService: AzureStorageService,
  ) {}

  async create(createProjectDto: CreateProjectDto, companyId: string, userId: string): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      company_id: companyId,
      created_by: userId,
    });
    return await this.projectRepository.save(project);
  }

  async findAll(companyId: string): Promise<Project[]> {
    return await this.projectRepository.find({
      where: { company_id: companyId },
      relations: ['candidates'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['candidates', 'analyses'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found in your company`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, companyId: string): Promise<Project> {
    // Vérifier que le projet appartient à l'entreprise
    const project = await this.findOne(id, companyId);
    await this.projectRepository.update(id, updateProjectDto);
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    // Vérifier que le projet existe et appartient à l'entreprise
    const project = await this.projectRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['candidates', 'analyses']
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found in your company`);
    }

    this.logger.log(`Starting deletion of project ${project.name} (${id})`);

    try {
      // 1. Supprimer toutes les analyses du projet
      const analysisCount = await this.analysisRepository.count({ where: { projectId: id } });
      if (analysisCount > 0) {
        await this.analysisRepository.delete({ projectId: id });
        this.logger.log(`Deleted ${analysisCount} analyses`);
      }

      // 2. Supprimer tous les candidats du projet
      const candidateCount = await this.candidateRepository.count({ where: { projectId: id } });
      if (candidateCount > 0) {
        await this.candidateRepository.delete({ projectId: id });
        this.logger.log(`Deleted ${candidateCount} candidates`);
      }

      // 3. Supprimer le projet lui-même
      const result = await this.projectRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      this.logger.log(`Successfully deleted project ${project.name} and all associated data`);
    } catch (error) {
      this.logger.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  }

  async getProjectStats(id: string, companyId: string) {
    const project = await this.findOne(id, companyId);
    
    const totalCandidates = project.candidates.length;
    const analyzedCandidates = project.candidates.filter(c => c.status === 'analyzed').length;
    const avgScore = project.candidates.length > 0 
      ? project.candidates.reduce((sum, c) => sum + Number(c.score), 0) / project.candidates.length 
      : 0;
    
    const topCandidates = project.candidates
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 5);

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
    const project = await this.findOne(id, companyId);
    
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

  async revokeShare(id: string, companyId: string): Promise<void> {
    const project = await this.findOne(id, companyId);
    
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

    try {
      // Extraire le texte du PDF
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

      // Sauvegarder le fichier CV
      let fileUrl: string;
      try {
        fileUrl = await this.azureStorageService.uploadFile(
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

      // Créer le candidat avec les données de candidature
      const candidate = await this.candidateRepository.create({
        name: candidateName,
        email: applicationData.email,
        phone: applicationData.phone,
        extractedText,
        fileName: file.originalname,
        fileUrl: fileUrl,
        projectId: project.id,
        status: 'pending',
        extractedData: {
          name: candidateName,
          email: applicationData.email,
          phone: applicationData.phone,
        }
      });

      const savedCandidate = await this.candidateRepository.save(candidate);

      // Déclencher l'analyse automatique (utiliser la méthode du service candidates)
      // On ne peut pas injecter CandidatesService ici à cause des dépendances circulaires
      // On va donc créer une méthode simplifiée d'analyse ou déléguer à un service séparé
      this.logger.log(`New job application received for ${project.name}: ${candidateName}`);

      return {
        success: true,
        message: 'Votre candidature a été reçue avec succès et sera analysée prochainement',
        candidateId: savedCandidate.id
      };
    } catch (error) {
      this.logger.error('Error processing job application:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process job application');
    }
  }

  async uploadOfferDocument(id: string, companyId: string, file: Express.Multer.File): Promise<Project> {
    const project = await this.findOne(id, companyId);

    if (!file) {
      throw new NotFoundException('Aucun fichier fourni');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new NotFoundException('Seuls les fichiers PDF sont autorisés');
    }

    try {
      // Upload du fichier vers Azure Storage
      const documentUrl = await this.azureStorageService.uploadOfferDocument(
        file.buffer,
        file.originalname
      );

      // Mise à jour du projet avec l'URL du document
      await this.projectRepository.update(id, {
        offerDocumentUrl: documentUrl,
        offerDocumentFileName: file.originalname,
      });

      this.logger.log(`Offer document uploaded successfully for project ${id}`);
      return this.findOne(id, companyId);
    } catch (error) {
      this.logger.error('Error uploading offer document:', error);
      throw new NotFoundException('Erreur lors de l\'upload du document');
    }
  }
}