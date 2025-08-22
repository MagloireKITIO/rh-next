import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './use-websocket';
import { useEffect } from 'react';
import { Candidate } from '@/lib/api-client';

export function useWebSocketSync(projectId: string) {
  const queryClient = useQueryClient();
  const { isConnected, on, off } = useWebSocket({ projectId, enabled: !!projectId });

  useEffect(() => {
    if (!projectId) return;

    // Analysis completed - mise à jour optimiste du candidat
    on('analysis_completed', (data: { candidateId: string; candidate: Candidate }) => {
      // Mettre à jour le candidat spécifique dans le cache
      queryClient.setQueryData(['candidates', data.candidateId], data.candidate);
      
      // Invalider la liste des candidats pour refetch
      queryClient.invalidateQueries({ queryKey: ['candidates', 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['candidates', 'project', projectId, 'rankings'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'stats'] });
    });

    // Candidate updated - mise à jour directe du cache
    on('candidateUpdate', (data: { candidateId: string; candidate: Candidate }) => {
      queryClient.setQueryData(['candidates', data.candidateId], data.candidate);
      queryClient.invalidateQueries({ queryKey: ['candidates', 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['candidates', 'project', projectId, 'rankings'] });
    });

    // Queue progress - pas besoin de refetch, juste émettre un event custom
    on('queue_progress', (data) => {
      window.dispatchEvent(new CustomEvent('queueProgress', { detail: data }));
    });

    return () => {
      off('analysis_completed');
      off('candidateUpdate');
      off('queue_progress');
    };
  }, [projectId, on, off, queryClient]);

  return { isConnected };
}