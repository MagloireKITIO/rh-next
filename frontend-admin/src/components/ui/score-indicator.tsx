"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "./badge";

interface ScoreIndicatorProps {
  score: number | string | null | undefined;
  previousScore?: number | string | null | undefined;
  className?: string;
  showTrend?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ScoreIndicator({ 
  score, 
  previousScore, 
  className, 
  showTrend = true,
  size = "md" 
}: ScoreIndicatorProps) {
  // S'assurer que score est un nombre valide
  const parseScore = (value: number | string | null | undefined): number => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return !isNaN(parsed) ? parsed : 0;
    }
    return 0;
  };
  
  const validScore = parseScore(score);
  const validPreviousScore = previousScore ? parseScore(previousScore) : null;
  
  const scoreDiff = validPreviousScore ? validScore - validPreviousScore : 0;
  const trend = scoreDiff > 0 ? "up" : scoreDiff < 0 ? "down" : "stable";
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };
  
  const getTrendColor = (trend: string) => {
    if (trend === "up") return "text-green-600 dark:text-green-400";
    if (trend === "down") return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };
  
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-semibold"
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.span 
        className={cn(getScoreColor(validScore), sizeClasses[size])}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {validScore.toFixed(1)}
      </motion.span>
      
      {showTrend && validPreviousScore && scoreDiff !== 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-1"
        >
          <TrendIcon className={cn("h-3 w-3", getTrendColor(trend))} />
          <span className={cn("text-xs", getTrendColor(trend))}>
            {Math.abs(scoreDiff).toFixed(1)}
          </span>
        </motion.div>
      )}
    </div>
  );
}

interface ScoreProgressProps {
  score: number | string | null | undefined;
  className?: string;
  animated?: boolean;
}

export function ScoreProgress({ score, className, animated = true }: ScoreProgressProps) {
  // S'assurer que score est un nombre valide
  const parseScore = (value: number | string | null | undefined): number => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return !isNaN(parsed) ? parsed : 0;
    }
    return 0;
  };
  
  const validScore = parseScore(score);
  
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("relative h-2 bg-muted rounded-full overflow-hidden", className)}>
      <motion.div
        className={cn("h-full rounded-full", getProgressColor(validScore))}
        initial={animated ? { width: 0 } : { width: `${validScore}%` }}
        animate={{ width: `${validScore}%` }}
        transition={{ duration: animated ? 1 : 0, ease: "easeOut" }}
      />
    </div>
  );
}

interface RankingBadgeProps {
  ranking: number;
  total: number;
  trend?: "up" | "down" | "stable";
  className?: string;
}

export function RankingBadge({ ranking, total, trend, className }: RankingBadgeProps) {
  const getVariant = (ranking: number, total: number) => {
    const percentage = (ranking / total) * 100;
    if (percentage <= 10) return "default"; // Top 10%
    if (percentage <= 25) return "secondary"; // Top 25%
    return "outline";
  };

  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
    return null;
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-center gap-1", className)}
    >
      <Badge variant={getVariant(ranking, total)}>
        #{ranking}
      </Badge>
      {trend && getTrendIcon()}
    </motion.div>
  );
}