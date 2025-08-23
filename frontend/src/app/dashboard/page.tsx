"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { NavBar } from "@/components/ui/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard, ProjectCard } from "@/components/ui/animated-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useProjects } from "@/hooks/queries";
import { WelcomeBanner } from "@/components/onboarding/welcome-banner";
import { useOnboarding } from "@/hooks/use-onboarding";
import { 
  Plus, 
  Users, 
  TrendingUp, 
  FileText, 
  Activity,
  BrainCircuit
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: projects = [], isLoading, error } = useProjects();
  const { shouldShowOnboarding } = useOnboarding();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalCandidates: 0,
    avgScore: 0,
    recentActivity: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);


  useEffect(() => {
    if (projects.length > 0) {
      const totalCandidates = projects.reduce((sum, p) => sum + (p.candidates?.length || 0), 0);
      const analyzedCandidates = projects.flatMap(p => p.candidates || [])
        .filter(c => c.status === "analyzed");
      const avgScore = analyzedCandidates.length > 0
        ? analyzedCandidates.reduce((sum, c) => sum + Number(c.score), 0) / analyzedCandidates.length
        : 0;
      
      setStats({
        totalProjects: projects.length,
        totalCandidates,
        avgScore,
        recentActivity: projects.filter(p => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(p.createdAt) > weekAgo;
        }).length
      });
    }
  }, [projects]);

  const handleCreateProject = () => {
    router.push("/projects/new");
  };

  const handleOpenProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Error loading dashboard: {error.message}
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <NavBar />
      
      <div className="container mx-auto p-6 pt-24 space-y-8">
        {/* Welcome Banner for new users */}
        <WelcomeBanner />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Bienvenue, {user.name} 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gérez vos projets de recrutement et analysez vos candidats avec l'IA
            </p>
          </div>
          <Button 
            id="create-project-btn"
            onClick={handleCreateProject} 
            className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Nouveau Projet
          </Button>
        </motion.div>

      {/* Stats Grid */}
      <div id="stats-overview" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects}
          description="Active recruitment projects"
          icon={<FileText className="h-4 w-4" />}
          delay={0}
        />
        <StatsCard
          title="Candidates"
          value={stats.totalCandidates}
          description="CVs uploaded and analyzed"
          icon={<Users className="h-4 w-4" />}
          delay={0.1}
        />
        <StatsCard
          title="Average Score"
          value={stats.avgScore.toFixed(1)}
          description="Across all candidates"
          icon={<TrendingUp className="h-4 w-4" />}
          delay={0.2}
        />
        <StatsCard
          title="Recent Activity"
          value={stats.recentActivity}
          description="Projects created this week"
          icon={<Activity className="h-4 w-4" />}
          delay={0.3}
        />
      </div>

      {/* Projects Section */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold tracking-tight">Recent Projects</h2>
          <p className="text-muted-foreground">
            Your latest recruitment projects and their progress
          </p>
        </motion.div>

        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            id="projects-list"
          >
            <Card className="text-center py-12">
              <CardContent>
                <BrainCircuit className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <CardTitle className="mb-2">No Projects Yet</CardTitle>
                <CardDescription className="mb-6">
                  Create your first recruitment project to start analyzing CVs with AI
                </CardDescription>
                <Button onClick={handleCreateProject} className="gap-2 active:scale-95 transition-all duration-200">
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div id="projects-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project, index) => {
              const candidatesCount = project.candidates?.length || 0;
              const analyzedCandidates = project.candidates?.filter(c => c.status === "analyzed") || [];
              const averageScore = analyzedCandidates.length > 0
                ? analyzedCandidates.reduce((sum, c) => sum + Number(c.score), 0) / analyzedCandidates.length
                : 0;

              return (
                <ProjectCard
                  key={project.id}
                  project={{
                    id: project.id,
                    name: project.name,
                    candidatesCount,
                    averageScore,
                    status: project.status,
                    createdAt: project.createdAt
                  }}
                  onSelect={() => handleOpenProject(project.id)}
                  delay={0.5 + index * 0.1}
                />
              );
            })}
          </div>
        )}

        {projects.length > 6 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center"
          >
            <Button
              variant="outline"
              onClick={() => router.push("/projects")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              View All Projects ({projects.length})
            </Button>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              AI Configuration
            </CardTitle>
            <CardDescription>
              Manage your AI settings and API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => router.push("/settings")}
              className="w-full"
            >
              Open Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              View detailed analytics and reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => router.push("/analytics")}
              className="w-full"
            >
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </div>
  );
}