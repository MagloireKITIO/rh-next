"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { NavBar } from "@/components/ui/navbar";
import { Sidebar } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/ui/animated-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/hooks/queries";
import { useUpdateProject, useDeleteProject } from "@/hooks/mutations";
import { 
  Plus, 
  Users, 
  TrendingUp, 
  FileText, 
  Activity,
  FolderOpen,
  List,
  Grid3X3,
  Calendar,
  Search,
  Filter,
  SortAsc,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: projects = [], isLoading, error } = useProjects();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'candidates'>('date');
  
  // Edit modal states
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    jobDescription: '',
    customPrompt: ''
  });
  
  // Delete modal states
  const [deletingProject, setDeletingProject] = useState<any>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const filteredProjects = projects
    .filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'candidates':
          return (b.candidates?.length || 0) - (a.candidates?.length || 0);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const handleCreateProject = () => {
    router.push("/projects/new");
  };

  const handleOpenProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleEditProject = (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditFormData({
      name: project.name,
      jobDescription: project.jobDescription || '',
      customPrompt: project.customPrompt || ''
    });
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    
    try {
      await updateProjectMutation.mutateAsync({
        id: editingProject.id,
        data: editFormData
      });
      setEditingProject(null);
      setEditFormData({ name: '', jobDescription: '', customPrompt: '' });
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingProject(project);
    setDeleteConfirmation('');
  };

  const confirmDeleteProject = async () => {
    if (!deletingProject || deleteConfirmation !== deletingProject.name) {
      return;
    }
    
    try {
      await deleteProjectMutation.mutateAsync(deletingProject.id);
      setDeletingProject(null);
      setDeleteConfirmation('');
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading projects..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Error loading projects: {error.message}
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
    <div className="min-h-screen bg-background">
      <Sidebar />
      <NavBar withSidebar={true} />
      
      <div className="ml-64 p-6 pt-28 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Projets de recrutement
            </h1>
            <p className="text-muted-foreground">
              Gérez tous vos projets de recrutement et analysez les candidatures
            </p>
          </div>
          <Button 
            onClick={handleCreateProject} 
            className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Nouveau Projet
          </Button>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border border-border"
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'candidates')}
            className="px-3 py-2 border border-border rounded-md bg-card text-foreground"
          >
            <option value="date">Plus récent</option>
            <option value="name">Nom A-Z</option>
            <option value="candidates">Plus de candidats</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Projects Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredProjects.length === 0 && searchTerm ? (
            <Card className="text-center py-12">
              <CardContent>
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <CardTitle className="mb-2">Aucun projet trouvé</CardTitle>
                <CardDescription>
                  Aucun projet ne correspond à votre recherche "{searchTerm}"
                </CardDescription>
              </CardContent>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <CardTitle className="mb-2">Aucun projet</CardTitle>
                <CardDescription className="mb-6">
                  Créez votre premier projet de recrutement pour commencer
                </CardDescription>
                <Button onClick={handleCreateProject} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer un projet
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => {
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
                    delay={index * 0.1}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-sm font-medium text-muted-foreground">
                  <div className="col-span-4">Nom du projet</div>
                  <div className="col-span-2">Candidats</div>
                  <div className="col-span-2">Score moyen</div>
                  <div className="col-span-2">Statut</div>
                  <div className="col-span-1">Créé le</div>
                  <div className="col-span-1">Actions</div>
                </div>
                
                {/* Project rows */}
                {filteredProjects.map((project, index) => {
                  const candidatesCount = project.candidates?.length || 0;
                  const analyzedCandidates = project.candidates?.filter(c => c.status === "analyzed") || [];
                  const averageScore = analyzedCandidates.length > 0
                    ? analyzedCandidates.reduce((sum, c) => sum + Number(c.score), 0) / analyzedCandidates.length
                    : 0;

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleOpenProject(project.id)}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="col-span-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {project.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ID: {project.id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <span className="flex items-center gap-1 text-foreground">
                          <Users className="h-4 w-4" />
                          {candidatesCount}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <span className="text-foreground">
                          {averageScore > 0 ? `${averageScore.toFixed(1)}/10` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {project.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      
                      <div className="col-span-1 flex items-center">
                        <span className="text-muted-foreground text-sm">
                          {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="col-span-1 flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProject(project.id);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEditProject(project, e)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteProject(project, e)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit Project Modal */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
            <DialogDescription>
              Modifiez les informations de votre projet de recrutement.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom du projet</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Ex: Développeur Frontend React"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-job-description">Description du poste</Label>
              <div className="relative">
                <Textarea
                  id="edit-job-description"
                  value={editFormData.jobDescription}
                  onChange={(e) => setEditFormData({ ...editFormData, jobDescription: e.target.value })}
                  placeholder="Décrivez le poste à pourvoir..."
                  className="min-h-[120px] max-h-[200px] overflow-y-auto resize-none"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-custom-prompt">Prompt personnalisé (optionnel)</Label>
              <div className="relative">
                <Textarea
                  id="edit-custom-prompt"
                  value={editFormData.customPrompt}
                  onChange={(e) => setEditFormData({ ...editFormData, customPrompt: e.target.value })}
                  placeholder="Instructions spécifiques pour l'analyse IA..."
                  className="min-h-[100px] max-h-[150px] overflow-y-auto resize-none"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateProject}
              disabled={updateProjectMutation.isPending || !editFormData.name.trim()}
            >
              {updateProjectMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Modal */}
      <Dialog open={!!deletingProject} onOpenChange={() => setDeletingProject(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Supprimer le projet</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Tous les candidats et leurs analyses seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start space-x-3">
                <Trash2 className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-300">
                    Vous êtes sur le point de supprimer "{deletingProject?.name}"
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Cette action supprimera définitivement :
                  </p>
                  <ul className="text-sm text-red-600 dark:text-red-400 mt-2 ml-4 list-disc">
                    <li>Le projet et ses paramètres</li>
                    <li>Tous les candidats associés</li>
                    <li>Toutes les analyses IA</li>
                    <li>Les rapports et statistiques</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="delete-confirmation">
                Pour confirmer, tapez le nom du projet : <strong>{deletingProject?.name}</strong>
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Tapez le nom du projet"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProject(null)}>
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteProject}
              disabled={deleteProjectMutation.isPending || deleteConfirmation !== deletingProject?.name}
            >
              {deleteProjectMutation.isPending ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}