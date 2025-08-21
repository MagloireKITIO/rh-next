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

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove client from all project rooms
    for (const [projectId, clients] of this.projectRooms.entries()) {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.projectRooms.delete(projectId);
        }
        this.logger.log(`Client ${client.id} left project room: ${projectId}`);
      }
    }
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(
    @MessageBody() data: { projectId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { projectId } = data;
    
    // Join the project room
    client.join(`project-${projectId}`);
    
    // Track client in project room
    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set());
    }
    this.projectRooms.get(projectId).add(client.id);
    
    this.logger.log(`Client ${client.id} joined project room: ${projectId}`);
    
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
    
    this.logger.log(`Client ${client.id} left project room: ${projectId}`);
    
    return { status: 'left', projectId };
  }

  // Methods to emit events to specific project rooms
  emitToProject(projectId: string, event: string, data: any) {
    this.server.to(`project-${projectId}`).emit(event, data);
    this.logger.log(`Emitted ${event} to project ${projectId}:`, data);
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
}