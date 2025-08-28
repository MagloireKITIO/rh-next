import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { TogetherAIService } from '../ai/together-ai.service';
import { AnalysisService } from '../analysis/analysis.service';
import { StorageService } from '../storage/storage.service';
import { ProjectWebSocketGateway } from '../websocket/websocket.gateway';
import { AnalysisQueueService } from './analysis-queue.service';
import * as pdf from 'pdf-parse';
import * as fs from 'fs';

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
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectDataSource()
    private dataSource: DataSource,
    private togetherAIService: TogetherAIService,
    private analysisService: AnalysisService,
    private storageService: StorageService,
    private webSocketGateway: ProjectWebSocketGateway,
    private analysisQueueService: AnalysisQueueService,
  ) {}

  private extractNameFromFilename(filename: string): string | null {
    try {
      // Supprimer l'extension
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      
      // Patterns pour extraire le nom
      const patterns = [
        // CV_Prenom_NOM ou Curriculum_Vitae_FR-_Prenom_NOM
        /(?:CV|Curriculum|Resume).*?([A-Za-z]+)[_\-\s]+([A-Za-z]+)/i,
        // Prenom_NOM_CV ou NOM_Prenom
        /^([A-Za-z]+)[_\-\s]+([A-Za-z]+)/i,
        // Juste un nom si rien d'autre ne marche
        /([A-Za-z]{2,})/i
      ];

      for (const pattern of patterns) {
        const match = nameWithoutExt.match(pattern);
        if (match) {
          if (match[2]) {
            // Prénom + Nom
            return `${match[1]} ${match[2]}`.replace(/[_\-]/g, ' ');
          } else if (match[1]) {
            // Juste un nom
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

  async create(createCandidateDto: CreateCandidateDto): Promise<Candidate> {
    const candidate = this.candidateRepository.create(createCandidateDto);
    return await this.candidateRepository.save(candidate);
  }

  async findAll(companyId: string, page: number = 1, limit: number = 50): Promise<PaginatedResponse<Candidate>> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.candidateRepository.findAndCount({
      relations: ['project'],
      where: { project: { company_id: companyId } },
      order: { score: 'DESC' },
      skip,
      take: limit,
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

  // Méthode pour récupérer tous les candidats d'un projet (pour usage interne)
  async findAllByProject(projectId: string, companyId: string): Promise<Candidate[]> {
    return await this.candidateRepository.find({
      where: { projectId, project: { company_id: companyId } },
      relations: ['project', 'analyses'],
      order: { score: 'DESC' },
    });
  }

  async findByProject(projectId: string, companyId: string, page: number = 1, limit: number = 50): Promise<PaginatedResponse<Candidate>> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.candidateRepository.findAndCount({
      where: { projectId, project: { company_id: companyId } },
      relations: ['project', 'analyses'],
      order: { score: 'DESC' },
      skip,
      take: limit,
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

  async findOne(id: string, companyId: string): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { id, project: { company_id: companyId } },
      relations: ['project', 'analyses'],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found in your company`);
    }

    return candidate;
  }

  async findCandidateInProject(projectId: string, candidateId: string, companyId: string): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { 
        id: candidateId, 
        projectId: projectId,
        project: { company_id: companyId }
      },
      relations: ['project', 'analyses'],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found in project ${projectId} in your company`);
    }

    return candidate;
  }

  async uploadCV(file: Express.Multer.File, projectId: string, project: any): Promise<Candidate> {
    try {
      // Vérifier que le fichier a un buffer valide
      if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
        throw new Error('Invalid file buffer');
      }

      // Vérifier que c'est bien un PDF
      if (file.mimetype !== 'application/pdf') {
        throw new Error('Only PDF files are supported');
      }

      // Limite critique de taille : 10MB max
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.buffer.length > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB, got ${Math.round(file.buffer.length / 1024 / 1024 * 10) / 10}MB`);
      }

      // Extraire le texte du PDF
      let extractedText = '';
      let candidateName = 'Candidat Inconnu';
      
      try {
        const pdfData = await pdf(file.buffer);
        extractedText = pdfData.text?.trim() || '';
        
        // Forcer le nettoyage de la mémoire après traitement PDF
        delete pdfData.text;
        if (global.gc) {
          global.gc();
        }
        
        // Vérifier si l'extraction a réussi
        if (!extractedText || extractedText.length < 10) {
          this.logger.warn(`PDF text extraction failed or resulted in minimal content for file: ${file.originalname}`);
          extractedText = `[PDF extraction failed] File: ${file.originalname}`;
        } else {
          // Extraire le nom basique (première ligne non vide)
          const lines = extractedText.split('\n').filter(line => line.trim());
          candidateName = lines[0]?.trim() || 'Candidat Inconnu';
          this.logger.log(`Successfully extracted ${extractedText.length} characters from PDF`);
        }
      } catch (error) {
        this.logger.error(`Error extracting text from PDF ${file.originalname}:`, error);
        extractedText = `[PDF processing error] File: ${file.originalname} - Error: ${error.message}`;
      }

      // Fallback pour le nom : extraire depuis le nom du fichier si nécessaire
      if (candidateName === 'Candidat Inconnu') {
        candidateName = this.extractNameFromFilename(file.originalname) || 'Candidat Inconnu';
      }

      // Sauvegarder le fichier (Supabase ou disque local)
      let fileUrl: string;
      let filename: string;

      if (this.storageService.isSupabaseConfigured()) {
        // Utiliser Supabase
        try {
          fileUrl = await this.storageService.uploadFile(
            file.buffer, 
            file.originalname, 
            file.mimetype
          );
          filename = file.originalname;
          this.logger.log(`File uploaded to Supabase: ${fileUrl}`);
        } catch (error) {
          this.logger.warn('Supabase upload failed, falling back to local storage');
          // Fallback vers stockage local
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
          filename = `${randomName}.pdf`;
          const uploadDir = './uploads';
          
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const filePath = `${uploadDir}/${filename}`;
          fs.writeFileSync(filePath, file.buffer);
          fileUrl = `uploads/${filename}`;
        }
      } else {
        // Stockage local uniquement
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        filename = `${randomName}.pdf`;
        const uploadDir = './uploads';
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = `${uploadDir}/${filename}`;
        fs.writeFileSync(filePath, file.buffer);
        fileUrl = `uploads/${filename}`;
      }

      // Créer le candidat
      const candidate = await this.create({
        name: candidateName,
        extractedText,
        fileName: file.originalname,
        fileUrl: fileUrl, // URL du fichier (Supabase ou local)
        projectId,
        status: 'pending',
      });

      // Ajouter à la queue d'analyse
      await this.analysisQueueService.addToQueue(candidate.id, candidate, project);

      return candidate;
    } catch (error) {
      this.logger.error('Error processing CV:', error);
      throw new Error('Failed to process CV file');
    }
  }

  async analyzeCandidate(candidateId: string, companyId: string, project?: any): Promise<void> {
    const candidate = await this.findOne(candidateId, companyId);
    
    if (!project) {
      project = candidate.project;
    }

    try {
      this.logger.log(`Starting analysis for candidate ${candidate.name}`);
      
      // Émettre l'événement de début d'analyse
      this.webSocketGateway.emitAnalysisStarted(project.id, candidateId);

      // Analyser avec Together AI en utilisant les clés de l'entreprise
      const aiAnalysis = await this.togetherAIService.analyzeCV(
        candidate.extractedText,
        project.jobDescription,
        project.customPrompt,
        project.company_id
      );

      // Mettre à jour le candidat avec les résultats
      const previousScore = candidate.score;
      await this.candidateRepository.update(candidateId, {
        score: aiAnalysis.score,
        previousScore,
        summary: aiAnalysis.summary,
        extractedData: aiAnalysis.extractedData,
        status: 'analyzed',
        email: aiAnalysis.extractedData?.email || candidate.email,
        phone: aiAnalysis.extractedData?.phone || candidate.phone,
      });

      // Sauvegarder l'analyse complète
      await this.analysisService.create({
        projectId: project.id,
        candidateId,
        aiResponse: JSON.stringify(aiAnalysis),
        analysisData: aiAnalysis,
        score: aiAnalysis.score,
        summary: aiAnalysis.summary,
        strengths: aiAnalysis.strengths,
        weaknesses: aiAnalysis.weaknesses,
        recommendations: aiAnalysis.recommendations,
        hrDecision: aiAnalysis.hrDecision,
        skillsMatch: aiAnalysis.skillsMatch,
        risks: aiAnalysis.risks,
      });

      // Recalculer les rankings
      await this.updateRankings(project.id, companyId);

      // Récupérer le candidat mis à jour avec toutes les relations
      const updatedCandidate = await this.findOne(candidateId, companyId);
      
      this.logger.log(`Candidate ${candidate.name} ranking updated to: ${updatedCandidate.ranking}`);
      
      // Émettre l'événement de fin d'analyse
      this.webSocketGateway.emitAnalysisCompleted(project.id, updatedCandidate);

      this.logger.log(`Analysis completed for candidate ${candidate.name} with score ${aiAnalysis.score}`);
    } catch (error) {
      this.logger.error(`Analysis failed for candidate ${candidateId}:`, error);
      await this.candidateRepository.update(candidateId, {
        status: 'error',
        summary: 'Analysis failed - please retry',
      });
      
      // Émettre l'événement d'erreur d'analyse
      this.webSocketGateway.emitAnalysisError(project.id, candidateId, error.message);
    }
  }

  async updateRankings(projectId: string, companyId: string): Promise<void> {
    const candidates = await this.findAllByProject(projectId, companyId);
    
    // Trier par score décroissant
    candidates.sort((a, b) => Number(b.score) - Number(a.score));

    // Mettre à jour les rankings
    for (let i = 0; i < candidates.length; i++) {
      await this.candidateRepository.update(candidates[i].id, {
        ranking: i + 1,
      });
    }
  }

  async getRankingChanges(projectId: string, companyId: string) {
    const candidates = await this.findAllByProject(projectId, companyId);
    
    return candidates.map(candidate => {
      const currentScore = Number(candidate.score);
      const previousScore = Number(candidate.previousScore || 0);
      const scoreDiff = currentScore - previousScore;
      
      let trend = 'stable';
      if (scoreDiff > 0) trend = 'up';
      if (scoreDiff < 0) trend = 'down';

      return {
        id: candidate.id,
        name: candidate.name,
        currentScore,
        previousScore,
        scoreDiff,
        trend,
        ranking: candidate.ranking,
      };
    });
  }

  async remove(id: string): Promise<void> {
    // Transaction atomique pour supprimer candidat + analyses
    return await this.dataSource.transaction(async manager => {
      
      // 1. Vérifier que le candidat existe
      const candidate = await manager.findOne(Candidate, {
        where: { id },
        select: ['id', 'name', 'projectId'] // Optimiser la requête
      });

      if (!candidate) {
        throw new NotFoundException(`Candidate with ID ${id} not found`);
      }

      this.logger.log(`Starting transactional deletion of candidate ${candidate.name} (${id})`);

      // 2. Compter les analyses à supprimer
      const analysisCount = await manager.count('Analysis', { where: { candidateId: id } });
      
      if (analysisCount > 0) {
        this.logger.log(`Found ${analysisCount} analyses to delete`);
        
        // 3. Supprimer les analyses en premier (dépendance)
        await manager.delete('Analysis', { candidateId: id });
        this.logger.log(`✅ Deleted ${analysisCount} analyses atomically`);
      }

      // 4. Supprimer le candidat
      const result = await manager.delete(Candidate, { id });
      if (result.affected === 0) {
        throw new NotFoundException(`Candidate with ID ${id} not found during deletion`);
      }

      this.logger.log(`✅ Successfully deleted candidate ${candidate.name} and all analyses atomically`);
      
      // 🎯 Notifier via WebSocket du changement (après commit)
      // On utilisera un hook post-transaction pour cela
      setImmediate(() => {
        this.webSocketGateway.emitToProject(candidate.projectId, 'candidate:deleted', {
          candidateId: id,
          projectId: candidate.projectId
        });
      });
    });
  }

  /**
   * Suppression en lot avec transaction (pour les opérations de nettoyage)
   */
  async removeBulk(candidateIds: string[], companyId?: string): Promise<{ deleted: number; errors: string[] }> {
    if (!candidateIds || candidateIds.length === 0) {
      return { deleted: 0, errors: [] };
    }

    return await this.dataSource.transaction(async manager => {
      const results = { deleted: 0, errors: [] };
      
      // 1. Vérifier que tous les candidats existent et appartiennent à l'entreprise
      const whereCondition: any = { id: candidateIds };
      if (companyId) {
        // Join avec project pour vérifier company_id si nécessaire
        const candidates = await manager
          .createQueryBuilder(Candidate, 'candidate')
          .innerJoin('candidate.project', 'project')
          .where('candidate.id IN (:...ids)', { ids: candidateIds })
          .andWhere('project.company_id = :companyId', { companyId })
          .select(['candidate.id', 'candidate.name'])
          .getMany();
          
        if (candidates.length !== candidateIds.length) {
          const foundIds = candidates.map(c => c.id);
          const missingIds = candidateIds.filter(id => !foundIds.includes(id));
          results.errors.push(...missingIds.map(id => `Candidate ${id} not found or access denied`));
        }
        
        const validIds = candidates.map(c => c.id);
        if (validIds.length === 0) {
          return results;
        }
        whereCondition.id = validIds;
      }

      try {
        // 2. Supprimer toutes les analyses en lot
        const analysisResult = await manager.delete('Analysis', { candidateId: whereCondition.id });
        this.logger.log(`✅ Deleted ${analysisResult.affected} analyses in bulk`);

        // 3. Supprimer tous les candidats en lot  
        const candidateResult = await manager.delete(Candidate, whereCondition);
        results.deleted = candidateResult.affected || 0;
        
        this.logger.log(`✅ Successfully deleted ${results.deleted} candidates and their analyses atomically`);
        
      } catch (error) {
        this.logger.error('Error during bulk deletion:', error);
        results.errors.push(`Bulk deletion failed: ${error.message}`);
      }
      
      return results;
    });
  }
}