import { useQuery } from '@tanstack/react-query';
import { interviewsApi } from '@/lib/api-client';

export function useCalendarEvents(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['calendar-events', startDate, endDate],
    queryFn: () => interviewsApi.getCalendarEvents(startDate, endDate).then(res => res.data),
    enabled: !!startDate && !!endDate,
  });
}