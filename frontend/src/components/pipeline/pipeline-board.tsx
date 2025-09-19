"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PipelineStageColumn } from "./pipeline-stage-column";
import { PipelineCandidateCard } from "./pipeline-candidate-card";
import { AddStageDialog } from "./add-stage-dialog";
import { EditStageDialog } from "./edit-stage-dialog";
import { usePipelineWithCandidates } from "@/hooks/queries";
import { useMoveCandidate, useReorderPipelineStages } from "@/hooks/mutations";
import { PipelineStage, CandidateWithPipelineStatus } from "@/lib/api-client";
import { toast } from "sonner";
import { Plus, BarChart3, Settings, List, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineBoardProps {
  projectId: string;
  pipelineId: string;
  onViewCandidate?: (candidate: CandidateWithPipelineStatus) => void;
  onViewStats?: () => void;
}

export function PipelineBoard({
  projectId,
  pipelineId,
  onViewCandidate,
  onViewStats,
}: PipelineBoardProps) {
  const [activeCandidate, setActiveCandidate] = useState<CandidateWithPipelineStatus | null>(null);
  const [activeStage, setActiveStage] = useState<PipelineStage | null>(null);
  const [showAddStage, setShowAddStage] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const { data: pipeline, isLoading, error } = usePipelineWithCandidates(pipelineId);
  const moveCandidateMutation = useMoveCandidate();
  const reorderStagesMutation = useReorderPipelineStages();

  const sortedStages = useMemo(() => {
    if (!pipeline?.stages) return [];
    return [...pipeline.stages].sort((a, b) => a.order - b.order);
  }, [pipeline?.stages]);

  const stageIds = useMemo(() => sortedStages.map(stage => stage.id), [sortedStages]);

  const totalCandidates = useMemo(() => {
    if (!sortedStages) return 0;
    return sortedStages.reduce((total, stage) => total + (stage.candidates?.length || 0), 0);
  }, [sortedStages]);

  // Tous les candidats pour la vue liste
  const allCandidates = useMemo(() => {
    if (!sortedStages) return [];
    return sortedStages.flatMap(stage =>
      (stage.candidates || []).map(candidate => ({
        ...candidate,
        stageName: stage.name,
        stageColor: stage.color
      }))
    );
  }, [sortedStages]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (active.data.current?.type === 'candidate') {
      const candidate = active.data.current.candidate as CandidateWithPipelineStatus;
      setActiveCandidate(candidate);
    } else if (active.data.current?.type === 'stage') {
      const stage = active.data.current.stage as PipelineStage;
      setActiveStage(stage);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveCandidate(null);
    setActiveStage(null);

    if (!over) return;

    // Déplacement de candidat entre étapes
    if (active.data.current?.type === 'candidate' && over.data.current?.type === 'stage') {
      const candidateId = active.id as string;
      const targetStageId = over.id as string;

      // Trouver l'étape source du candidat
      const sourceStage = sortedStages.find(stage =>
        stage.candidates?.some(candidate => candidate.id === candidateId)
      );

      // Ne pas déplacer si c'est la même étape
      if (sourceStage?.id === targetStageId) return;

      moveCandidateMutation.mutate({
        candidateId,
        stageId: targetStageId,
        notes: `Déplacé vers ${over.data.current.stage.name}`,
      });
    }

    // Réorganisation des étapes
    if (active.data.current?.type === 'stage' && over.data.current?.type === 'stage') {
      const activeIndex = stageIds.indexOf(active.id as string);
      const overIndex = stageIds.indexOf(over.id as string);

      if (activeIndex !== overIndex) {
        const newStageIds = [...stageIds];
        const [movedStageId] = newStageIds.splice(activeIndex, 1);
        newStageIds.splice(overIndex, 0, movedStageId);

        const stageOrders = newStageIds.map((stageId, index) => ({
          stageId,
          order: index + 1,
        }));

        reorderStagesMutation.mutate({
          pipelineId,
          stageOrders,
        });
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Highlight de l'étape cible quand on drag un candidat
    if (active.data.current?.type === 'candidate' && over.data.current?.type === 'stage') {
      // Optionnel: ajouter une logique de highlight
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Chargement du pipeline..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive">Erreur lors du chargement du pipeline</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error.response?.data?.message || error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Pipeline non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{pipeline.name}</h2>
          {pipeline.description && (
            <p className="text-muted-foreground mt-1">{pipeline.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <span>{totalCandidates} candidat{totalCandidates > 1 ? 's' : ''}</span>
          </Badge>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-card rounded-lg p-1 border border-border">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {onViewStats && (
            <Button variant="outline" onClick={onViewStats} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistiques
            </Button>
          )}
          <Button onClick={() => setShowAddStage(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter étape
          </Button>
        </div>
      </div>

      {/* Pipeline Views */}
      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            <SortableContext items={stageIds} strategy={horizontalListSortingStrategy}>
              {sortedStages.map((stage) => (
                <PipelineStageColumn
                  key={stage.id}
                  stage={stage}
                  candidates={stage.candidates || []}
                  onViewCandidate={onViewCandidate}
                  onEditStage={setEditingStage}
                />
              ))}
            </SortableContext>
          </div>

          {/* Drag Overlays */}
          <DragOverlay>
            {activeCandidate && (
              <PipelineCandidateCard
                candidate={activeCandidate}
                isDragging
              />
            )}
            {activeStage && (
              <Card className="w-80 opacity-80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: activeStage.color || '#3b82f6' }}
                    />
                    {activeStage.name}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        /* Liste View */
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-sm font-medium text-muted-foreground">
              <div className="col-span-3">Candidat</div>
              <div className="col-span-2">Score</div>
              <div className="col-span-2">Statut</div>
              <div className="col-span-3">Étape</div>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Candidate rows */}
            {allCandidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border last:border-b-0"
                onClick={() => onViewCandidate?.(candidate)}
              >
                <div className="col-span-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {candidate.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {candidate.name}
                      </p>
                      {candidate.ranking > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Rang #{candidate.ranking}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-2 flex items-center">
                  {candidate.status === "analyzed" ? (
                    <span className="text-foreground font-medium">
                      {Number(candidate.score).toFixed(1)}/10
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </div>

                <div className="col-span-2 flex items-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      candidate.status === "analyzed" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                      candidate.status === "pending" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
                      candidate.status === "error" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    )}
                  >
                    {candidate.status}
                  </Badge>
                </div>

                <div className="col-span-3 flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: candidate.stageColor || '#3b82f6' }}
                    />
                    <span className="text-foreground text-sm">{candidate.stageName}</span>
                  </div>
                </div>

                <div className="col-span-2 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewCandidate?.(candidate);
                    }}
                  >
                    Voir
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      const fileUrl = candidate.fileUrl.startsWith('http')
                        ? candidate.fileUrl
                        : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/${candidate.fileUrl}`;
                      window.open(fileUrl, '_blank');
                    }}
                  >
                    CV
                  </Button>
                </div>
              </motion.div>
            ))}

            {allCandidates.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-muted-foreground">Aucun candidat dans le pipeline</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddStageDialog
        pipelineId={pipelineId}
        isOpen={showAddStage}
        onClose={() => setShowAddStage(false)}
      />

      {editingStage && (
        <EditStageDialog
          stage={editingStage}
          isOpen={!!editingStage}
          onClose={() => setEditingStage(null)}
        />
      )}
    </div>
  );
}