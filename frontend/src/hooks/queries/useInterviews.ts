import { useQuery } from '@tanstack/react-query';
import { interviewsApi, Interview, InterviewEvaluation } from '@/lib/api-client';

export function useInterviews() {
  return useQuery({
    queryKey: ['interviews'],
    queryFn: () => interviewsApi.getAll().then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useInterviewsByProject(projectId: string) {
  return useQuery({
    queryKey: ['interviews', 'project', projectId],
    queryFn: () => interviewsApi.getByProject(projectId).then(res => res.data),
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useInterviewsByCandidate(candidateId: string) {
  return useQuery({
    queryKey: ['interviews', 'candidate', candidateId],
    queryFn: () => interviewsApi.getByCandidate(candidateId).then(res => res.data),
    enabled: !!candidateId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useInterviewsByUser(userId: string) {
  return useQuery({
    queryKey: ['interviews', 'user', userId],
    queryFn: () => interviewsApi.getByUser(userId).then(res => res.data),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useInterviewsByDateRange(startDate: Date | null, endDate: Date | null) {
  return useQuery({
    queryKey: ['interviews', 'calendar', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => {
      if (!startDate || !endDate) return [];
      return interviewsApi.getByDateRange(startDate, endDate).then(res => res.data);
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: ['interviews', id],
    queryFn: () => interviewsApi.getById(id).then(res => res.data),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 secondes - données changeantes
  });
}

export function useInterviewEvaluations(interviewId: string) {
  return useQuery({
    queryKey: ['interviews', interviewId, 'evaluations'],
    queryFn: () => interviewsApi.getEvaluationsByInterview(interviewId).then(res => res.data),
    enabled: !!interviewId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useAvailableTimeSlots(
  date: Date | null,
  userIds: string[],
  duration: number = 60
) {
  return useQuery({
    queryKey: ['interviews', 'availability', date?.toISOString().split('T')[0], userIds.join(','), duration],
    queryFn: () => {
      if (!date || userIds.length === 0) return [];
      return interviewsApi.getAvailableTimeSlots(date, userIds, duration).then(res => res.data);
    },
    enabled: !!date && userIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}