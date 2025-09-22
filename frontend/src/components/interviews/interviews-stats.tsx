"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Interview } from "@/lib/api-client";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Video,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";

interface InterviewsStatsProps {
  interviews: Interview[];
}

export function InterviewsStats({ interviews }: InterviewsStatsProps) {
  const stats = useMemo(() => {
    const today = new Date();

    return {
      total: interviews.length,
      scheduled: interviews.filter(i => i.status === 'scheduled').length,
      completed: interviews.filter(i => i.status === 'completed').length,
      cancelled: interviews.filter(i => i.status === 'cancelled').length,
      inProgress: interviews.filter(i => i.status === 'in_progress').length,
      today: interviews.filter(i => isToday(new Date(i.scheduled_at))).length,
      tomorrow: interviews.filter(i => isTomorrow(new Date(i.scheduled_at))).length,
      withGoogleMeet: interviews.filter(i =>
        i.meeting_link?.includes('meet.google.com')
      ).length,
      videoCall: interviews.filter(i => i.type === 'video_call').length,
      completionRate: interviews.length > 0
        ? Math.round((interviews.filter(i => i.status === 'completed').length / interviews.length) * 100)
        : 0
    };
  }, [interviews]);

  const statCards = [
    {
      title: "Total entretiens",
      value: stats.total,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Programmés",
      value: stats.scheduled,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Terminés",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Aujourd'hui",
      value: stats.today,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      urgent: stats.today > 0
    },
    {
      title: "Google Meet",
      value: stats.withGoogleMeet,
      icon: Video,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      subtitle: `${stats.total > 0 ? Math.round((stats.withGoogleMeet / stats.total) * 100) : 0}% des entretiens`
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={cn(
            "relative overflow-hidden transition-all duration-200 hover:shadow-md",
            stat.urgent && "ring-2 ring-purple-200"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {stat.title}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {stat.urgent && (
                <div className="absolute top-2 right-2">
                  <AlertCircle className="h-3 w-3 text-purple-600" />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}