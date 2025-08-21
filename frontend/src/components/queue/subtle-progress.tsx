"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/use-websocket";
import { Loader2, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { candidatesApi } from "@/lib/api-client";

interface QueueProgress {
  total: number;
  processed: number;
  remaining: number;
  isProcessing: boolean;
  estimatedTimeRemaining: string;
  percentComplete: number;
}

interface SubtleProgressProps {
  projectId: string;
  className?: string;
}

export function SubtleProgress({ projectId, className }: SubtleProgressProps) {
  const [progress, setProgress] = useState<QueueProgress | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { on, off } = useWebSocket({ 
    projectId, 
    enabled: true 
  });

  useEffect(() => {
    const handleQueueProgress = (data: any) => {
      console.log('🚀 [PROGRESS] Queue progress event received:', data);
      if (data.progress) {
        setProgress(data.progress);
        setIsVisible(true);
        console.log('🚀 [PROGRESS] Progress updated, now visible');
      }
    };

    const handleQueueCompleted = (data: any) => {
      console.log('✅ [PROGRESS] Queue completed event received:', data);
      if (data.progress) {
        setProgress(data.progress);
      }
      // Masquer après 2 secondes
      setTimeout(() => {
        setIsVisible(false);
        console.log('✅ [PROGRESS] Progress hidden after completion');
      }, 2000);
    };

    // Écouter tous les événements analysisUpdate pour débugger
    const handleAnalysisUpdate = (data: any) => {
      console.log('📡 [PROGRESS] AnalysisUpdate received:', data);
      if (data.type === 'queue_progress') {
        handleQueueProgress(data);
      } else if (data.type === 'queue_completed') {
        handleQueueCompleted(data);
      }
    };

    on('queue_progress', handleQueueProgress);
    on('queue_completed', handleQueueCompleted);
    on('analysisUpdate', handleAnalysisUpdate);

    return () => {
      off('queue_progress', handleQueueProgress);
      off('queue_completed', handleQueueCompleted);
      off('analysisUpdate', handleAnalysisUpdate);
    };
  }, [on, off]);

  // Récupérer le statut initial
  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const response = await candidatesApi.getQueueStatus(projectId);
        const status = response.data;
        if (status.isProcessing || status.total > 0) {
          setProgress(status);
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error fetching queue status:', error);
      }
    };

    fetchQueueStatus();
  }, [projectId]);

  if (!isVisible || !progress) {
    return null;
  }

  const isCompleted = progress.processed === progress.total && progress.total > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className={cn("mb-4", className)}
      >
        <div className="bg-muted/50 rounded-lg border p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : progress.isProcessing ? (
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 text-amber-600" />
              )}
              <span className="font-medium">
                {isCompleted ? "Analyse terminée" : 
                 progress.isProcessing ? "Analyse en cours" : 
                 "Analyse en attente"}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {progress.processed}/{progress.total}
              </Badge>
              {progress.isProcessing && progress.estimatedTimeRemaining && (
                <Badge variant="secondary" className="text-xs">
                  {progress.estimatedTimeRemaining}
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={progress.percentComplete} 
            className="h-1.5"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}