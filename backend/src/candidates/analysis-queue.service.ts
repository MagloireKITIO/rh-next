import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TogetherAIService } from '../ai/together-ai.service';
import { ProjectWebSocketGateway } from '../websocket/websocket.gateway';
import { AnalysisService } from '../analysis/analysis.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { Candidate } from './entities/candidate.entity';

interface QueueItem {
  candidateId: string;
  candidate: any;
  project: any;
  timestamp: Date;
}

interface ProjectQueue {
  items: QueueItem[];
  isProcessing: boolean;
  totalItems: number;
  processedItems: number;
  startTime: Date | null;
  activeWorkers: number;
  maxWorkers: number;
}

@Injectable()
export class AnalysisQueueService {
  private readonly logger = new Logger(AnalysisQueueService.name);
  private readonly queues: Map<string, ProjectQueue> = new Map();
  private readonly DELAY_BETWEEN_REQUESTS = 1500; // 1.5 secondes entre les requêtes
  private readonly MAX_PARALLEL_WORKERS = 3; // Nombre max de workers parallèles

  constructor(
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    private togetherAIService: TogetherAIService,
    private webSocketGateway: ProjectWebSocketGateway,
    private analysisService: AnalysisService,
    private apiKeysService: ApiKeysService,
  ) {}

  /**
   * Ajoute un candidat à la queue d'analyse pour un projet
   */
  async addToQueue(candidateId: string, candidate: any, project: any): Promise<void> {
    const projectId = project.id;
    
    if (!this.queues.has(projectId)) {
      // Déterminer le nombre max de workers basé sur les clés API disponibles
      const activeKeys = await this.apiKeysService.findActive();
      const maxWorkers = Math.max(1, activeKeys.length); // Au minimum 1 worker
      
      this.queues.set(projectId, {
        items: [],
        isProcessing: false,
        totalItems: 0,
        processedItems: 0,
        startTime: null,
        activeWorkers: 0,
        maxWorkers: maxWorkers,
      });
      
      this.logger.log(`Queue created for project ${projectId} with ${maxWorkers} max workers (based on ${activeKeys.length} active API keys)`);
    }

    const queue = this.queues.get(projectId)!;
    queue.items.push({
      candidateId,
      candidate,
      project,
      timestamp: new Date(),
    });
    queue.totalItems++;

    this.logger.log(`Added candidate ${candidateId} to queue for project ${projectId}. Queue size: ${queue.items.length}`);

    // Envoyer mise à jour de la queue
    this.emitQueueUpdate(projectId);

    // Démarrer des workers si nécessaire
    this.startWorkersIfNeeded(projectId);
  }

  /**
   * Démarre des workers si nécessaire
   */
  private startWorkersIfNeeded(projectId: string): void {
    const queue = this.queues.get(projectId);
    if (!queue || queue.items.length === 0) {
      return;
    }

    // Calculer combien de workers on peut démarrer
    const availableWorkers = queue.maxWorkers - queue.activeWorkers;
    const neededWorkers = Math.min(availableWorkers, queue.items.length);

    if (neededWorkers <= 0) {
      return;
    }

    // Démarrer le processus si c'est le premier worker
    if (queue.activeWorkers === 0) {
      queue.isProcessing = true;
      queue.startTime = new Date();
      this.logger.log(`Starting parallel queue processing for project ${projectId} with ${queue.items.length} items using ${queue.maxWorkers} parallel workers`);
      this.emitQueueUpdate(projectId);
    }

    // Démarrer les workers
    for (let i = 0; i < neededWorkers; i++) {
      this.startWorker(projectId, i + queue.activeWorkers);
    }

    queue.activeWorkers += neededWorkers;
    this.logger.log(`Started ${neededWorkers} workers for project ${projectId}. Total active: ${queue.activeWorkers}`);
  }

  /**
   * Démarre un worker individuel
   */
  private async startWorker(projectId: string, workerId: number): Promise<void> {
    const queue = this.queues.get(projectId);
    if (!queue) return;

    this.logger.log(`Worker ${workerId} started for project ${projectId}`);

    try {
      while (queue.items.length > 0) {
        // Prendre un item de la queue de façon thread-safe
        const item = queue.items.shift();
        if (!item) break;

        try {
          // Attendre avant traitement pour éviter rate limits
          await this.delay(Math.random() * 1000 + 500); // 500ms-1500ms random

          // Traiter l'analyse
          await this.processAnalysis(item);
          queue.processedItems++;

          // Envoyer mise à jour de progression
          this.emitQueueUpdate(projectId);

          this.logger.log(`Worker ${workerId} processed candidate ${item.candidateId}. Progress: ${queue.processedItems}/${queue.totalItems}`);

        } catch (error) {
          this.logger.error(`Worker ${workerId} failed to process candidate ${item.candidateId}:`, error);
          
          // Envoyer erreur via WebSocket
          this.webSocketGateway.emitAnalysisUpdate(projectId, {
            type: 'analysis_error',
            projectId,
            candidateId: item.candidateId,
            error: error.message,
            timestamp: new Date().toISOString(),
          });

          queue.processedItems++;
          this.emitQueueUpdate(projectId);
        }

        // Délai entre les requêtes du même worker
        await this.delay(this.DELAY_BETWEEN_REQUESTS);
      }

    } finally {
      // Worker terminé
      queue.activeWorkers--;
      this.logger.log(`Worker ${workerId} finished for project ${projectId}. Remaining workers: ${queue.activeWorkers}`);

      // Si c'est le dernier worker, marquer la queue comme terminée
      if (queue.activeWorkers === 0) {
        queue.isProcessing = false;
        this.logger.log(`All workers completed for project ${projectId}`);
        this.emitQueueUpdate(projectId, true);
      }
    }
  }

  /**
   * Traite l'analyse d'un candidat
   */
  private async processAnalysis(item: QueueItem): Promise<void> {
    const { candidateId, candidate, project } = item;

    try {
      // Analyser avec Together AI
      const aiAnalysis = await this.togetherAIService.analyzeCV(
        candidate.extractedText,
        project.jobDescription,
        project.customPrompt
      );

      // Sauvegarder l'analyse
      const analysis = await this.analysisService.create({
        projectId: project.id,
        candidateId: candidateId,
        aiResponse: JSON.stringify(aiAnalysis),
        analysisData: aiAnalysis,
        score: parseFloat(aiAnalysis.score?.toString() || '0'),
        summary: aiAnalysis.summary || '',
        strengths: aiAnalysis.strengths || null,
        weaknesses: aiAnalysis.weaknesses || null,
        recommendations: aiAnalysis.recommendations || null,
      });

      // Mettre à jour le candidat
      await this.updateCandidateWithAnalysis(candidate, aiAnalysis);

      // Émettre l'événement de fin d'analyse
      this.webSocketGateway.emitAnalysisUpdate(project.id, {
        type: 'analysis_completed',
        projectId: project.id,
        candidate: candidate,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      // Re-lancer l'erreur pour qu'elle soit gérée par processQueue
      throw error;
    }
  }

  /**
   * Met à jour le candidat avec les résultats de l'analyse
   */
  private async updateCandidateWithAnalysis(candidate: any, aiAnalysis: any): Promise<void> {
    try {
      const updateData: Partial<Candidate> = {
        score: parseFloat(aiAnalysis.score?.toString() || '0'),
        status: 'analyzed',
        summary: aiAnalysis.summary || '',
      };
      
      // Extraire les données du CV si disponibles
      if (aiAnalysis.extractedData) {
        updateData.extractedData = aiAnalysis.extractedData;
        
        // Mettre à jour les champs de base si extraits
        if (aiAnalysis.extractedData.name && candidate.name === 'Candidat Inconnu') {
          updateData.name = aiAnalysis.extractedData.name;
        }
        if (aiAnalysis.extractedData.email) {
          updateData.email = aiAnalysis.extractedData.email;
        }
        if (aiAnalysis.extractedData.phone) {
          updateData.phone = aiAnalysis.extractedData.phone;
        }
      }

      await this.candidateRepository.update(candidate.id, updateData);
      
      // Mettre à jour l'objet candidate en mémoire pour les WebSocket events
      Object.assign(candidate, updateData);
      
    } catch (error) {
      this.logger.error('Error updating candidate with analysis:', error);
    }
  }

  /**
   * Émet une mise à jour de la queue via WebSocket
   */
  private emitQueueUpdate(projectId: string, completed = false): void {
    const queue = this.queues.get(projectId);
    if (!queue) return;

    const progress = {
      total: queue.totalItems,
      processed: queue.processedItems,
      remaining: queue.items.length,
      isProcessing: queue.isProcessing,
      estimatedTimeRemaining: this.calculateEstimatedTime(queue),
      percentComplete: queue.totalItems > 0 ? Math.round((queue.processedItems / queue.totalItems) * 100) : 0,
    };

    this.webSocketGateway.emitAnalysisUpdate(projectId, {
      type: completed ? 'queue_completed' : 'queue_progress',
      projectId,
      progress,
      timestamp: new Date().toISOString(),
    });

    // Nettoyer la queue si terminée
    if (completed) {
      this.queues.delete(projectId);
    }
  }

  /**
   * Calcule le temps restant estimé
   */
  private calculateEstimatedTime(queue: ProjectQueue): string {
    if (!queue.startTime || queue.processedItems === 0) {
      return 'Calcul en cours...';
    }

    const elapsedMs = Date.now() - queue.startTime.getTime();
    const avgTimePerItem = elapsedMs / queue.processedItems;
    const remainingItems = queue.items.length;
    const estimatedRemainingMs = remainingItems * avgTimePerItem;

    if (estimatedRemainingMs < 60000) {
      return `${Math.ceil(estimatedRemainingMs / 1000)} secondes`;
    } else if (estimatedRemainingMs < 3600000) {
      return `${Math.ceil(estimatedRemainingMs / 60000)} minutes`;
    } else {
      const hours = Math.floor(estimatedRemainingMs / 3600000);
      const minutes = Math.ceil((estimatedRemainingMs % 3600000) / 60000);
      return `${hours}h ${minutes}min`;
    }
  }

  /**
   * Utilitaire pour créer un délai
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtient le statut de la queue pour un projet
   */
  getQueueStatus(projectId: string): any {
    const queue = this.queues.get(projectId);
    if (!queue) {
      return { isProcessing: false, total: 0, processed: 0, remaining: 0 };
    }

    return {
      isProcessing: queue.isProcessing,
      total: queue.totalItems,
      processed: queue.processedItems,
      remaining: queue.items.length,
      percentComplete: queue.totalItems > 0 ? Math.round((queue.processedItems / queue.totalItems) * 100) : 0,
      estimatedTimeRemaining: this.calculateEstimatedTime(queue),
    };
  }

  /**
   * Annule la queue d'un projet (si nécessaire)
   */
  cancelQueue(projectId: string): void {
    const queue = this.queues.get(projectId);
    if (queue) {
      queue.items = [];
      queue.isProcessing = false;
      this.queues.delete(projectId);
      
      this.webSocketGateway.emitAnalysisUpdate(projectId, {
        type: 'queue_cancelled',
        projectId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Cancelled queue for project ${projectId}`);
    }
  }
}