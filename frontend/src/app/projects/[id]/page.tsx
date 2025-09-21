"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import { CVUpload } from "@/components/upload/cv-upload";
import { CandidateRanking, RankingStats } from "@/components/ranking/candidate-ranking";
import { ProjectSettings } from "@/components/project/project-settings";
import { SubtleProgress } from "@/components/queue/subtle-progress";
import { PipelineBoard, ProjectTimeline } from "@/components/pipeline";
import { InterviewsBoard, ScheduleInterviewModal, InterviewDetailsModal } from "@/components/interviews";
import { useProject, useProjectStats } from "@/hooks/queries";
import { useCandidatesByProject, useCandidatesByProjectLegacy, useRankingChanges } from "@/hooks/queries";
import { useAnalysesByProject, usePipelinesByProject } from "@/hooks/queries";
import { useUpdateProject } from "@/hooks/mutations";
import { useRemoveCandidateFromPipeline } from "@/hooks/mutations/useCandidateMutations";
import { useWebSocketSync } from "@/hooks/useWebSocketSync";
import { Project, Candidate, projectsApi, apiClient, analysisApi } from "@/lib/api-client";
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  FileText,
  Download,
  Settings,
  RefreshCw,
  Edit,
  Save,
  X,
  Share2,
  Copy,
  Check,
  Clock,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || "overview";
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [candidateToRemove, setCandidateToRemove] = useState<Candidate | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // États pour les modals d'interview
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showInterviewDetails, setShowInterviewDetails] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  // TanStack Query hooks
  const queryClient = useQueryClient();
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);
  const { data: projectStats, isLoading: statsLoading } = useProjectStats(projectId);
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidatesByProjectLegacy(projectId);
  const { data: rankingChanges = [] } = useRankingChanges(projectId);
  const { data: analyses = [] } = useAnalysesByProject(projectId);
  const { data: pipelines = [] } = usePipelinesByProject(projectId);
  const updateProjectMutation = useUpdateProject();
  const removeCandidateFromPipelineMutation = useRemoveCandidateFromPipeline();
  const { isConnected } = useWebSocketSync(projectId);

  // Récupérer le pipeline principal (normalement il n'y en a qu'un par projet)
  const mainPipeline = pipelines.length > 0 ? pipelines[0] : null;

  // Gestion d'erreur pour project
  useEffect(() => {
    if (projectError) {
      const axiosError = projectError as any;
      if (axiosError.response?.status === 404) {
        toast.error("Project not found");
      } else if (axiosError.response?.status === 401) {
        toast.error("Access denied - please login again");
      } else {
        toast.error("Error loading project: " + (axiosError.response?.data?.message || projectError.message));
      }
      router.push("/");
    }
  }, [projectError, router]);


  const handleUploadComplete = (results: any) => {
    // Toasts et cache invalidation gérés par le hook mutation
  };

  const handleViewCandidate = (candidate: Candidate) => {
    router.push(`/projects/${projectId}/candidates/${candidate.id}`);
  };

  const handleRemoveCandidateFromPipeline = (candidate: Candidate) => {
    setCandidateToRemove(candidate);
  };

  const confirmRemoveCandidate = () => {
    if (candidateToRemove && mainPipeline) {
      removeCandidateFromPipelineMutation.mutate({
        candidateId: candidateToRemove.id,
        pipelineId: mainPipeline.id
      });
      setCandidateToRemove(null);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const report = await analysisApi.generateReport(projectId);
      // Download or display report
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'project'}-report.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const handleRefreshData = () => {
    // Invalider toutes les queries liées à ce projet pour forcer un refetch
    queryClient.invalidateQueries({ queryKey: ['candidates', 'project', projectId] });
    queryClient.invalidateQueries({ queryKey: ['candidates', 'project', projectId, 'rankings'] });
    queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'stats'] });
    toast.success("Data refreshed");
  };

  const handleEditDescription = () => {
    setEditedDescription(project?.jobDescription || "");
    setIsEditingDescription(true);
  };

  const handleSaveDescription = () => {
    updateProjectMutation.mutate(
      { id: projectId, data: { jobDescription: editedDescription } },
      {
        onSuccess: () => {
          setIsEditingDescription(false);
        }
      }
    );
  };

  const handleCancelEdit = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
  };

  const handleDeleteCandidates = async (candidateIds: string[]) => {
    try {
      const deletePromises = candidateIds.map(id => 
        apiClient.delete(`/candidates/${id}`)
      );

      await Promise.all(deletePromises);
      
      // Refresh candidates list avec TanStack Query
      queryClient.invalidateQueries({ queryKey: ['candidates', 'project', projectId] });
      toast.success(`${candidateIds.length} candidate${candidateIds.length > 1 ? 's' : ''} deleted successfully`);
    } catch (error) {
      console.error("Error deleting candidates:", error);
      toast.error("Failed to delete candidates");
    }
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    // Les données sont maintenant mises à jour automatiquement par TanStack Query
    // La mutation useUpdateProject invalide déjà le cache du projet
  };

  const handleProjectDelete = () => {
    // Redirect to dashboard after deletion
    router.push("/");
  };

  const handleGenerateShareLink = async () => {
    try {
      const response = await apiClient.post(`/projects/${projectId}/share`, {
        expirationDays: 30
      });

      const { shareToken } = response.data;
      const link = `${window.location.origin}/shared/${shareToken}`;
      setShareLink(link);
      setShowShareDialog(true);
      toast.success("Lien de partage généré avec succès");
    } catch (error) {
      console.error("Error generating share link:", error);
      toast.error("Erreur lors de la génération du lien");
    }
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      try {
        await navigator.clipboard.writeText(shareLink);
        setLinkCopied(true);
        toast.success("Lien copié dans le presse-papier");
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (error) {
        toast.error("Impossible de copier le lien");
      }
    }
  };

  const handleRevokeShare = async () => {
    try {
      await apiClient.delete(`/projects/${projectId}/share`);
      
      setShareLink(null);
      setShowShareDialog(false);
      toast.success("Partage révoqué");
    } catch (error) {
      console.error("Error revoking share:", error);
      toast.error("Erreur lors de la révocation du partage");
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading project..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </div>
    );
  }

  const analyzedCandidates = candidates.filter(c => c.status === "analyzed");
  const averageScore = analyzedCandidates.length > 0
    ? analyzedCandidates.reduce((sum, c) => sum + Number(c.score), 0) / analyzedCandidates.length
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="outline" className="capitalize">
              {project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleGenerateShareLink} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share Project
          </Button>
          <Button variant="outline" onClick={handleGenerateReport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </motion.div>


      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <RankingStats candidates={candidates} />
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="candidates" className="gap-2">
              <Users className="h-4 w-4" />
              Candidates ({candidates.length})
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h18v18H3V3z"/>
                <path d="M9 3v18"/>
                <path d="M15 3v18"/>
              </svg>
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="interviews" className="gap-2">
              <Calendar className="h-4 w-4" />
              Entretiens
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <FileText className="h-4 w-4" />
              Upload CVs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Info */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Job Description</h4>
                        {!isEditingDescription && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEditDescription}
                            className="h-6 w-6 p-0 hover:bg-muted"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {isEditingDescription ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            className="min-h-[100px] resize-none"
                            placeholder="Enter job description..."
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveDescription}
                              className="gap-1"
                            >
                              <Save className="h-3 w-3" />
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="gap-1"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {project.jobDescription}
                        </p>
                      )}
                    </div>
                    {project.customPrompt && (
                      <div>
                        <h4 className="font-medium mb-2">Custom AI Prompt</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {project.customPrompt}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Ranking */}
              <div className="lg:col-span-2">
                <SubtleProgress projectId={projectId} />
                <CandidateRanking
                  projectId={projectId}
                  onViewCandidate={handleViewCandidate}
                  onDeleteCandidates={handleDeleteCandidates}
                  autoRefresh={false}
                  enablePagination={true}
                  pageSize={10}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            <SubtleProgress projectId={projectId} />
            <CandidateRanking
              projectId={projectId}
              onViewCandidate={handleViewCandidate}
              onDeleteCandidates={handleDeleteCandidates}
              autoRefresh={true}
              enablePagination={true}
              pageSize={20}
            />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            {mainPipeline ? (
              <PipelineBoard
                projectId={projectId}
                pipelineId={mainPipeline.id}
                onViewCandidate={handleViewCandidate}
                onDeleteCandidate={handleRemoveCandidateFromPipeline}
                onScheduleInterview={(candidate) => {
                  setSelectedCandidate(candidate);
                  setShowScheduleModal(true);
                }}
              />
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3h18v18H3V3z"/>
                      <path d="M9 3v18"/>
                      <path d="M15 3v18"/>
                    </svg>
                  </div>
                  <h3 className="font-medium mb-2">Pipeline en cours de création</h3>
                  <p className="text-sm text-muted-foreground">
                    Le pipeline de recrutement est en cours de création pour ce projet.
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mt-4"
                  >
                    Actualiser
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="interviews" className="space-y-6">
            <InterviewsBoard
              projectId={projectId}
              onScheduleInterview={() => {
                setShowScheduleModal(true);
              }}
              onViewInterview={(interview) => {
                setSelectedInterview(interview);
                setShowInterviewDetails(true);
              }}
              onEditInterview={(interview) => {
                setSelectedInterview(interview);
                setShowInterviewDetails(true);
              }}
              onDeleteInterview={(interview) => {
                // La suppression est gérée dans le modal de détails
                setSelectedInterview(interview);
                setShowInterviewDetails(true);
              }}
            />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <ProjectTimeline projectId={projectId} />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <CVUpload
                projectId={projectId}
                onUploadComplete={handleUploadComplete}
                maxFiles={500}
              />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommandations IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { type: "RECRUTER", count: analyzedCandidates.filter(c => c.analyses?.[0]?.analysisData?.hrDecision?.recommendation === "RECRUTER").length, color: "bg-green-500", label: "À recruter" },
                      { type: "ENTRETIEN", count: analyzedCandidates.filter(c => c.analyses?.[0]?.analysisData?.hrDecision?.recommendation === "ENTRETIEN").length, color: "bg-blue-500", label: "Entretien" },
                      { type: "REJETER", count: analyzedCandidates.filter(c => c.analyses?.[0]?.analysisData?.hrDecision?.recommendation === "REJETER").length, color: "bg-red-500", label: "Rejeter" }
                    ].map((rec) => (
                      <div key={rec.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${rec.color}`} />
                          <span className="text-sm">{rec.label}</span>
                        </div>
                        <span className="font-medium">{rec.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Priorités Recrutement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { priority: "HIGH", count: analyzedCandidates.filter(c => c.analyses?.[0]?.analysisData?.hrDecision?.priority === "HIGH").length, color: "bg-red-500", label: "Haute" },
                      { priority: "MEDIUM", count: analyzedCandidates.filter(c => c.analyses?.[0]?.analysisData?.hrDecision?.priority === "MEDIUM").length, color: "bg-yellow-500", label: "Moyenne" },
                      { priority: "LOW", count: analyzedCandidates.filter(c => c.analyses?.[0]?.analysisData?.hrDecision?.priority === "LOW").length, color: "bg-muted-foreground", label: "Faible" }
                    ].map((prio) => (
                      <div key={prio.priority} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${prio.color}`} />
                          <span className="text-sm">{prio.label}</span>
                        </div>
                        <span className="font-medium">{prio.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adéquation Technique</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-center">
                      {analyzedCandidates.length > 0 
                        ? Math.round(analyzedCandidates.reduce((sum, c) => sum + (c.analyses?.[0]?.analysisData?.skillsMatch?.technical || 0), 0) / analyzedCandidates.length)
                        : 0}/100
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Score moyen technique</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risques Identifiés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {analyzedCandidates.filter(c => c.analyses?.[0]?.analysisData?.risks?.length > 0).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Candidats avec risques</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Candidats Prioritaires</CardTitle>
                  <CardDescription>Recommandés pour recrutement immédiat</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyzedCandidates
                      .filter(c => c.analyses?.[0]?.analysisData?.hrDecision?.recommendation === "RECRUTER")
                      .sort((a, b) => (b.analyses?.[0]?.analysisData?.hrDecision?.confidence || 0) - (a.analyses?.[0]?.analysisData?.hrDecision?.confidence || 0))
                      .slice(0, 5)
                      .map((candidate) => (
                        <div key={candidate.id} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors" onClick={() => handleViewCandidate(candidate)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-green-600">#{candidate.ranking}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{candidate.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {candidate.analyses?.[0]?.analysisData?.hrDecision?.confidence}% confiance • Score: {Number(candidate.score).toFixed(1)}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            {candidate.analyses?.[0]?.analysisData?.hrDecision?.recommendation}
                          </Badge>
                        </div>
                      ))
                    }
                    {analyzedCandidates.filter(c => c.analyses?.[0]?.analysisData?.hrDecision?.recommendation === "RECRUTER").length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">Aucun candidat recommandé pour recrutement</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alertes Recrutement</CardTitle>
                  <CardDescription>Points d'attention identifiés</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyzedCandidates
                      .filter(c => c.analyses?.[0]?.analysisData?.risks?.length > 0)
                      .slice(0, 5)
                      .map((candidate) => (
                        <div key={candidate.id} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors" onClick={() => handleViewCandidate(candidate)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-orange-600">⚠</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{candidate.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {candidate.analyses?.[0]?.analysisData?.risks?.length} point(s) d'attention
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            Risques
                          </Badge>
                        </div>
                      ))
                    }
                    {analyzedCandidates.filter(c => c.analyses?.[0]?.analysisData?.risks?.length > 0).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">Aucun risque majeur identifié</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Project Settings Modal */}
      {project && (
        <ProjectSettings
          project={project}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onProjectUpdate={handleProjectUpdate}
          onProjectDelete={handleProjectDelete}
          onCandidatesRefresh={() => queryClient.invalidateQueries({ queryKey: ['candidates', 'project', projectId] })}
        />
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager le projet</DialogTitle>
            <DialogDescription>
              Générez un lien public pour partager ce projet avec vos collègues. 
              Ils pourront consulter les analyses des candidats même sans compte.
            </DialogDescription>
          </DialogHeader>
          
          {shareLink && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg border">
                <div className="text-sm text-muted-foreground mb-2">Lien de partage :</div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={shareLink} 
                    readOnly 
                    className="flex-1 p-2 text-sm bg-background border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button 
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {linkCopied ? 'Copié' : 'Copier'}
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                ⚠️ Ce lien expire dans 30 jours. Les personnes ayant accès à ce lien peuvent consulter 
                les analyses des candidats mais ne peuvent pas les modifier.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Fermer
            </Button>
            {shareLink && (
              <Button variant="destructive" onClick={handleRevokeShare}>
                Révoquer le partage
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation pour retirer un candidat du pipeline */}
      <Dialog open={!!candidateToRemove} onOpenChange={(open) => !open && setCandidateToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer du pipeline</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer <strong>{candidateToRemove?.name}</strong> du pipeline ?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Le candidat sera retiré de toutes les étapes du pipeline mais restera dans le projet.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCandidateToRemove(null)}
              disabled={removeCandidateFromPipelineMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveCandidate}
              disabled={removeCandidateFromPipelineMutation.isPending}
            >
              {removeCandidateFromPipelineMutation.isPending ? 'Suppression...' : 'Retirer du pipeline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals d'interview */}
      <ScheduleInterviewModal
        candidate={selectedCandidate}
        projectId={projectId}
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedCandidate(null);
        }}
        onScheduled={(interview) => {
          setShowScheduleModal(false);
          setSelectedCandidate(null);
          toast.success("Entretien planifié avec succès");
        }}
      />

      <InterviewDetailsModal
        interview={selectedInterview}
        isOpen={showInterviewDetails}
        onClose={() => {
          setShowInterviewDetails(false);
          setSelectedInterview(null);
        }}
        onUpdated={(interview) => {
          setSelectedInterview(interview);
          toast.success("Entretien mis à jour");
        }}
        onDeleted={() => {
          setShowInterviewDetails(false);
          setSelectedInterview(null);
          toast.success("Entretien supprimé");
        }}
      />
    </div>
  );
}