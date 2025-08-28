import { useQuery } from '@tanstack/react-query';
import { candidatesApi, Candidate, RankingChange, PaginationParams } from '@/lib/api-client';

export function useCandidates(params?: PaginationParams) {
  return useQuery({
    queryKey: ['candidates', params],
    queryFn: () => candidatesApi.getAll(params).then(res => res.data),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCandidatesByProject(projectId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: ['candidates', 'project', projectId, params],
    queryFn: () => candidatesApi.getByProject(projectId, params).then(res => res.data),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 secondes - données changeantes avec analyses
  });
}

// Nouveau hook pour rétrocompatibilité - retourne uniquement les données sans pagination
export function useCandidatesByProjectLegacy(projectId: string) {
  return useQuery({
    queryKey: ['candidates', 'project', projectId, 'legacy'],
    queryFn: () => candidatesApi.getByProject(projectId, { page: 1, limit: 1000 }).then(res => res.data.data),
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