import { useQuery } from '@tanstack/react-query';
import { pipelineApi, RecruitmentPipeline, PipelineStats } from '@/lib/api-client';

export function usePipelinesByProject(projectId: string) {
  return useQuery({
    queryKey: ['pipelines', 'project', projectId],
    queryFn: () => pipelineApi.getByProject(projectId).then(res => res.data),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePipeline(id: string) {
  return useQuery({
    queryKey: ['pipelines', id],
    queryFn: () => pipelineApi.getById(id).then(res => res.data),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function usePipelineWithCandidates(id: string) {
  return useQuery({
    queryKey: ['pipelines', id, 'with-candidates'],
    queryFn: () => pipelineApi.getWithCandidates(id).then(res => res.data),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 secondes - données changeantes avec les mouvements de candidats
  });
}

export function usePipelineStats(id: string) {
  return useQuery({
    queryKey: ['pipelines', id, 'stats'],
    queryFn: () => pipelineApi.getStats(id).then(res => res.data),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useProjectTimeline(projectId: string) {
  return useQuery({
    queryKey: ['pipelines', 'project', projectId, 'timeline'],
    queryFn: () => pipelineApi.getProjectTimeline(projectId).then(res => res.data),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 secondes - timeline avec données en temps réel
  });
}