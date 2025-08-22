import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, Project } from '@/lib/api-client';
import { toast } from 'sonner';

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; jobDescription: string; customPrompt?: string }) =>
      projectsApi.create(data).then(res => res.data),
    
    onSuccess: (newProject: Project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error creating project';
      toast.error(message);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectsApi.update(id, data).then(res => res.data),
    
    onSuccess: (updatedProject: Project) => {
      queryClient.setQueryData(['projects', updatedProject.id], updatedProject);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', updatedProject.id, 'stats'] });
      toast.success('Project updated successfully');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error updating project';
      toast.error(message);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectsApi.delete(projectId),
    
    onSuccess: (_, projectId) => {
      queryClient.removeQueries({ queryKey: ['projects', projectId] });
      queryClient.removeQueries({ queryKey: ['projects', projectId, 'stats'] });
      queryClient.removeQueries({ queryKey: ['candidates', 'project', projectId] });
      queryClient.removeQueries({ queryKey: ['analysis', 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error deleting project';
      toast.error(message);
    },
  });
}