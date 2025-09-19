"use client";

import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { CandidateSourceBadge } from "@/components/ui/candidate-source-badge";
import { CandidateWithPipelineStatus } from "@/lib/api-client";
import { Eye, Mail, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface PipelineCandidateCardProps {
  candidate: CandidateWithPipelineStatus;
  onView?: (candidate: CandidateWithPipelineStatus) => void;
  isDragging?: boolean;
}

export function PipelineCandidateCard({
  candidate,
  onView,
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
      <Card className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md border-l-4",
        candidate.status === "analyzed" && "border-l-green-500",
        candidate.status === "pending" && "border-l-yellow-500",
        candidate.status === "error" && "border-l-red-500",
        !["analyzed", "pending", "error"].includes(candidate.status) && "border-l-gray-300"
      )}>
        <CardContent className="p-3">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{candidate.name}</h4>
                {candidate.email && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {candidate.email}
                  </p>
                )}
              </div>

              {candidate.status === "analyzed" && (
                <ScoreIndicator
                  score={Number(candidate.score)}
                  size="sm"
                  showTrend={false}
                />
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn("text-xs", getStatusColor(candidate.status))}
              >
                {candidate.status}
              </Badge>
              <CandidateSourceBadge source={candidate.source} />
            </div>

            {/* Summary */}
            {candidate.summary && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {candidate.summary}
              </p>
            )}

            {/* Pipeline Info */}
            {movedAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Déplacé {movedAt}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView?.(candidate);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
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
                  <FileText className="h-3 w-3 mr-1" />
                  CV
                </Button>
              </div>

              {candidate.ranking > 0 && (
                <Badge variant="outline" className="text-xs">
                  #{candidate.ranking}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}