"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

export function AnimatedCard({ 
  children, 
  className, 
  hover = true, 
  delay = 0,
  direction = "up"
}: AnimatedCardProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up": return { y: 20, opacity: 0 };
      case "down": return { y: -20, opacity: 0 };
      case "left": return { x: -20, opacity: 0 };
      case "right": return { x: 20, opacity: 0 };
      default: return { y: 20, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : {}}
      className={className}
    >
      <Card className="h-full transition-shadow duration-200 hover:shadow-md">
        {children}
      </Card>
    </motion.div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  delay?: number;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className, 
  delay = 0 
}: StatsCardProps) {
  return (
    <AnimatedCard delay={delay} className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.1 }}
            className="text-muted-foreground"
          >
            {icon}
          </motion.div>
        )}
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.2 }}
          className="text-2xl font-bold"
        >
          {value}
        </motion.div>
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.3 }}
            className="text-xs text-muted-foreground"
          >
            {description}
          </motion.p>
        )}
        {trend && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: delay + 0.4 }}
            className={cn(
              "text-xs flex items-center gap-1 mt-1",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
            <span className="text-muted-foreground">from last period</span>
          </motion.div>
        )}
      </CardContent>
    </AnimatedCard>
  );
}

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    candidatesCount: number;
    averageScore: number;
    status: string;
    createdAt: string;
  };
  onSelect: () => void;
  className?: string;
  delay?: number;
}

export function ProjectCard({ project, onSelect, className, delay = 0 }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "completed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "paused": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <AnimatedCard delay={delay} className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(project.status))}>
            {project.status}
          </span>
        </div>
        <CardDescription>
          Created {new Date(project.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Candidates</p>
            <p className="text-2xl font-bold">{project.candidatesCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Score</p>
            <p className="text-2xl font-bold">{project.averageScore.toFixed(1)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <motion.button
          onClick={onSelect}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Open Project
        </motion.button>
      </CardFooter>
    </AnimatedCard>
  );
}