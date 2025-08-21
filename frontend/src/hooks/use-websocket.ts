"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketEvents {
  candidateUpdate: (data: any) => void;
  analysisUpdate: (data: any) => void;
  queue_progress: (data: any) => void;
  queue_completed: (data: any) => void;
  analysis_completed: (data: any) => void;
  analysis_started: (data: any) => void;
  analysis_error: (data: any) => void;
}

interface UseWebSocketProps {
  projectId?: string;
  enabled?: boolean;
}

export function useWebSocket({ projectId, enabled = true }: UseWebSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventHandlersRef = useRef<Partial<WebSocketEvents>>({});

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    try {
      const socket = io(backendUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setError(`Connection error: ${error.message}`);
        setIsConnected(false);
      });

      // Set up event listeners
      socket.on('candidateUpdate', (data) => {
        eventHandlersRef.current.candidateUpdate?.(data);
      });

      socket.on('analysisUpdate', (data) => {
        eventHandlersRef.current.analysisUpdate?.(data);
        
        // Propager les événements spécifiques basés sur le type
        if (data.type) {
          const eventType = data.type as keyof WebSocketEvents;
          if (eventHandlersRef.current[eventType]) {
            eventHandlersRef.current[eventType]?.(data);
          }
        }
      });

      return () => {
        socket.disconnect();
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setError(`Failed to initialize: ${error}`);
    }
  }, [enabled]);

  // Join/leave project room when projectId changes
  useEffect(() => {
    if (!socketRef.current || !projectId || !isConnected) return;

    console.log(`Joining project room: ${projectId}`);
    socketRef.current.emit('joinProject', { projectId });

    return () => {
      if (socketRef.current && projectId) {
        console.log(`Leaving project room: ${projectId}`);
        socketRef.current.emit('leaveProject', { projectId });
      }
    };
  }, [projectId, isConnected]);

  // Methods to register event handlers
  const on = (event: keyof WebSocketEvents, handler: WebSocketEvents[keyof WebSocketEvents]) => {
    eventHandlersRef.current[event] = handler as any;
  };

  const off = (event: keyof WebSocketEvents) => {
    delete eventHandlersRef.current[event];
  };

  // Method to emit events
  const emit = (event: string, data?: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit event: WebSocket not connected');
    }
  };

  return {
    isConnected,
    error,
    on,
    off,
    emit,
    socket: socketRef.current,
  };
}