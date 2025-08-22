import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ProjectWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('WebSocketGateway');
  private projectRooms = new Map<string, Set<string>>(); // projectId -> Set of socketIds
  
  // Protection mémoire pour WebSocket rooms
  private readonly MAX_ROOMS = 200; // Max 200 rooms simultanées
  private cleanupTimer: NodeJS.Timeout | null = null;

  handleConnection(client: Socket) {
    // Démarrer le nettoyage automatique des rooms au premier client
    if (!this.cleanupTimer) {
      this.startRoomCleanup();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove client from all project rooms
    for (const [projectId, clients] of this.projectRooms.entries()) {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.projectRooms.delete(projectId);
        }
      }
    }
    
    // Nettoyage immédiat après déconnexion
    this.cleanupEmptyRooms();
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(
    @MessageBody() data: { projectId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { projectId } = data;
    
    // Protection contre l'accumulation excessive de rooms
    if (this.projectRooms.size >= this.MAX_ROOMS) {
      this.cleanupOldestRooms(10);
    }
    
    // Join the project room
    client.join(`project-${projectId}`);
    
    // Track client in project room
    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set());
    }
    this.projectRooms.get(projectId).add(client.id);
    
    return { status: 'joined', projectId };
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(
    @MessageBody() data: { projectId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { projectId } = data;
    
    // Leave the project room
    client.leave(`project-${projectId}`);
    
    // Remove client from tracking
    if (this.projectRooms.has(projectId)) {
      this.projectRooms.get(projectId).delete(client.id);
      if (this.projectRooms.get(projectId).size === 0) {
        this.projectRooms.delete(projectId);
      }
    }
    
    // Client left project room silently
    
    return { status: 'left', projectId };
  }

  // Methods to emit events to specific project rooms
  emitToProject(projectId: string, event: string, data: any) {
    this.server.to(`project-${projectId}`).emit(event, data);
  }

  emitCandidateUpdate(projectId: string, candidate: any) {
    this.emitToProject(projectId, 'candidateUpdate', {
      type: 'candidate_updated',
      projectId,
      candidate,
      timestamp: new Date().toISOString(),
    });
  }

  emitAnalysisStarted(projectId: string, candidateId: string) {
    this.emitToProject(projectId, 'analysisUpdate', {
      type: 'analysis_started',
      projectId,
      candidateId,
      timestamp: new Date().toISOString(),
    });
  }

  emitAnalysisCompleted(projectId: string, candidate: any) {
    this.emitToProject(projectId, 'analysisUpdate', {
      type: 'analysis_completed',
      projectId,
      candidate,
      timestamp: new Date().toISOString(),
    });
  }

  emitAnalysisError(projectId: string, candidateId: string, error: string) {
    this.emitToProject(projectId, 'analysisUpdate', {
      type: 'analysis_error',
      projectId,
      candidateId,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  // Generic method to emit any analysis update
  emitAnalysisUpdate(projectId: string, data: any) {
    this.emitToProject(projectId, 'analysisUpdate', data);
  }

  /**
   * Démarre le nettoyage automatique des rooms
   */
  private startRoomCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupEmptyRooms();
      this.logRoomStats();
    }, 5 * 60 * 1000); // Nettoyage toutes les 5 minutes
  }

  /**
   * Nettoie les rooms vides
   */
  private cleanupEmptyRooms(): void {
    let cleanedCount = 0;
    
    for (const [projectId, clients] of this.projectRooms.entries()) {
      if (clients.size === 0) {
        this.projectRooms.delete(projectId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.log(`🧹 WebSocket: Cleaned ${cleanedCount} empty rooms, ${this.projectRooms.size} remaining`);
    }
  }

  /**
   * Supprime les rooms les plus anciennes (basé sur projectId comme proxy)
   */
  private cleanupOldestRooms(count: number): void {
    const roomEntries = Array.from(this.projectRooms.entries());
    const toRemove = roomEntries.slice(0, Math.min(count, roomEntries.length));
    
    for (const [projectId] of toRemove) {
      this.projectRooms.delete(projectId);
    }
    
    if (toRemove.length > 0) {
      this.logger.warn(`🚨 WebSocket: Removed ${toRemove.length} oldest rooms (max capacity reached)`);
    }
  }

  /**
   * Log les statistiques des rooms si nécessaire
   */
  private logRoomStats(): void {
    const totalClients = Array.from(this.projectRooms.values())
      .reduce((sum, clients) => sum + clients.size, 0);
    
    if (this.projectRooms.size > 50 || totalClients > 100) {
      this.logger.warn(`📊 WebSocket stats: ${this.projectRooms.size} rooms, ${totalClients} clients`);
    }
  }

  /**
   * Nettoyage lors de l'arrêt du service
   */
  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.logger.log('🛑 WebSocket room cleanup stopped');
    }
  }
}