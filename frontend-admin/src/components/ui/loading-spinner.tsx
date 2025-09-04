"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className={cn("text-primary", sizeClasses[size])} />
      </motion.div>
      {text && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground"
        >
          {text}
        </motion.span>
      )}
    </div>
  );
}

interface AnalysisLoadingProps {
  candidateName: string;
  className?: string;
}

export function AnalysisLoading({ candidateName, className }: AnalysisLoadingProps) {
  const dots = [0, 1, 2];

  return (
    <div className={cn("flex items-center gap-3 p-4 border rounded-lg bg-muted/30", className)}>
      <div className="flex gap-1">
        {dots.map((dot) => (
          <motion.div
            key={dot}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              y: [-4, 4, -4],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: dot * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">Analyzing {candidateName}</p>
        <p className="text-xs text-muted-foreground">AI is processing the CV...</p>
      </div>
    </div>
  );
}

interface UploadProgressProps {
  progress: number;
  filename: string;
  className?: string;
}

export function UploadProgress({ progress, filename, className }: UploadProgressProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium truncate">{filename}</span>
        <span className="text-muted-foreground">{progress}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}