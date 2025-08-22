import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeysApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { key: string; name?: string; provider?: string }) =>
      apiKeysApi.create(data).then(res => res.data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys', 'stats'] });
      toast.success('API key added successfully');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error adding API key';
      toast.error(message);
    },
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; provider?: string } }) =>
      apiKeysApi.update(id, data).then(res => res.data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys', 'stats'] });
      toast.success('API key updated successfully');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error updating API key';
      toast.error(message);
    },
  });
}

export function useToggleApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (apiKeyId: string) =>
      apiKeysApi.toggle(apiKeyId).then(res => res.data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys', 'stats'] });
      toast.success('API key status updated');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error toggling API key';
      toast.error(message);
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (apiKeyId: string) => apiKeysApi.delete(apiKeyId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['api-keys', 'stats'] });
      toast.success('API key deleted successfully');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error deleting API key';
      toast.error(message);
    },
  });
}