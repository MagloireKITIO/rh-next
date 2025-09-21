"use client";

import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { CandidateSourceBadge } from "@/components/ui/candidate-source-badge";
import { CandidateWithPipelineStatus } from "@/lib/api-client";
import { Eye, Mail, FileText, Clock, MoreVertical, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface PipelineCandidateCardProps {
  candidate: CandidateWithPipelineStatus;
  onView?: (candidate: CandidateWithPipelineStatus) => void;
  onDelete?: (candidate: CandidateWithPipelineStatus) => void;
  onSendEmail?: (candidate: CandidateWithPipelineStatus) => void;
  onScheduleInterview?: (candidate: CandidateWithPipelineStatus) => void;
  isDragging?: boolean;
}

export function PipelineCandidateCard({
  candidate,
  onView,
  onDelete,
  onSendEmail,
  onScheduleInterview,
  isDragging = false,
}: PipelineCandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: candidate.id,
    data: {
      type: 'candidate',
      candidate,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "analyzed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "error": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const movedAt = candidate.pipelineStatus?.movedAt
    ? formatDistanceToNow(new Date(candidate.pipelineStatus.movedAt), {
        addSuffix: true,
        locale: fr,
      })
    : null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none",
        (isDragging || isSortableDragging) && "opacity-50 rotate-2 scale-105"
      )}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="cursor-pointer transition-all duration-200 hover:shadow-md">
        <CardContent className="px-2 py-1.5">
          <div className="space-y-1.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{candidate.name}</h4>
              </div>

              {candidate.status === "analyzed" && (
                <ScoreIndicator
                  score={Number(candidate.score)}
                  size="sm"
                  showTrend={false}
                />
              )}
            </div>

            {/* Badge Status uniquement */}
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className={cn("text-xs px-1.5 py-0.5", getStatusColor(candidate.status))}
              >
                {candidate.status}
              </Badge>
              {candidate.ranking > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  #{candidate.ranking}
                </Badge>
              )}
            </div>



            {/* Pipeline Info */}
            {movedAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Déplacé {movedAt}</span>
              </div>
            )}

            {/* Menu d'actions */}
            <div className="flex justify-end pt-2 border-t">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onView?.(candidate);
                    }}
                    className="cursor-pointer"
                  >
                    <Eye className="h-3 w-3 mr-2" />
                    Voir
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      const fileUrl = candidate.fileUrl.startsWith('http')
                        ? candidate.fileUrl
                        : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/${candidate.fileUrl}`;
                      window.open(fileUrl, '_blank');
                    }}
                    className="cursor-pointer"
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    CV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendEmail?.(candidate);
                    }}
                    className="cursor-pointer"
                  >
                    <Mail className="h-3 w-3 mr-2" />
                    Envoyer un mail
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onScheduleInterview?.(candidate);
                    }}
                    className="cursor-pointer"
                  >
                    <Calendar className="h-3 w-3 mr-2" />
                    Planifier entretien
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(candidate);
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}