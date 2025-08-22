import { useQuery } from '@tanstack/react-query';
import { candidatesApi, Candidate, RankingChange } from '@/lib/api-client';

export function useCandidates() {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: () => candidatesApi.getAll().then(res => res.data),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCandidatesByProject(projectId: string) {
  return useQuery({
    queryKey: ['candidates', 'project', projectId],
    queryFn: () => candidatesApi.getByProject(projectId).then(res => res.data),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 secondes - données changeantes avec analyses
  });
}

export function useCandidate(candidateId: string) {
  return useQuery({
    queryKey: ['candidates', candidateId],
    queryFn: () => candidatesApi.getById(candidateId).then(res => res.data),
    enabled: !!candidateId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCandidateInProject(projectId: string, candidateId: string) {
  return useQuery({
    queryKey: ['candidates', 'project', projectId, candidateId],
    queryFn: () => candidatesApi.getCandidateInProject(projectId, candidateId).then(res => res.data),
    enabled: !!projectId && !!candidateId,
    staleTime: 30 * 1000, // 30 secondes - données spécifiques changeantes
  });
}

export function useRankingChanges(projectId: string) {
  return useQuery({
    queryKey: ['candidates', 'project', projectId, 'rankings'],
    queryFn: () => candidatesApi.getRankingChanges(projectId).then(res => res.data),
    enabled: !!projectId,
    staleTime: 10 * 1000, // 10 secondes - très changeant avec analyses
  });
}

export function useQueueStatus(projectId: string) {
  return useQuery({
    queryKey: ['candidates', 'project', projectId, 'queue-status'],
    queryFn: () => candidatesApi.getQueueStatus(projectId).then(res => res.data),
    enabled: !!projectId,
    staleTime: 5 * 1000, // 5 secondes - données temps réel
    refetchInterval: 5 * 1000, // Refetch automatique toutes les 5 secondes
  });
}