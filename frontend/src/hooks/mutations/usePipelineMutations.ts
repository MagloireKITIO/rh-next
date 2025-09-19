import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineApi, RecruitmentPipeline, PipelineStage, CandidatePipelineStatus } from '@/lib/api-client';
import { toast } from 'sonner';

export function useCreatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: {
      projectId: string;
      data: {
        name: string;
        description?: string;
        stages?: Array<{ name: string; description?: string; color?: string }>;
      };
    }) => pipelineApi.create(projectId, data).then(res => res.data),

    onSuccess: (newPipeline: RecruitmentPipeline, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', 'project', projectId] });
      toast.success('Pipeline créé avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la création du pipeline';
      toast.error(message);
    },
  });
}

export function useUpdatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: { name?: string; description?: string };
    }) => pipelineApi.update(id, data).then(res => res.data),

    onSuccess: (updatedPipeline: RecruitmentPipeline) => {
      queryClient.setQueryData(['pipelines', updatedPipeline.id], updatedPipeline);
      queryClient.invalidateQueries({ queryKey: ['pipelines', 'project', updatedPipeline.projectId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines', updatedPipeline.id, 'with-candidates'] });
      toast.success('Pipeline mis à jour avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour du pipeline';
      toast.error(message);
    },
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pipelineId: string) => pipelineApi.delete(pipelineId),

    onSuccess: (_, pipelineId) => {
      queryClient.removeQueries({ queryKey: ['pipelines', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success('Pipeline supprimé avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression du pipeline';
      toast.error(message);
    },
  });
}

export function useAddPipelineStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pipelineId, data }: {
      pipelineId: string;
      data: { name: string; description?: string; color?: string };
    }) => pipelineApi.addStage(pipelineId, data).then(res => res.data),

    onSuccess: (newStage: PipelineStage, { pipelineId }) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines', pipelineId, 'with-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['pipelines', pipelineId, 'stats'] });
      toast.success('Étape ajoutée avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'ajout de l\'étape';
      toast.error(message);
    },
  });
}

export function useUpdatePipelineStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stageId, data }: {
      stageId: string;
      data: { name?: string; description?: string; color?: string };
    }) => pipelineApi.updateStage(stageId, data).then(res => res.data),

    onSuccess: (updatedStage: PipelineStage) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', updatedStage.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines', updatedStage.pipelineId, 'with-candidates'] });
      toast.success('Étape mise à jour avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour de l\'étape';
      toast.error(message);
    },
  });
}

export function useDeletePipelineStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stageId: string) => pipelineApi.deleteStage(stageId),

    onSuccess: (_, stageId) => {
      // Invalider toutes les queries pipeline pour s'assurer de la cohérence
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success('Étape supprimée avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de l\'étape';
      toast.error(message);
    },
  });
}

export function useMoveCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { candidateId: string; stageId: string; notes?: string }) =>
      pipelineApi.moveCandidate(data).then(res => res.data),

    onSuccess: (status: CandidatePipelineStatus, { candidateId }) => {
      // Invalider les queries pipeline pour refléter le changement
      queryClient.invalidateQueries({ queryKey: ['pipelines', status.pipelineId, 'with-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['pipelines', status.pipelineId, 'stats'] });

      // Invalider les queries candidats pour mettre à jour les listes
      queryClient.invalidateQueries({ queryKey: ['candidates'] });

      toast.success('Candidat déplacé avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors du déplacement du candidat';
      toast.error(message);
    },
  });
}

export function useReorderPipelineStages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pipelineId, stageOrders }: {
      pipelineId: string;
      stageOrders: Array<{ stageId: string; order: number }>;
    }) => pipelineApi.reorderStages(pipelineId, stageOrders).then(res => res.data),

    onSuccess: (stages: PipelineStage[], { pipelineId }) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines', pipelineId, 'with-candidates'] });
      toast.success('Étapes réorganisées avec succès');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la réorganisation des étapes';
      toast.error(message);
    },
  });
}