"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Project, projectsApi, candidatesApi, apiClient } from "@/lib/api-client";
import { 
  Save, 
  Trash2, 
  Archive, 
  Copy, 
  Download, 
  RefreshCw, 
  AlertTriangle,
  Users,
  Settings as SettingsIcon,
  Upload,
  FileText,
  X
} from "lucide-react";
import { toast } from "sonner";

interface ProjectSettingsProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdate: (updatedProject: Project) => void;
  onProjectDelete: () => void;
  onCandidatesRefresh?: () => void;
}

export function ProjectSettings({ 
  project, 
  isOpen, 
  onClose, 
  onProjectUpdate, 
  onProjectDelete,
  onCandidatesRefresh 
}: ProjectSettingsProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [clearConfirmation, setClearConfirmation] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: project.name,
    jobDescription: project.jobDescription,
    customPrompt: project.customPrompt || "",
    status: project.status,
    startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 16) : "",
    endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 16) : "",
    offerDescription: project.offerDescription || ""
  });

  const handleSaveGeneral = async () => {
    setIsLoading(true);
    try {
      const response = await projectsApi.update(project.id, formData);
      onProjectUpdate(response.data);
      toast.success("Project settings updated successfully");
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Error updating project settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmation !== project.name) {
      toast.error("Please type the project name exactly to confirm deletion");
      return;
    }

    setIsLoading(true);
    try {
      await projectsApi.delete(project.id);
      toast.success("Project deleted successfully");
      onProjectDelete();
      onClose();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Error deleting project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveProject = async () => {
    setIsLoading(true);
    try {
      const response = await projectsApi.update(project.id, { status: 'archived' });
      onProjectUpdate(response.data);
      toast.success("Project archived successfully");
    } catch (error) {
      console.error("Error archiving project:", error);
      toast.error("Error archiving project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllCandidates = async () => {
    if (clearConfirmation !== "DELETE ALL") {
      toast.error("Please type 'DELETE ALL' to confirm");
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all candidates for this project
      const candidatesResponse = await candidatesApi.getByProject(project.id);
      const candidates = candidatesResponse.data;
      
      // Delete all candidates
      const deletePromises = candidates.map((candidate: any) =>
        candidatesApi.delete(candidate.id)
      );

      await Promise.all(deletePromises);
      
      toast.success(`${candidates.length} candidates deleted successfully`);
      setShowClearDialog(false);
      setClearConfirmation("");
      
      // Refresh candidates list if callback provided
      if (onCandidatesRefresh) {
        onCandidatesRefresh();
      }
    } catch (error) {
      console.error("Error clearing candidates:", error);
      toast.error("Error clearing candidates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfferDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Please select a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await apiClient.post(`/projects/${project.id}/offer-document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onProjectUpdate(response.data);
      toast.success("Offer document uploaded successfully");
      
      // Reset the file input
      event.target.value = '';
    } catch (error) {
      console.error("Error uploading offer document:", error);
      toast.error("Error uploading offer document");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleRemoveOfferDocument = async () => {
    setIsLoading(true);
    try {
      const response = await projectsApi.update(project.id, {
        offerDocumentUrl: null,
        offerDocumentFileName: null
      });
      onProjectUpdate(response.data);
      toast.success("Offer document removed successfully");
    } catch (error) {
      console.error("Error removing offer document:", error);
      toast.error("Error removing offer document");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      // Export project data including candidates and analyses
      const response = await apiClient.get(`/analysis/project/${project.id}/report`);
      const reportData = response.data;
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}-complete-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Project data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Error exporting project data");
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "data", label: "Data Management", icon: Download },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-6xl !w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Project Settings
          </DialogTitle>
          <DialogDescription>
            Manage your project configuration, data, and advanced options.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-56 space-y-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === "general" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Basic project information and configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input
                        id="project-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter project name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="project-status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="job-description">Job Description</Label>
                      <Textarea
                        id="job-description"
                        value={formData.jobDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                        placeholder="Enter job description"
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="offer-description">Offer Description</Label>
                      <Textarea
                        id="offer-description"
                        value={formData.offerDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, offerDescription: e.target.value }))}
                        placeholder="Enter offer description"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Offer Document</Label>
                      <div className="space-y-3">
                        {project.offerDocumentUrl ? (
                          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">
                                {project.offerDocumentFileName || "Offer Document"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(project.offerDocumentUrl, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveOfferDocument}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <div className="text-sm text-gray-600 mb-2">
                              Upload offer document (PDF only, max 10MB)
                            </div>
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={handleOfferDocumentUpload}
                              disabled={uploadingDocument}
                              className="max-w-xs mx-auto"
                            />
                            {uploadingDocument && (
                              <div className="mt-2">
                                <LoadingSpinner size="sm" />
                                <span className="ml-2 text-sm">Uploading...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="custom-prompt">Custom AI Prompt</Label>
                      <Textarea
                        id="custom-prompt"
                        value={formData.customPrompt}
                        onChange={(e) => setFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
                        placeholder="Enter custom AI evaluation prompt"
                        rows={3}
                      />
                    </div>

                    <Button onClick={handleSaveGeneral} disabled={isLoading} className="gap-2">
                      {isLoading ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "data" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>
                      Export, archive, and manage your project data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" onClick={handleExportData} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export Complete Data
                      </Button>
                      
                      <Button variant="outline" onClick={handleArchiveProject} className="gap-2">
                        <Archive className="h-4 w-4" />
                        Archive Project
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="text-sm text-muted-foreground">
                      <h4 className="font-medium mb-2">Export includes:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Project configuration and settings</li>
                        <li>All candidate information and CVs</li>
                        <li>AI analysis results and scores</li>
                        <li>Ranking history and changes</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "danger" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription>
                      Irreversible actions that will permanently delete data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Clear All Candidates */}
                    <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50">
                          <Trash2 className="h-4 w-4" />
                          Clear All Candidates
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Clear All Candidates?</DialogTitle>
                          <DialogDescription>
                            This will permanently delete all candidates and their analyses from this project, 
                            but keep the project itself. This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label>Type <strong>DELETE ALL</strong> to confirm:</Label>
                          <Input
                            value={clearConfirmation}
                            onChange={(e) => setClearConfirmation(e.target.value)}
                            placeholder="DELETE ALL"
                            className="mt-2"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowClearDialog(false);
                              setClearConfirmation("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleClearAllCandidates}
                            disabled={isLoading || clearConfirmation !== "DELETE ALL"}
                            className="gap-2"
                          >
                            {isLoading ? <LoadingSpinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                            Clear All Candidates
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Separator />

                    {/* Delete Project */}
                    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete Project Permanently
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription asChild>
                            <div>
                              <p>
                                This action cannot be undone. This will permanently delete the project 
                                <strong> "{project.name}" </strong> and remove all associated data including:
                              </p>
                              <ul className="list-disc list-inside mt-2 ml-4">
                                <li>All candidates and their CVs</li>
                                <li>All AI analyses and scores</li>
                                <li>All ranking data and history</li>
                                <li>Project configuration</li>
                              </ul>
                            </div>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label>Type the project name to confirm: <strong>{project.name}</strong></Label>
                          <Input
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="Type project name here"
                            className="mt-2"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowDeleteDialog(false);
                              setDeleteConfirmation("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteProject}
                            disabled={isLoading || deleteConfirmation !== project.name}
                            className="gap-2"
                          >
                            {isLoading ? <LoadingSpinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                            Delete Project Forever
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <div className="text-sm text-red-600 bg-red-100 p-3 rounded border">
                      <strong>Warning:</strong> Deleting this project will remove all data permanently. 
                      Consider exporting your data first from the "Data Management" tab.
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}