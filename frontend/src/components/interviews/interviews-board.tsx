"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInterviewsByProject } from "@/hooks/queries";
import { useUpdateInterviewStatus } from "@/hooks/mutations";
import { Interview, Candidate } from "@/lib/api-client";
import { ScheduleInterviewModal } from "./schedule-interview-modal";
import { InterviewDetailsModal } from "./interview-details-modal";
import { InterviewEvaluationModal } from "./interview-evaluation-modal";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InterviewsBoardProps {
  projectId: string;
  onViewInterview?: (interview: Interview) => void;
  onEditInterview?: (interview: Interview) => void;
  onDeleteInterview?: (interview: Interview) => void;
  onScheduleInterview?: () => void;
}

const statusConfig = {
  scheduled: {
    label: "Programmé",
    color: "bg-blue-100 text-blue-800",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  in_progress: {
    label: "En cours",
    color: "bg-green-100 text-green-800",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  completed: {
    label: "Terminé",
    color: "bg-gray-100 text-gray-800",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  cancelled: {
    label: "Annulé",
    color: "bg-red-100 text-red-800",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  rescheduled: {
    label: "Reporté",
    color: "bg-yellow-100 text-yellow-800",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
};

const typeIcons = {
  video_call: Video,
  phone: Phone,
  in_person: MapPin,
};

export function InterviewsBoard({
  projectId,
  onViewInterview,
  onEditInterview,
  onDeleteInterview,
  onScheduleInterview,
}: InterviewsBoardProps) {
  const { data: interviews = [], isLoading, error } = useInterviewsByProject(projectId);
  const updateStatusMutation = useUpdateInterviewStatus();

  // État des modales
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const groupedInterviews = useMemo(() => {
    const groups = {
      scheduled: [] as Interview[],
      in_progress: [] as Interview[],
      completed: [] as Interview[],
      cancelled: [] as Interview[],
      rescheduled: [] as Interview[],
    };

    interviews.forEach((interview) => {
      groups[interview.status].push(interview);
    });

    // Trier par date
    Object.keys(groups).forEach((status) => {
      groups[status as keyof typeof groups].sort((a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
    });

    return groups;
  }, [interviews]);

  const handleStatusChange = async (interview: Interview, newStatus: Interview['status']) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: interview.id,
        status: newStatus,
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const handleViewInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowDetailsModal(true);
    onViewInterview?.(interview);
  };

  const handleEditInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowDetailsModal(true);
    onEditInterview?.(interview);
  };

  const handleDeleteInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    onDeleteInterview?.(interview);
  };

  const handleScheduleInterview = () => {
    setShowScheduleModal(true);
    onScheduleInterview?.();
  };

  const handleOpenEvaluation = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowEvaluationModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Chargement des entretiens..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          Erreur lors du chargement des entretiens
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Entretiens</h2>
          <p className="text-muted-foreground">
            Gérez et suivez tous les entretiens de ce projet
          </p>
        </div>
        <Button onClick={onScheduleInterview} className="gap-2">
          <Plus className="h-4 w-4" />
          Planifier un entretien
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-[600px]">
        {Object.entries(statusConfig).map(([status, config]) => {
          const statusInterviews = groupedInterviews[status as keyof typeof groupedInterviews];

          return (
            <div key={status} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", config.color.replace('text-', 'bg-').replace('-800', '-500'))} />
                  <h3 className="font-medium">{config.label}</h3>
                  <Badge variant="outline" className="text-xs">
                    {statusInterviews.length}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {statusInterviews.map((interview) => (
                    <InterviewCard
                      key={interview.id}
                      interview={interview}
                      config={config}
                      onView={() => handleViewInterview(interview)}
                      onEdit={() => handleEditInterview(interview)}
                      onDelete={() => handleDeleteInterview(interview)}
                      onEvaluate={() => handleOpenEvaluation(interview)}
                      onStatusChange={(newStatus) => handleStatusChange(interview, newStatus)}
                    />
                  ))}
                </AnimatePresence>

                {statusInterviews.length === 0 && (
                  <div className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground",
                    config.borderColor
                  )}>
                    Aucun entretien {config.label.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modales */}
      <ScheduleInterviewModal
        candidate={null} // TODO: Ajouter la sélection de candidat
        projectId={projectId}
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onScheduled={(interview) => {
          console.log("Entretien planifié:", interview);
          // Les données seront automatiquement actualisées par TanStack Query
        }}
      />

      <InterviewDetailsModal
        interview={selectedInterview}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedInterview(null);
        }}
        onUpdated={(interview) => {
          console.log("Entretien mis à jour:", interview);
          // Les données seront automatiquement actualisées par TanStack Query
        }}
        onDeleted={() => {
          setShowDetailsModal(false);
          setSelectedInterview(null);
          // Les données seront automatiquement actualisées par TanStack Query
        }}
      />

      <InterviewEvaluationModal
        interview={selectedInterview}
        isOpen={showEvaluationModal}
        onClose={() => {
          setShowEvaluationModal(false);
          setSelectedInterview(null);
        }}
        onSaved={(evaluation) => {
          console.log("Évaluation sauvegardée:", evaluation);
          setShowEvaluationModal(false);
          setSelectedInterview(null);
        }}
      />
    </div>
  );
}

interface InterviewCardProps {
  interview: Interview;
  config: typeof statusConfig[keyof typeof statusConfig];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEvaluate: () => void;
  onStatusChange: (status: Interview['status']) => void;
}

function InterviewCard({
  interview,
  config,
  onView,
  onEdit,
  onDelete,
  onEvaluate,
  onStatusChange
}: InterviewCardProps) {
  const TypeIcon = typeIcons[interview.type];
  const scheduledDate = new Date(interview.scheduled_at);
  const isToday = format(scheduledDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isPast = scheduledDate < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        config.bgColor,
        config.borderColor,
        isToday && "ring-2 ring-blue-400 ring-opacity-50",
        isPast && interview.status === 'scheduled' && "ring-2 ring-orange-400 ring-opacity-50"
      )}>
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {interview.title}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {interview.candidate?.name}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir les détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                {interview.status === 'completed' && (
                  <DropdownMenuItem onClick={onEvaluate}>
                    <Star className="h-4 w-4 mr-2" />
                    Évaluer
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Date and Time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {format(scheduledDate, 'dd MMM yyyy', { locale: fr })}
            </span>
            <Clock className="h-3 w-3 ml-1" />
            <span>
              {format(scheduledDate, 'HH:mm')}
            </span>
          </div>

          {/* Type and Duration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <TypeIcon className="h-3 w-3" />
              <span className="text-muted-foreground">
                {interview.duration_minutes}min
              </span>
            </div>

            {interview.participants && interview.participants.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{interview.participants.length}</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={cn("text-xs", config.color)}>
              {config.label}
            </Badge>

            {isToday && (
              <Badge variant="outline" className="text-xs text-blue-600">
                Aujourd'hui
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}