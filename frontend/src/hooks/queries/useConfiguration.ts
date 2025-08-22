import { useQuery } from '@tanstack/react-query';
import { configurationApi, Configuration } from '@/lib/api-client';

export function useConfigurations() {
  return useQuery({
    queryKey: ['configuration'],
    queryFn: () => configurationApi.getAll().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes - données de configuration très stables
  });
}

export function useAIConfiguration() {
  return useQuery({
    queryKey: ['configuration', 'ai'],
    queryFn: () => configurationApi.getAIConfig().then(res => res.data),
    staleTime: 10 * 60 * 1000, // 10 minutes - config AI très stable
  });
}

export function useConfigurationByKey(key: string) {
  return useQuery({
    queryKey: ['configuration', 'key', key],
    queryFn: () => configurationApi.getByKey(key).then(res => res.data),
    enabled: !!key,
    staleTime: 5 * 60 * 1000, // 5 minutes - config spécifique stable
  });
}