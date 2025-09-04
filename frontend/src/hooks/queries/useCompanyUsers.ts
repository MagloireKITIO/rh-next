import { useQuery } from '@tanstack/react-query';
import { companiesApi, type PaginationParams } from '@/lib/api-client';

export function useCompanyUsers(params?: PaginationParams) {
  return useQuery({
    queryKey: ['company-users', params],
    queryFn: () => companiesApi.getUsers(params),
    select: (data) => data.data,
  });
}