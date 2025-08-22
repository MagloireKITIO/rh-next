import { useMutation, useQueryClient } from '@tanstack/react-query';
import { configurationApi, Configuration } from '@/lib/api-client';
import { toast } from 'sonner';

export function useSetConfigurationValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: string; description?: string }) =>
      configurationApi.setValue(key, value, description).then(res => res.data),
    
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['configuration'] });
      queryClient.invalidateQueries({ queryKey: ['configuration', 'key', key] });
      queryClient.invalidateQueries({ queryKey: ['configuration', 'ai'] });
      toast.success('Configuration updated successfully');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error updating configuration';
      toast.error(message);
    },
  });
}

export function useUpdateConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Configuration> }) =>
      configurationApi.update(id, data).then(res => res.data),
    
    onSuccess: (updatedConfig: Configuration) => {
      queryClient.setQueryData(['configuration', updatedConfig.id], updatedConfig);
      queryClient.invalidateQueries({ queryKey: ['configuration'] });
      queryClient.invalidateQueries({ queryKey: ['configuration', 'key', updatedConfig.key] });
      queryClient.invalidateQueries({ queryKey: ['configuration', 'ai'] });
      toast.success('Configuration updated successfully');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error updating configuration';
      toast.error(message);
    },
  });
}

export function useInitializeDefaultConfigurations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => configurationApi.initializeDefaults().then(res => res.data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuration'] });
      queryClient.invalidateQueries({ queryKey: ['configuration', 'ai'] });
      toast.success('Default configurations initialized');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error initializing configurations';
      toast.error(message);
    },
  });
}

export function useDeleteConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configId: string) => configurationApi.delete(configId),
    
    onSuccess: (_, configId) => {
      queryClient.removeQueries({ queryKey: ['configuration', configId] });
      queryClient.invalidateQueries({ queryKey: ['configuration'] });
      queryClient.invalidateQueries({ queryKey: ['configuration', 'ai'] });
      toast.success('Configuration deleted successfully');
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error deleting configuration';
      toast.error(message);
    },
  });
}