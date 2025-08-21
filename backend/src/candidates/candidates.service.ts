import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { TogetherAIService } from '../ai/together-ai.service';
import { AnalysisService } from '../analysis/analysis.service';
import { StorageService } from '../storage/storage.service';
import { ProjectWebSocketGateway } from '../websocket/websocket.gateway';
import { AnalysisQueueService } from './analysis-queue.service';
import * as pdf from 'pdf-parse';
import * as fs from 'fs';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
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

  async findAll(companyId: string): Promise<Candidate[]> {
    return await this.candidateRepository.find({
      relations: ['project'],
      where: { project: { company_id: companyId } },
      order: { score: 'DESC' },
    });
  }

  async findByProject(projectId: string, companyId: string): Promise<Candidate[]> {
    return await this.candidateRepository.find({
      where: { projectId, project: { company_id: companyId } },
      relations: ['project', 'analyses'],
      order: { score: 'DESC' },
    });
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

      // Extraire le texte du PDF
      let extractedText = '';
      let candidateName = 'Candidat Inconnu';
      
      try {
        const pdfData = await pdf(file.buffer);
        extractedText = pdfData.text?.trim() || '';
        
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

      // Analyser avec Together AI
      const aiAnalysis = await this.togetherAIService.analyzeCV(
        candidate.extractedText,
        project.jobDescription,
        project.customPrompt
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
      });

      // Recalculer les rankings
      await this.updateRankings(project.id, companyId);

      // Récupérer le candidat mis à jour avec toutes les relations
      const updatedCandidate = await this.findOne(candidateId, companyId);
      
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
    const candidates = await this.findByProject(projectId, companyId);
    
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
    const candidates = await this.findByProject(projectId, companyId);
    
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
    // Vérifier que le candidat existe
    const candidate = await this.candidateRepository.findOne({
      where: { id },
      relations: ['analyses']
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    // Supprimer toutes les analyses liées d'abord
    if (candidate.analyses && candidate.analyses.length > 0) {
      await this.analysisService.removeByCandidate(id);
    }

    // Maintenant supprimer le candidat
    const result = await this.candidateRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }
  }
}