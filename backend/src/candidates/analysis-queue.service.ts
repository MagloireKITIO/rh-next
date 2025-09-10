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
  
  // Protection mémoire - nettoyage automatique
  private readonly MAX_QUEUE_AGE_MS = 2 * 60 * 60 * 1000; // 2 heures max
  private readonly CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // Nettoyage toutes les 15 min
  private readonly MAX_CONCURRENT_PROJECTS = 50; // Max 50 projets simultanés
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    private togetherAIService: TogetherAIService,
    private webSocketGateway: ProjectWebSocketGateway,
    private analysisService: AnalysisService,
    private apiKeysService: ApiKeysService,
  ) {
    // Démarrer le nettoyage automatique
    this.startAutomaticCleanup();
  }

  /**
   * Ajoute un candidat à la queue d'analyse pour un projet
   */
  async addToQueue(candidateId: string, candidate: any, project: any): Promise<void> {
    const projectId = project.id;
    
    // Protection contre l'accumulation excessive
    if (this.queues.size >= this.MAX_CONCURRENT_PROJECTS) {
      this.cleanupOldestQueues(5);
      this.logger.warn(`🚨 Max concurrent projects reached (${this.queues.size}), cleaned oldest queues`);
    }
    
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

    // Logs removed for memory efficiency

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

          // Progress logs removed for memory efficiency

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
      // Worker completion logs removed for memory efficiency

      // Si c'est le dernier worker, marquer la queue comme terminée
      if (queue.activeWorkers === 0) {
        queue.isProcessing = false;
        this.logger.log(`All workers completed for project ${projectId}`);
        
        // Nettoyage intelligent : si queue vide ou tous items traités
        if (queue.items.length === 0 || queue.processedItems >= queue.totalItems) {
          this.emitQueueUpdate(projectId, true); // Ceci supprime la queue
        } else {
          // Queue abandonnée - programmer nettoyage différé
          this.scheduleQueueCleanup(projectId, 30000); // 30 secondes
          this.emitQueueUpdate(projectId, false);
        }
      }
    }
  }

  /**
   * Traite l'analyse d'un candidat
   */
  private async processAnalysis(item: QueueItem): Promise<void> {
    const { candidateId, candidate, project } = item;

    try {
      // Analyser avec Together AI en utilisant les clés de l'entreprise
      const aiAnalysis = await this.togetherAIService.analyzeCV(
        candidate.extractedText,
        project.jobDescription,
        project.customPrompt,
        project.company_id
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
        // Préserver les données du formulaire pour les candidats APPLICATION
        // Utiliser les données extraites seulement si pas de données existantes
        updateData.email = candidate.email || aiAnalysis.extractedData?.email;
        updateData.phone = candidate.phone || aiAnalysis.extractedData?.phone;
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

  /**
   * Démarre le nettoyage automatique en arrière-plan
   */
  private startAutomaticCleanup(): void {
    // Nettoyage toutes les 15 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupAbandonedQueues();
      this.logMemoryUsage();
    }, this.CLEANUP_INTERVAL_MS);

    this.logger.log(`🧹 Automatic cleanup started (every ${this.CLEANUP_INTERVAL_MS / 60000} minutes)`);
  }

  /**
   * Nettoie les queues abandonnées ou trop anciennes
   */
  private cleanupAbandonedQueues(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [projectId, queue] of this.queues.entries()) {
      const isOld = queue.startTime && (now - queue.startTime.getTime()) > this.MAX_QUEUE_AGE_MS;
      const isStuck = !queue.isProcessing && queue.items.length === 0 && queue.activeWorkers === 0;
      
      if (isOld || isStuck) {
        this.queues.delete(projectId);
        cleanedCount++;
        this.logger.log(`🧹 Cleaned ${isOld ? 'old' : 'stuck'} queue for project ${projectId}`);
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`🧹 Cleanup completed: ${cleanedCount} queues removed, ${this.queues.size} remaining`);
    }
  }

  /**
   * Nettoie les queues les plus anciennes
   */
  private cleanupOldestQueues(count: number): void {
    const sortedQueues = Array.from(this.queues.entries())
      .filter(([_, queue]) => !queue.isProcessing) // Ne pas toucher aux queues actives
      .sort(([_, a], [__, b]) => {
        const timeA = a.startTime?.getTime() || 0;
        const timeB = b.startTime?.getTime() || 0;
        return timeA - timeB; // Plus ancien en premier
      });

    for (let i = 0; i < Math.min(count, sortedQueues.length); i++) {
      const [projectId] = sortedQueues[i];
      this.queues.delete(projectId);
      this.logger.log(`🧹 Removed oldest queue for project ${projectId}`);
    }
  }

  /**
   * Programme le nettoyage différé d'une queue
   */
  private scheduleQueueCleanup(projectId: string, delayMs: number): void {
    setTimeout(() => {
      const queue = this.queues.get(projectId);
      if (queue && !queue.isProcessing && queue.activeWorkers === 0) {
        this.queues.delete(projectId);
        this.logger.log(`🧹 Delayed cleanup: removed abandoned queue for project ${projectId}`);
      }
    }, delayMs);
  }

  /**
   * Log l'utilisation mémoire si élevée
   */
  private logMemoryUsage(): void {
    const usage = process.memoryUsage();
    const heapMB = Math.round(usage.heapUsed / 1024 / 1024);
    
    if (heapMB > 300) { // Alerte à partir de 300MB
      this.logger.warn(`🚨 Memory usage: ${heapMB}MB heap (${this.queues.size} active queues)`);
      
      // Si très élevé, forcer un nettoyage
      if (heapMB > 450) {
        this.logger.error(`💥 Critical memory usage: ${heapMB}MB - forcing cleanup`);
        this.cleanupOldestQueues(10);
      }
    }
  }

  /**
   * Nettoyage lors de l'arrêt du service
   */
  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.logger.log('🛑 Automatic cleanup stopped');
    }
  }
}