import { useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewsApi, CreateInterviewData, UpdateInterviewData, CreateEvaluationData } from '@/lib/api-client';
import { toast } from 'sonner';

export function useCreateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInterviewData) =>
      interviewsApi.create(data).then(res => res.data),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['interviews', 'project', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['interviews', 'candidate', data.candidate_id] });

      toast.success('Entretien créé avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la création de l\'entretien';
      toast.error(message);
    },
  });
}

export function useUpdateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInterviewData }) =>
      interviewsApi.update(id, data).then(res => res.data),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['interviews', data.id] });
      queryClient.invalidateQueries({ queryKey: ['interviews', 'project', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['interviews', 'candidate', data.candidate_id] });

      toast.success('Entretien modifié avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification de l\'entretien';
      toast.error(message);
    },
  });
}

export function useUpdateInterviewStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' }) =>
      interviewsApi.updateStatus(id, status).then(res => res.data),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['interviews', data.id] });
      queryClient.invalidateQueries({ queryKey: ['interviews', 'project', data.project_id] });

      toast.success('Statut de l\'entretien mis à jour');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour du statut';
      toast.error(message);
    },
  });
}

export function useDeleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      interviewsApi.delete(id),

    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.removeQueries({ queryKey: ['interviews', id] });

      toast.success('Entretien supprimé avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de l\'entretien';
      toast.error(message);
    },
  });
}

export function useAddInterviewParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ interviewId, userId, role }: {
      interviewId: string;
      userId: string;
      role: 'interviewer' | 'observer' | 'coordinator'
    }) =>
      interviewsApi.addParticipant(interviewId, userId, role).then(res => res.data),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews', data.interview_id] });

      toast.success('Participant ajouté avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'ajout du participant';
      toast.error(message);
    },
  });
}

export function useUpdateParticipantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ participantId, status }: {
      participantId: string;
      status: 'invited' | 'accepted' | 'declined' | 'tentative'
    }) =>
      interviewsApi.updateParticipantStatus(participantId, status).then(res => res.data),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews', data.interview_id] });

      toast.success('Statut du participant mis à jour');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour du statut';
      toast.error(message);
    },
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) =>
      interviewsApi.removeParticipant(participantId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });

      toast.success('Participant retiré avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression du participant';
      toast.error(message);
    },
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEvaluationData) =>
      interviewsApi.createEvaluation(data).then(res => res.data),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews', data.interview_id] });
      queryClient.invalidateQueries({ queryKey: ['interviews', data.interview_id, 'evaluations'] });

      toast.success('Évaluation créée avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la création de l\'évaluation';
      toast.error(message);
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEvaluationData> }) =>
      interviewsApi.updateEvaluation(id, data).then(res => res.data),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews', data.interview_id] });
      queryClient.invalidateQueries({ queryKey: ['interviews', data.interview_id, 'evaluations'] });

      toast.success('Évaluation modifiée avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification de l\'évaluation';
      toast.error(message);
    },
  });
}

export function useDeleteEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      interviewsApi.deleteEvaluation(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });

      toast.success('Évaluation supprimée avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de l\'évaluation';
      toast.error(message);
    },
  });
}

export function useGenerateMeetingLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (interviewId: string) =>
      interviewsApi.generateMeetingLink(interviewId).then(res => res.data),

    onSuccess: (data, interviewId) => {
      queryClient.invalidateQueries({ queryKey: ['interviews', interviewId] });

      toast.success('Lien de réunion généré avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la génération du lien';
      toast.error(message);
    },
  });
}

export function useSyncCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      interviewsApi.syncCalendar().then(res => res.data),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });

      if (data.errors > 0) {
        toast.success(`${data.synced} entretiens synchronisés, ${data.errors} erreurs`);
      } else {
        toast.success(`${data.synced} entretiens synchronisés avec Google Calendar`);
      }
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la synchronisation';
      toast.error(message);
    },
  });
}

export function useSyncAttendeesStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (interviewId: string) =>
      interviewsApi.syncAttendeesStatus(interviewId).then(res => res.data),

    onSuccess: (data, interviewId) => {
      queryClient.invalidateQueries({ queryKey: ['interviews', interviewId] });
      toast.success('Statuts des participants synchronisés avec Google Calendar');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la synchronisation des statuts';
      toast.error(message);
    },
  });
}

export function useSendInterviewReminder() {
  return useMutation({
    mutationFn: ({ interviewId, minutesBefore }: { interviewId: string; minutesBefore?: number }) =>
      interviewsApi.sendReminder(interviewId, minutesBefore).then(res => res.data),

    onSuccess: () => {
      toast.success('Rappel envoyé aux participants');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'envoi du rappel';
      toast.error(message);
    },
  });
}