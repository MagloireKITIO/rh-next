import { useQuery } from '@tanstack/react-query';
import { companiesApi, PaginationParams } from '@/lib/api-client';

export function useCompanyUsers(params?: PaginationParams) {
  return useQuery({
    queryKey: ['companies', 'users', params],
    queryFn: () => companiesApi.getUsers(params).then(res => res.data),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}