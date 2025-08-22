import { useQuery } from '@tanstack/react-query';
import { apiKeysApi } from '@/lib/api-client';

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeysApi.getAll().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes - données de configuration stables
  });
}

export function useApiKeysStats() {
  return useQuery({
    queryKey: ['api-keys', 'stats'],
    queryFn: () => apiKeysApi.getStats().then(res => res.data),
    staleTime: 1 * 60 * 1000, // 1 minute - statistiques peuvent changer
  });
}