import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from './use-websocket';

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connect: jest.fn(),
  connected: false,
};

const mockIo = jest.fn(() => mockSocket);

jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: mockIo,
}));

// Mock console methods to avoid noise in tests
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

Object.assign(console, mockConsole);

describe('useWebSocket', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.connected = false;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Socket Initialization', () => {
    it('should initialize socket with default configuration when enabled', () => {
      renderHook(() => useWebSocket({ enabled: true }));

      expect(mockIo).toHaveBeenCalledWith('http://localhost:3001', {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    });

    it('should use custom backend URL from environment', () => {
      process.env.NEXT_PUBLIC_BACKEND_URL = 'https://api.example.com';

      renderHook(() => useWebSocket({ enabled: true }));

      expect(mockIo).toHaveBeenCalledWith('https://api.example.com', expect.any(Object));
    });

    it('should not initialize socket when disabled', () => {
      renderHook(() => useWebSocket({ enabled: false }));

      expect(mockIo).not.toHaveBeenCalled();
    });

    it('should set up connection event handlers', () => {
      renderHook(() => useWebSocket({ enabled: true }));

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('candidateUpdate', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('analysisUpdate', expect.any(Function));
    });
  });

  describe('Connection Status Management', () => {
    it('should update connection status on connect', async () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));

      expect(result.current.isConnected).toBe(false);

      // Simulate connect event
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];

      act(() => {
        connectHandler?.();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should update connection status on disconnect', async () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));

      // First connect
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      act(() => {
        connectHandler?.();
      });

      expect(result.current.isConnected).toBe(true);

      // Then disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
      act(() => {
        disconnectHandler?.();
      });

      expect(result.current.isConnected).toBe(false);
    });

    it('should handle connection errors', async () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));

      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')?.[1];
      const error = { message: 'Connection failed' };

      act(() => {
        errorHandler?.(error);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe('Connection error: Connection failed');
    });

    it('should handle socket initialization errors', () => {
      const error = new Error('Socket initialization failed');
      mockIo.mockImplementationOnce(() => {
        throw error;
      });

      const { result } = renderHook(() => useWebSocket({ enabled: true }));

      expect(result.current.error).toBe('Failed to initialize: Error: Socket initialization failed');
    });
  });

  describe('Project Room Management', () => {
    it('should join project room when projectId is provided and connected', async () => {
      const projectId = 'test-project-123';
      const { result } = renderHook(() => useWebSocket({ projectId, enabled: true }));

      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      act(() => {
        connectHandler?.();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('joinProject', { projectId });
    });

    it('should not join project room when not connected', () => {
      const projectId = 'test-project-123';
      renderHook(() => useWebSocket({ projectId, enabled: true }));

      expect(mockSocket.emit).not.toHaveBeenCalledWith('joinProject', expect.any(Object));
    });

    it('should leave project room when projectId changes', async () => {
      const initialProjectId = 'project-1';
      const newProjectId = 'project-2';

      const { result, rerender } = renderHook(
        ({ projectId }) => useWebSocket({ projectId, enabled: true }),
        { initialProps: { projectId: initialProjectId } }
      );

      // Connect first
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      act(() => {
        connectHandler?.();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('joinProject', { projectId: initialProjectId });

      // Change projectId
      rerender({ projectId: newProjectId });

      expect(mockSocket.emit).toHaveBeenCalledWith('leaveProject', { projectId: initialProjectId });
      expect(mockSocket.emit).toHaveBeenCalledWith('joinProject', { projectId: newProjectId });
    });

    it('should leave project room on unmount', () => {
      const projectId = 'test-project-123';
      const { unmount } = renderHook(() => useWebSocket({ projectId, enabled: true }));

      // Connect first
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      act(() => {
        connectHandler?.();
      });

      unmount();

      expect(mockSocket.emit).toHaveBeenCalledWith('leaveProject', { projectId });
    });
  });

  describe('Event Handler Management', () => {
    it('should register and call candidate update handler', async () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));
      const mockHandler = jest.fn();
      const testData = { candidateId: '123', status: 'updated' };

      // Register handler
      act(() => {
        result.current.on('candidateUpdate', mockHandler);
      });

      // Simulate incoming event
      const candidateUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'candidateUpdate'
      )?.[1];

      act(() => {
        candidateUpdateHandler?.(testData);
      });

      expect(mockHandler).toHaveBeenCalledWith(testData);
    });

    it('should register and call analysis update handler', async () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));
      const mockHandler = jest.fn();
      const mockSpecificHandler = jest.fn();
      const testData = { type: 'analysis_completed', candidateId: '123', score: 85 };

      // Register handlers
      act(() => {
        result.current.on('analysisUpdate', mockHandler);
        result.current.on('analysis_completed', mockSpecificHandler);
      });

      // Simulate incoming event
      const analysisUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'analysisUpdate'
      )?.[1];

      act(() => {
        analysisUpdateHandler?.(testData);
      });

      expect(mockHandler).toHaveBeenCalledWith(testData);
      expect(mockSpecificHandler).toHaveBeenCalledWith(testData);
    });

    it('should handle queue progress events', async () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));
      const mockHandler = jest.fn();
      const testData = { projectId: '123', progress: 50, total: 100 };

      act(() => {
        result.current.on('queue_progress', mockHandler);
      });

      // Simulate analysis update with queue_progress type
      const analysisUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'analysisUpdate'
      )?.[1];

      act(() => {
        analysisUpdateHandler?.({ ...testData, type: 'queue_progress' });
      });

      expect(mockHandler).toHaveBeenCalledWith({ ...testData, type: 'queue_progress' });
    });

    it('should remove event handlers with off method', async () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));
      const mockHandler = jest.fn();

      // Register handler
      act(() => {
        result.current.on('candidateUpdate', mockHandler);
      });

      // Remove handler
      act(() => {
        result.current.off('candidateUpdate');
      });

      // Simulate event
      const candidateUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'candidateUpdate'
      )?.[1];

      act(() => {
        candidateUpdateHandler?.({ test: 'data' });
      });

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle multiple event types correctly', async () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));
      const handlers = {
        candidateUpdate: jest.fn(),
        analysisUpdate: jest.fn(),
        queue_progress: jest.fn(),
        analysis_completed: jest.fn(),
        analysis_error: jest.fn(),
      };

      // Register all handlers
      act(() => {
        Object.entries(handlers).forEach(([event, handler]) => {
          result.current.on(event as any, handler);
        });
      });

      // Test each event type
      const events = [
        { type: 'candidateUpdate', data: { candidateId: '123' } },
        { type: 'analysisUpdate', data: { type: 'analysis_started', candidateId: '456' } },
        { type: 'analysisUpdate', data: { type: 'queue_progress', progress: 75 } },
        { type: 'analysisUpdate', data: { type: 'analysis_completed', score: 92 } },
        { type: 'analysisUpdate', data: { type: 'analysis_error', error: 'Failed to process' } },
      ];

      events.forEach(({ type, data }) => {
        const handler = mockSocket.on.mock.calls.find(call => call[0] === type)?.[1];
        act(() => {
          handler?.(data);
        });
      });

      expect(handlers.candidateUpdate).toHaveBeenCalledTimes(1);
      expect(handlers.analysisUpdate).toHaveBeenCalledTimes(4);
      expect(handlers.queue_progress).toHaveBeenCalledTimes(1);
      expect(handlers.analysis_completed).toHaveBeenCalledTimes(1);
      expect(handlers.analysis_error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Emission', () => {
    it('should emit events when connected', async () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));

      // Connect
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      act(() => {
        connectHandler?.();
      });

      // Emit event
      act(() => {
        result.current.emit('customEvent', { data: 'test' });
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('customEvent', { data: 'test' });
    });

    it('should not emit events when not connected', () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));

      act(() => {
        result.current.emit('customEvent', { data: 'test' });
      });

      expect(mockSocket.emit).not.toHaveBeenCalledWith('customEvent', expect.any(Object));
      expect(mockConsole.warn).toHaveBeenCalledWith('Cannot emit event: WebSocket not connected');
    });

    it('should emit events without data', async () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));

      // Connect
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      act(() => {
        connectHandler?.();
      });

      act(() => {
        result.current.emit('pingEvent');
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('pingEvent', undefined);
    });
  });

  describe('Socket Cleanup', () => {
    it('should disconnect socket on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket({ enabled: true }));

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect socket when disabled', () => {
      const { rerender } = renderHook(
        ({ enabled }) => useWebSocket({ enabled }),
        { initialProps: { enabled: true } }
      );

      expect(mockIo).toHaveBeenCalled();

      rerender({ enabled: false });

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should handle multiple hook instances independently', () => {
      const projectId1 = 'project-1';
      const projectId2 = 'project-2';

      const { result: hook1 } = renderHook(() => useWebSocket({ projectId: projectId1, enabled: true }));
      const { result: hook2 } = renderHook(() => useWebSocket({ projectId: projectId2, enabled: true }));

      // Both should have independent states
      expect(hook1.current.isConnected).toBe(false);
      expect(hook2.current.isConnected).toBe(false);

      // Each should have their own socket instance
      expect(mockIo).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Boundary Cases', () => {
    it('should handle undefined handlers gracefully', () => {
      renderHook(() => useWebSocket({ enabled: true }));

      const candidateUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'candidateUpdate'
      )?.[1];

      // Should not throw when no handler is registered
      expect(() => {
        act(() => {
          candidateUpdateHandler?.({ test: 'data' });
        });
      }).not.toThrow();
    });

    it('should handle malformed event data', () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));
      const mockHandler = jest.fn();

      act(() => {
        result.current.on('analysisUpdate', mockHandler);
      });

      const analysisUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'analysisUpdate'
      )?.[1];

      // Test with various malformed data
      const malformedData = [null, undefined, '', 0, {}, { type: null }, { type: 'invalid' }];

      malformedData.forEach(data => {
        expect(() => {
          act(() => {
            analysisUpdateHandler?.(data);
          });
        }).not.toThrow();
      });

      expect(mockHandler).toHaveBeenCalledTimes(malformedData.length);
    });

    it('should provide access to raw socket instance', () => {
      const { result } = renderHook(() => useWebSocket({ enabled: true }));

      expect(result.current.socket).toBe(mockSocket);
    });
  });
});