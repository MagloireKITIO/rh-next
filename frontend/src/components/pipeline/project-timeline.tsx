"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useProjectTimeline } from "@/hooks/queries";
import { TimelineEvent } from "@/lib/api-client";
import {
  ArrowRight,
  UserPlus,
  UserMinus,
  Brain,
  Mail,
  StickyNote,
  Plus,
  Edit,
  Trash2,
  Clock,
  User,
  GitBranch,
  GitCommit
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProjectTimelineProps {
  projectId: string;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'CANDIDATE_MOVED':
      return <ArrowRight className="h-3 w-3" />;
    case 'CANDIDATE_ADDED':
      return <UserPlus className="h-3 w-3" />;
    case 'CANDIDATE_REMOVED':
      return <UserMinus className="h-3 w-3" />;
    case 'CANDIDATE_ANALYZED':
      return <Brain className="h-3 w-3" />;
    case 'EMAIL_SENT':
      return <Mail className="h-3 w-3" />;
    case 'NOTE_ADDED':
      return <StickyNote className="h-3 w-3" />;
    case 'STAGE_CREATED':
      return <Plus className="h-3 w-3" />;
    case 'STAGE_UPDATED':
      return <Edit className="h-3 w-3" />;
    case 'STAGE_DELETED':
      return <Trash2 className="h-3 w-3" />;
    default:
      return <GitCommit className="h-3 w-3" />;
  }
};

const getEventColorClass = (eventType: string) => {
  switch (eventType) {
    case 'CANDIDATE_MOVED':
      return 'border-primary-500 bg-primary-50 text-primary-700';
    case 'CANDIDATE_ADDED':
      return 'border-green-500 bg-green-50 text-green-700';
    case 'CANDIDATE_REMOVED':
      return 'border-red-500 bg-red-50 text-red-700';
    case 'CANDIDATE_ANALYZED':
      return 'border-indigo-500 bg-indigo-50 text-indigo-700';
    case 'EMAIL_SENT':
      return 'border-yellow-500 bg-yellow-50 text-yellow-700';
    case 'NOTE_ADDED':
      return 'border-gray-400 bg-gray-50 text-gray-700';
    case 'STAGE_CREATED':
      return 'border-green-500 bg-green-50 text-green-700';
    case 'STAGE_UPDATED':
      return 'border-orange-500 bg-orange-50 text-orange-700';
    case 'STAGE_DELETED':
      return 'border-red-500 bg-red-50 text-red-700';
    default:
      return 'border-gray-400 bg-gray-50 text-gray-700';
  }
};

const getBranchColor = (eventType: string) => {
  switch (eventType) {
    case 'CANDIDATE_MOVED':
      return '#60a5fa'; // primary-400
    case 'CANDIDATE_ADDED':
      return '#10b981'; // success
    case 'CANDIDATE_REMOVED':
      return '#ef4444'; // danger
    case 'CANDIDATE_ANALYZED':
      return '#8b31ff'; // purple from config
    case 'EMAIL_SENT':
      return '#f59e0b'; // warning
    case 'NOTE_ADDED':
      return '#9ca3af'; // gray-400
    case 'STAGE_CREATED':
      return '#10b981'; // success
    case 'STAGE_UPDATED':
      return '#f59e0b'; // warning
    case 'STAGE_DELETED':
      return '#ef4444'; // danger
    default:
      return '#9ca3af'; // gray-400
  }
};

const getEventTitle = (event: TimelineEvent) => {
  switch (event.eventType) {
    case 'CANDIDATE_MOVED':
      return `${event.candidateName} déplacé(e)`;
    case 'CANDIDATE_ADDED':
      return `${event.candidateName} ajouté(e)`;
    case 'CANDIDATE_REMOVED':
      return `${event.candidateName} supprimé(e)`;
    case 'CANDIDATE_ANALYZED':
      return `${event.candidateName} analysé(e)`;
    case 'EMAIL_SENT':
      return `Email envoyé`;
    case 'NOTE_ADDED':
      return `Note ajoutée`;
    case 'STAGE_CREATED':
      return `Étape créée`;
    case 'STAGE_UPDATED':
      return `Étape modifiée`;
    case 'STAGE_DELETED':
      return `Étape supprimée`;
    default:
      return 'Événement';
  }
};

const getEventDescription = (event: TimelineEvent) => {
  switch (event.eventType) {
    case 'CANDIDATE_MOVED':
      return `De "${event.eventData?.fromStage || 'N/A'}" vers "${event.eventData?.toStage || 'N/A'}"`;
    case 'CANDIDATE_ANALYZED':
      return event.eventData?.analysisScore
        ? `Score: ${event.eventData.analysisScore}/100`
        : 'Analyse IA terminée';
    case 'EMAIL_SENT':
      return event.eventData?.emailSubject || 'Email automatique';
    case 'NOTE_ADDED':
      return event.description || 'Note ajoutée';
    case 'STAGE_CREATED':
    case 'STAGE_UPDATED':
      return event.eventData?.stageName ? `${event.eventData.stageName}` : 'Étape du pipeline';
    case 'STAGE_DELETED':
      return event.eventData?.stageName ? `${event.eventData.stageName}` : 'Étape supprimée';
    default:
      return event.description || 'Action effectuée';
  }
};

const TimelineBranch = ({ event, isLast, depth = 0 }: { event: TimelineEvent; isLast: boolean; depth?: number }) => {
  const marginLeft = depth * 24;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
      style={{ marginLeft: `${marginLeft}px` }}
    >
      {/* Branch line */}
      <div className="absolute left-0 top-0 w-6 h-full flex flex-col items-center">
        {/* Horizontal branch */}
        <div
          className="w-6 h-6 border-t-2 border-l-2 rounded-tl-lg"
          style={{ borderColor: getBranchColor(event.eventType) }}
        />

        {/* Vertical line continuation */}
        {!isLast && (
          <div
            className="w-0.5 flex-1 border-l-2"
            style={{ borderColor: getBranchColor(event.eventType) }}
          />
        )}
      </div>

      {/* Event content */}
      <div className="ml-8 pb-6">
        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-200">
          {/* Event indicator */}
          <div
            className="absolute left-0 top-0 w-1 h-full"
            style={{ backgroundColor: getBranchColor(event.eventType) }}
          />

          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Event icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getEventColorClass(event.eventType)}`}>
                {getEventIcon(event.eventType)}
              </div>

              {/* Event details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-800 leading-tight">
                      {getEventTitle(event)}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {getEventDescription(event)}
                    </p>
                  </div>

                  <Badge variant="outline" className="text-xs shrink-0 bg-gray-50 border-gray-300">
                    {format(new Date(event.createdAt), 'HH:mm', { locale: fr })}
                  </Badge>
                </div>

                {/* Additional info */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {event.userName && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{event.userName}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(event.createdAt), 'd MMM', { locale: fr })}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

const TimelineDay = ({ day, events, dayIndex }: { day: string; events: TimelineEvent[]; dayIndex: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: dayIndex * 0.1 }}
      className="relative"
    >
      {/* Day header - trunk of the tree */}
      <div className="flex items-center gap-4 mb-6 sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center shadow-sm">
            <GitBranch className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {format(new Date(day), 'EEEE d MMMM', { locale: fr })}
            </h3>
            <p className="text-xs text-gray-600">
              {events.length} événement{events.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200" />
      </div>

      {/* Main trunk line */}
      <div className="absolute left-5 top-12 w-0.5 h-full bg-gray-300" />

      {/* Events as branches */}
      <div className="ml-6 space-y-2">
        {events.map((event, index) => (
          <TimelineBranch
            key={event.id}
            event={event}
            isLast={index === events.length - 1}
            depth={0}
          />
        ))}
      </div>
    </motion.div>
  );
};

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const { data: timeline, isLoading, error } = useProjectTimeline(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Chargement de la timeline..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="font-medium mb-2 text-gray-800">Erreur de chargement</h3>
          <p className="text-sm text-gray-600">
            Impossible de charger la timeline du projet.
          </p>
        </div>
      </div>
    );
  }

  if (!timeline?.events || timeline.events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <GitBranch className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-medium mb-2 text-gray-800">Timeline vide</h3>
          <p className="text-sm text-gray-600">
            Aucun événement n'a encore été enregistré pour ce projet.
          </p>
        </div>
      </div>
    );
  }

  // Grouper les événements par jour
  const eventsByDay = timeline.events.reduce((acc, event) => {
    const day = format(new Date(event.createdAt), 'yyyy-MM-dd');
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
            <GitBranch className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">
            Timeline du Projet
          </h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Historique complet des actions et événements du pipeline de recrutement,
          organisé comme un arbre de développement.
        </p>
      </motion.div>

      {/* Timeline Tree */}
      <div className="space-y-8 relative">
        {Object.entries(eventsByDay).map(([day, events], dayIndex) => (
          <TimelineDay
            key={day}
            day={day}
            events={events}
            dayIndex={dayIndex}
          />
        ))}
      </div>

      {/* Footer stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-8 mt-8 border-t border-gray-200"
      >
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <span><strong>{timeline.total}</strong> événement{timeline.total > 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span><strong>{Object.keys(eventsByDay).length}</strong> jour{Object.keys(eventsByDay).length > 1 ? 's' : ''}</span>
          </div>

          {timeline.hasMore && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Plus d'événements disponibles</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}