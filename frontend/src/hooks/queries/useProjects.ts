import { useQuery } from '@tanstack/react-query';
import { projectsApi, Project, ProjectStats } from '@/lib/api-client';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll().then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getById(id).then(res => res.data),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute - plus frais car données spécifiques
  });
}

export function useProjectStats(id: string) {
  return useQuery({
    queryKey: ['projects', id, 'stats'],
    queryFn: () => projectsApi.getStats(id).then(res => res.data),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 secondes - données changeantes avec les analyses
  });
}