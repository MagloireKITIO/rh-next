import { useQuery } from '@tanstack/react-query';
import { analysisApi, Analysis } from '@/lib/api-client';

export function useAnalyses() {
  return useQuery({
    queryKey: ['analysis'],
    queryFn: () => analysisApi.getAll().then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAnalysesByProject(projectId: string) {
  return useQuery({
    queryKey: ['analysis', 'project', projectId],
    queryFn: () => analysisApi.getByProject(projectId).then(res => res.data),
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute - données d'analyse peu changeantes une fois créées
  });
}

export function useAnalysis(analysisId: string) {
  return useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: () => analysisApi.getById(analysisId).then(res => res.data),
    enabled: !!analysisId,
    staleTime: 5 * 60 * 1000, // 5 minutes - analyses stables
  });
}

export function useProjectReport(projectId: string) {
  return useQuery({
    queryKey: ['analysis', 'report', projectId],
    queryFn: () => analysisApi.generateReport(projectId).then(res => res.data),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 secondes - rapport généré dynamiquement
  });
}