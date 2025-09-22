"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Interview } from "@/lib/api-client";
import { useGenerateMeetingLink } from "@/hooks/mutations";
import { useCalendarEvents } from "@/hooks/queries";
import { toast } from "sonner";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Phone,
  MapPin,
  Users,
  ExternalLink,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface InterviewsCalendarProps {
  interviews: Interview[];
  onInterviewSelect?: (interview: Interview) => void;
  onSlotSelect?: (date: Date) => void;
  onScheduleInterview?: () => void;
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  rescheduled: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const typeIcons = {
  video_call: Video,
  phone: Phone,
  in_person: MapPin,
};

export function InterviewsCalendar({
  interviews,
  onInterviewSelect,
  onSlotSelect,
  onScheduleInterview
}: InterviewsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showGoogleEvents, setShowGoogleEvents] = useState(true);
  const generateMeetingLinkMutation = useGenerateMeetingLink();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Récupérer les événements Google Calendar pour le mois
  const { data: googleEvents = [] } = useCalendarEvents(
    monthStart.toISOString(),
    monthEnd.toISOString()
  );

  const interviewsByDate = useMemo(() => {
    return interviews.reduce((acc, interview) => {
      const date = format(new Date(interview.scheduled_at), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(interview);
      return acc;
    }, {} as Record<string, Interview[]>);
  }, [interviews]);

  const googleEventsByDate = useMemo(() => {
    return googleEvents.reduce((acc, event) => {
      const date = format(new Date(event.start.dateTime), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {} as Record<string, any[]>);
  }, [googleEvents]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleGenerateMeetingLink = async (interview: Interview) => {
    try {
      const result = await generateMeetingLinkMutation.mutateAsync(interview.id);
      toast.success("Lien de réunion généré");
    } catch (error) {
      console.error("Erreur lors de la génération du lien:", error);
    }
  };

  const handleJoinMeeting = (interview: Interview) => {
    if (interview.meeting_link) {
      window.open(interview.meeting_link, '_blank');
    } else {
      handleGenerateMeetingLink(interview);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={showGoogleEvents ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGoogleEvents(!showGoogleEvents)}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Événements Google
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px bg-muted p-px rounded-lg">
          {/* Headers des jours */}
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div
              key={day}
              className="bg-background p-3 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Jours du mois */}
          {monthDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayInterviews = interviewsByDate[dateKey] || [];
            const dayGoogleEvents = showGoogleEvents ? (googleEventsByDate[dateKey] || []) : [];
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "bg-background min-h-[120px] p-2 relative cursor-pointer hover:bg-muted/50 transition-colors",
                  isCurrentDay && "bg-blue-50"
                )}
                onClick={() => onSlotSelect?.(day)}
              >
                <div className={cn(
                  "text-sm font-medium mb-2",
                  isCurrentDay ? "text-blue-600" : "text-foreground"
                )}>
                  {format(day, 'd')}
                  {isCurrentDay && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full inline-block ml-1" />
                  )}
                </div>

                <div className="space-y-1">
                  {/* Entretiens du système */}
                  {dayInterviews.slice(0, 2).map((interview) => (
                    <CalendarInterviewCard
                      key={interview.id}
                      interview={interview}
                      onClick={(e) => {
                        e.stopPropagation();
                        onInterviewSelect?.(interview);
                      }}
                      onJoinMeeting={(e) => {
                        e.stopPropagation();
                        handleJoinMeeting(interview);
                      }}
                    />
                  ))}

                  {/* Événements Google Calendar */}
                  {dayGoogleEvents.slice(0, 2).map((event) => (
                    <CalendarGoogleEventCard
                      key={event.id}
                      event={event}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  ))}

                  {(dayInterviews.length > 2 || dayGoogleEvents.length > 2) && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{Math.max(0, dayInterviews.length - 2) + Math.max(0, dayGoogleEvents.length - 2)} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface CalendarGoogleEventCardProps {
  event: any;
  onClick: (e: React.MouseEvent) => void;
}

function CalendarGoogleEventCard({ event, onClick }: CalendarGoogleEventCardProps) {
  const startTime = new Date(event.start.dateTime);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-green-50 border border-green-200 rounded p-2 cursor-pointer hover:bg-green-100 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="h-3 w-3 text-green-600" />
            <span className="text-xs font-medium text-green-800 truncate">
              {event.summary}
            </span>
          </div>
          <div className="text-xs text-green-600">
            {format(startTime, 'HH:mm')}
          </div>
        </div>
        {!event.isInterviewEvent && (
          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
            Google
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

interface CalendarInterviewCardProps {
  interview: Interview;
  onClick: (e: React.MouseEvent) => void;
  onJoinMeeting: (e: React.MouseEvent) => void;
}

function CalendarInterviewCard({ interview, onClick, onJoinMeeting }: CalendarInterviewCardProps) {
  const TypeIcon = typeIcons[interview.type];
  const statusColor = statusColors[interview.status];
  const hasGoogleMeet = interview.meeting_link?.includes('meet.google.com');

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "p-2 rounded text-xs border cursor-pointer group",
        statusColor
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <TypeIcon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {format(new Date(interview.scheduled_at), 'HH:mm')}
          </span>
          {hasGoogleMeet && (
            <div className="w-1 h-1 bg-green-500 rounded-full flex-shrink-0" />
          )}
        </div>
        {interview.meeting_link && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onJoinMeeting}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="truncate font-medium">
        {interview.title}
      </div>

      <div className="truncate text-muted-foreground">
        {interview.candidate?.name}
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1">
          <Clock className="h-2 w-2" />
          <span>{interview.duration_minutes}min</span>
        </div>
        {interview.participants && interview.participants.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-2 w-2" />
            <span>{interview.participants.length}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}