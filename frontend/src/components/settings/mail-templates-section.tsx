"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichEditor } from "@/components/ui/rich-editor";
import { Mail, Plus, Edit, Trash2, Copy, Eye, Star } from "lucide-react";
import { mailTemplatesApi } from "@/lib/api-client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

interface MailTemplate {
  id: string;
  type: string;
  name: string;
  description?: string;
  subject: string;
  html_content: string;
  text_content?: string;
  status: 'active' | 'draft' | 'archived';
  is_default: boolean;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export function MailTemplatesSection() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MailTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ html: string; subject: string } | null>(null);

  const [createForm, setCreateForm] = useState({
    type: '',
    name: '',
    description: '',
    subject: '',
    html_content: '',
    text_content: '',
    status: 'draft' as const
  });

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    subject: '',
    html_content: '',
    text_content: '',
    status: 'draft' as const
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Filtrer pour ne montrer que les templates d'automation (pas les templates système)
      const response = await mailTemplatesApi.getAll(user?.company?.id, 'automation');
      setTemplates(response.data);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Erreur lors du chargement des templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.subject) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    try {
      await mailTemplatesApi.create({
        ...createForm,
        company_id: user?.company?.id
      });
      toast.success("Template créé avec succès");
      setCreateDialogOpen(false);
      setCreateForm({
        type: '',
        name: '',
        description: '',
        subject: '',
        html_content: '',
        text_content: '',
        status: 'draft'
      });
      await loadTemplates();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleEdit = (template: MailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      status: template.status
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTemplate) return;

    try {
      await mailTemplatesApi.update(selectedTemplate.id, editForm);
      toast.success("Template mis à jour avec succès");
      setEditDialogOpen(false);
      setSelectedTemplate(null);
      await loadTemplates();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (template: MailTemplate) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le template "${template.name}" ?`)) {
      return;
    }

    try {
      await mailTemplatesApi.delete(template.id);
      toast.success("Template supprimé avec succès");
      await loadTemplates();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDuplicate = async (template: MailTemplate) => {
    try {
      await mailTemplatesApi.duplicate(template.id, `${template.name} (Copie)`);
      toast.success("Template dupliqué avec succès");
      await loadTemplates();
    } catch (error) {
      toast.error("Erreur lors de la duplication");
    }
  };

  const handleSetAsDefault = async (template: MailTemplate) => {
    try {
      await mailTemplatesApi.setAsDefault(template.id);
      toast.success("Template défini par défaut");
      await loadTemplates();
    } catch (error) {
      toast.error("Erreur lors de la définition par défaut");
    }
  };

  const handlePreview = async (template: MailTemplate) => {
    try {
      const response = await mailTemplatesApi.preview(template.id, {
        // Variables pour candidat
        candidate_name: "Jean Dupont",
        name: "Jean Dupont", // Alias pour candidate_name
        email: "jean.dupont@example.com",
        phone: "+33 6 12 34 56 78",
        
        // Variables pour entreprise/projet  
        company_name: user?.company?.name || "Votre Entreprise",
        project_name: "Développeur Frontend React",
        project_title: "Développeur Frontend React", // Alias
        
        // Variables système
        current_date: new Date().toLocaleDateString('fr-FR'),
        score: "85",
        summary: "Candidat avec une excellente expérience en React et TypeScript.",
        
        // Variables pour les liens (exemples)
        id: "123",
        projectId: "456",
        system_name: window.location.origin,
        
        // Variables utilisateur
        createdBy: {
          name: user?.name || "Utilisateur"
        },
        company: {
          name: user?.company?.name || "Votre Entreprise"
        }
      });
      setPreviewContent(response.data);
      setPreviewDialogOpen(true);
    } catch (error) {
      toast.error("Erreur lors de la prévisualisation");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Actif</Badge>;
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'archived':
        return <Badge variant="outline">Archivé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Templates de mail ({templates.length})</h3>
          <p className="text-sm text-muted-foreground">
            Gérez vos modèles d'emails pour les automatisations
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau template
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="max-w-none w-[98vw] h-[95vh] overflow-y-auto p-4" 
            style={{ maxWidth: '98vw', width: '98vw', maxHeight: '95vh' }}
          >
            <DialogHeader>
              <DialogTitle>Créer un nouveau template</DialogTitle>
              <DialogDescription>
                Créez un modèle d'email personnalisé pour vos automatisations
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 h-full">
              {/* Informations de base - Compactes */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="create-name" className="text-xs">Nom *</Label>
                  <Input
                    id="create-name"
                    size="sm"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom du template"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="create-type" className="text-xs">Type</Label>
                  <Select 
                    value={createForm.type}
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="create-status" className="text-xs">Statut</Label>
                  <Select 
                    value={createForm.status}
                    onValueChange={(value: 'active' | 'draft' | 'archived') => setCreateForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="create-subject" className="text-xs">Sujet *</Label>
                  <Input
                    id="create-subject"
                    size="sm"
                    value={createForm.subject}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Sujet de l'email"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              {/* Éditeur - Prend tout l'espace disponible */}
              <div className="flex-1 min-h-0">
                <RichEditor
                  value={createForm.html_content}
                  onChange={(value) => setCreateForm(prev => ({ ...prev, html_content: value }))}
                  placeholder="Bonjour {{name}}, nous avons bien reçu votre candidature pour le poste de {{project_name}}. Nous reviendrons vers vous dans les plus brefs délais. Cordialement, L'équipe {{company_name}}"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate}>
                Créer le template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" text="Chargement des templates..." />
          </div>
        ) : templates.length > 0 ? (
          templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{template.name}</h4>
                        {template.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        {getStatusBadge(template.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description || "Aucune description"}
                      </p>
                      <p className="text-sm font-medium text-blue-600">
                        Sujet: {template.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Type: {template.type} • Créé le {new Date(template.created_at!).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(template)}
                      className="h-8 w-8 p-0"
                      title="Prévisualiser"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Dupliquer"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    {!template.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetAsDefault(template)}
                        className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        title="Définir par défaut"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun template trouvé</p>
            <p className="text-sm">Créez votre premier template de mail</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent 
          className="max-w-none w-[98vw] h-[95vh] overflow-y-auto p-4" 
          style={{ maxWidth: '98vw', width: '98vw', maxHeight: '95vh' }}
        >
          <DialogHeader>
            <DialogTitle>Modifier le template</DialogTitle>
            <DialogDescription>
              Modifiez votre modèle d'email
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="grid grid-cols-1 gap-4 h-full">
              {/* Informations de base - Compactes */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="edit-name" className="text-xs">Nom</Label>
                  <Input
                    id="edit-name"
                    size="sm"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-subject" className="text-xs">Sujet</Label>
                  <Input
                    id="edit-subject"
                    size="sm"
                    value={editForm.subject}
                    onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status" className="text-xs">Statut</Label>
                  <Select 
                    value={editForm.status}
                    onValueChange={(value: 'active' | 'draft' | 'archived') => setEditForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-xs">Description</Label>
                  <Input
                    id="edit-description"
                    size="sm"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              {/* Éditeur - Prend tout l'espace disponible */}
              <div className="flex-1 min-h-0">
                <RichEditor
                  value={editForm.html_content}
                  onChange={(value) => setEditForm(prev => ({ ...prev, html_content: value }))}
                  placeholder="Modifiez le contenu de votre email..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdate}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Aperçu du template</DialogTitle>
            <DialogDescription>
              Voici comment votre email apparaîtra aux destinataires
            </DialogDescription>
          </DialogHeader>
          {previewContent && (
            <div className="space-y-4">
              <div>
                <Label>Sujet:</Label>
                <p className="font-medium">{previewContent.subject}</p>
              </div>
              <div>
                <Label>Contenu:</Label>
                <div 
                  className="border rounded-lg p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: previewContent.html }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}