import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/lib/api-client';

export function useCompanyUsers() {
  return useQuery({
    queryKey: ['company', 'users'],
    queryFn: () => companiesApi.getUsers().then(res => res.data.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}