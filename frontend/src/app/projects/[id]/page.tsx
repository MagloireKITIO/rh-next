"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useProjects, useCandidates, useAnalysis } from "@/hooks/use-api";
import { useAppStore } from "@/lib/store";
import { useWebSocket } from "@/hooks/use-websocket";
import { Project, Candidate, projectsApi, apiClient } from "@/lib/api-client";
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
  Check
} from "lucide-react";
import { toast } from "sonner";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  const { isLoading, setCurrentProject } = useAppStore();
  const { 
    candidates, 
    fetchCandidatesByProject, 
    fetchRankingChanges 
  } = useCandidates();
  const { generateReport } = useAnalysis();
  const { isConnected, on, off } = useWebSocket({ 
    projectId, 
    enabled: true 
  });

  // Fetch project and candidates
  useEffect(() => {
    const fetchProject = async () => {
      console.log("🔍 [PROJECT PAGE] Fetching project with ID:", projectId);
      console.log("🔍 [PROJECT PAGE] Token in localStorage:", localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
      
      try {
        console.log("🔍 [PROJECT PAGE] Making API call to projectsApi.getById...");
        const response = await projectsApi.getById(projectId);
        
        console.log("✅ [PROJECT PAGE] API call successful, response:", response);
        console.log("✅ [PROJECT PAGE] Project data:", response.data);
        
        setProject(response.data);
        setCurrentProject(response.data);
        
        console.log("✅ [PROJECT PAGE] Project state updated successfully");
      } catch (error) {
        console.error("❌ [PROJECT PAGE] Error fetching project:", error);
        console.error("❌ [PROJECT PAGE] Error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        if (error.response?.status === 404) {
          toast.error("Project not found");
        } else if (error.response?.status === 401) {
          toast.error("Access denied - please login again");
        } else {
          toast.error("Error loading project: " + (error.response?.data?.message || error.message));
        }
        router.push("/");
      }
    };

    if (projectId) {
      console.log("🚀 [PROJECT PAGE] Starting project fetch for ID:", projectId);
      fetchProject();
    } else {
      console.log("❌ [PROJECT PAGE] No projectId provided");
    }
  }, [projectId, setCurrentProject, router]);

  // Fetch candidates separately
  useEffect(() => {
    if (projectId) {
      fetchCandidatesByProject(projectId);
    }
  }, [projectId]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!projectId) return;

    // Handle analysis completed - refresh candidates list
    on('analysis_completed', (data) => {
      console.log('📊 [PROJECT PAGE] Analysis completed, refreshing candidates...');
      fetchCandidatesByProject(projectId);
    });

    // Handle candidate updates
    on('candidateUpdate', (data) => {
      console.log('👤 [PROJECT PAGE] Candidate updated, refreshing candidates...');
      fetchCandidatesByProject(projectId);
    });

    return () => {
      off('analysis_completed');
      off('candidateUpdate');
    };
  }, [projectId, on, off, fetchCandidatesByProject]);

  const handleUploadComplete = (results: any) => {
    if (results.successful > 0) {
      // Refresh candidates list - not needed anymore due to WebSocket
      // fetchCandidatesByProject(projectId);
      // Toast already shown by useCandidates hook
    }
  };

  const handleViewCandidate = (candidate: Candidate) => {
    router.push(`/projects/${projectId}/candidates/${candidate.id}`);
  };

  const handleGenerateReport = async () => {
    try {
      const report = await generateReport(projectId);
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

  const handleRefreshData = async () => {
    await fetchCandidatesByProject(projectId);
    await fetchRankingChanges(projectId);
    toast.success("Data refreshed");
  };

  const handleEditDescription = () => {
    setEditedDescription(project?.jobDescription || "");
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    try {
      const response = await projectsApi.update(projectId, {
        jobDescription: editedDescription,
      });
      
      setProject(response.data);
      setIsEditingDescription(false);
      toast.success("Job description updated successfully");
    } catch (error) {
      console.error("Error updating job description:", error);
      toast.error("Error updating job description");
    }
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
      
      // Refresh candidates list
      fetchCandidatesByProject(projectId);
      toast.success(`${candidateIds.length} candidate${candidateIds.length > 1 ? 's' : ''} deleted successfully`);
    } catch (error) {
      console.error("Error deleting candidates:", error);
      toast.error("Failed to delete candidates");
    }
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
    setCurrentProject(updatedProject);
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

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading project..." />
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
          onClick={() => router.push("/")}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="candidates" className="gap-2">
              <Users className="h-4 w-4" />
              Candidates ({candidates.length})
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
                            className="h-6 w-6 p-0 hover:bg-gray-100"
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
                  candidates={candidates}
                  onViewCandidate={handleViewCandidate}
                  onDeleteCandidates={handleDeleteCandidates}
                  autoRefresh={false}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            <SubtleProgress projectId={projectId} />
            <CandidateRanking
              projectId={projectId}
              candidates={candidates}
              onViewCandidate={handleViewCandidate}
              onDeleteCandidates={handleDeleteCandidates}
              autoRefresh={true}
            />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <CVUpload
                projectId={projectId}
                onUploadComplete={handleUploadComplete}
                maxFiles={20}
              />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "Excellent (80+)", count: candidates.filter(c => Number(c.score) >= 80).length, color: "bg-green-500" },
                      { label: "Good (60-79)", count: candidates.filter(c => Number(c.score) >= 60 && Number(c.score) < 80).length, color: "bg-blue-500" },
                      { label: "Average (40-59)", count: candidates.filter(c => Number(c.score) >= 40 && Number(c.score) < 60).length, color: "bg-yellow-500" },
                      { label: "Poor (<40)", count: candidates.filter(c => Number(c.score) < 40).length, color: "bg-red-500" }
                    ].map((range) => (
                      <div key={range.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${range.color}`} />
                          <span className="text-sm">{range.label}</span>
                        </div>
                        <span className="font-medium">{range.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {candidates
                      .filter(c => c.status === "analyzed")
                      .sort((a, b) => Number(b.score) - Number(a.score))
                      .slice(0, 5)
                      .map((candidate, index) => (
                        <div key={candidate.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <span className="text-sm font-medium truncate">
                              {candidate.name}
                            </span>
                          </div>
                          <span className="font-medium">{Number(candidate.score).toFixed(1)}</span>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { status: "analyzed", label: "Analyzed", color: "bg-green-100 text-green-800" },
                      { status: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
                      { status: "error", label: "Error", color: "bg-red-100 text-red-800" }
                    ].map((statusInfo) => {
                      const count = candidates.filter(c => c.status === statusInfo.status).length;
                      return (
                        <div key={statusInfo.status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      );
                    })}
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
          onCandidatesRefresh={() => fetchCandidatesByProject(projectId)}
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
              
              <div className="text-sm text-gray-500">
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
    </div>
  );
}