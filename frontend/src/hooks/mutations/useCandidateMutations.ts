import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi, Candidate } from '@/lib/api-client';
import { toast } from 'sonner';

export function useUploadCVs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, files }: { projectId: string; files: File[] }) =>
      candidatesApi.uploadCVs(projectId, files).then(res => res.data),
    
    onSuccess: (data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['candidates', 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'stats'] });
      
      if (data.successful > 0) {
        toast.success(`${data.successful} CV(s) uploaded successfully`);
      }
      if (data.failed > 0) {
        toast.warning(`${data.failed} CV(s) failed to upload`);
      }
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Upload failed';
      toast.error(message);
    },
  });
}

export function useAnalyzeCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (candidateId: string) =>
      candidatesApi.analyze(candidateId).then(res => res.data),
    
    onMutate: async (candidateId: string) => {
      await queryClient.cancelQueries({ queryKey: ['candidates', candidateId] });
      
      const previousCandidate = queryClient.getQueryData<Candidate>(['candidates', candidateId]);
      
      if (previousCandidate) {
        queryClient.setQueryData(['candidates', candidateId], {
          ...previousCandidate,
          status: 'analyzing'
        });
      }
      
      return { previousCandidate };
    },
    
    onSuccess: (_, candidateId) => {
      queryClient.invalidateQueries({ queryKey: ['candidates', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidates', 'project'] });
      queryClient.invalidateQueries({ queryKey: ['analysis'] });
      toast.success('Analysis started');
    },
    
    onError: (error: any, candidateId, context) => {
      if (context?.previousCandidate) {
        queryClient.setQueryData(['candidates', candidateId], context.previousCandidate);
      }
      const message = error.response?.data?.message || 'Error starting analysis';
      toast.error(message);
    },
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (candidateId: string) =>
      candidatesApi.delete(candidateId),
    
    onSuccess: (_, candidateId) => {
      queryClient.removeQueries({ queryKey: ['candidates', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidates', 'project'] });
      queryClient.invalidateQueries({ queryKey: ['projects'], predicate: (query) => 
        query.queryKey.includes('stats') 
      });
      toast.success('Candidate deleted successfully');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error deleting candidate';
      toast.error(message);
    },
  });
}