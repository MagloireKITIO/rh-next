"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PipelineCandidateCard } from "./pipeline-candidate-card";
import { PipelineStage, CandidateWithPipelineStatus } from "@/lib/api-client";
import { MoreVertical, Edit, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStageColumnProps {
  stage: PipelineStage;
  candidates: CandidateWithPipelineStatus[];
  onViewCandidate?: (candidate: CandidateWithPipelineStatus) => void;
  onDeleteCandidate?: (candidate: CandidateWithPipelineStatus) => void;
  onSendEmail?: (candidate: CandidateWithPipelineStatus) => void;
  onScheduleInterview?: (candidate: CandidateWithPipelineStatus) => void;
  onEditStage?: (stage: PipelineStage) => void;
  onDeleteStage?: (stage: PipelineStage) => void;
}

export function PipelineStageColumn({
  stage,
  candidates,
  onViewCandidate,
  onDeleteCandidate,
  onSendEmail,
  onScheduleInterview,
  onEditStage,
  onDeleteStage,
}: PipelineStageColumnProps) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stage.id,
    data: {
      type: 'stage',
      stage,
    },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'stage',
      stage,
    },
  });

  const candidateIds = candidates.map(candidate => candidate.id);

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const setRefs = (element: HTMLDivElement | null) => {
    setSortableRef(element);
    setDroppableRef(element);
  };

  return (
    <motion.div
      ref={setRefs}
      style={sortableStyle}
      className={cn(
        "flex-shrink-0 w-80",
        isDragging && "opacity-50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "h-full transition-all duration-200",
        isOver && "ring-2 ring-primary ring-offset-2",
        "hover:shadow-md"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: stage.color || '#3b82f6' }}
              />
              <span className="truncate">{stage.name}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {candidates.length}
              </Badge>
            </CardTitle>

            <div className="flex items-center gap-1">
              {/* Drag Handle */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 w-6 p-0 cursor-grab active:cursor-grabbing opacity-0 transition-opacity",
                  isHovered && "opacity-100"
                )}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-3 w-3" />
              </Button>

              {/* Stage Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0 opacity-0 transition-opacity",
                      isHovered && "opacity-100"
                    )}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onEditStage?.(stage)}
                    className="gap-2"
                  >
                    <Edit className="h-3 w-3" />
                    Modifier
                  </DropdownMenuItem>
                  {!stage.isDefault && onDeleteStage && (
                    <DropdownMenuItem
                      onClick={() => onDeleteStage(stage)}
                      className="gap-2 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {stage.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {stage.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3 min-h-[400px]">
            <SortableContext items={candidateIds} strategy={verticalListSortingStrategy}>
              {candidates.map((candidate) => (
                <PipelineCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onView={onViewCandidate}
                  onDelete={onDeleteCandidate}
                  onSendEmail={onSendEmail}
                  onScheduleInterview={onScheduleInterview}
                />
              ))}
            </SortableContext>

            {candidates.length === 0 && (
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: stage.color || '#3b82f6' }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aucun candidat
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Glissez un candidat ici
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}