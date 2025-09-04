'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  FileText,
  Code,
  Type,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface MailTemplate {
  id?: string;
  type: string;
  name: string;
  description?: string;
  subject: string;
  html_content: string;
  text_content?: string;
  status: 'active' | 'draft' | 'archived';
  is_default: boolean;
  version?: number;
}

interface TemplateType {
  type: string;
  label: string;
  description: string;
}

interface MailTemplateFormProps {
  template: MailTemplate | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function MailTemplateForm({ template, onCancel, onSuccess }: MailTemplateFormProps) {
  const [templateTypes, setTemplateTypes] = useState<TemplateType[]>([]);
  const [selectedContext, setSelectedContext] = useState<'system' | 'automation'>('automation');
  const [formData, setFormData] = useState<MailTemplate>({
    type: 'custom',
    name: '',
    description: '',
    subject: '',
    html_content: '',
    text_content: '',
    status: 'draft',
    is_default: false
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadTemplateTypes();
  }, []);

  useEffect(() => {
    if (template && templateTypes.length > 0) {
      // Déterminer le contexte basé sur le type existant
      const isSystemType = ['invitation', 'verification', 'password_reset', 'welcome'].includes(template.type);
      setSelectedContext(isSystemType ? 'system' : 'automation');
      
      setFormData({
        id: template.id,
        type: template.type,
        name: template.name,
        description: template.description || '',
        subject: template.subject,
        html_content: template.html_content,
        text_content: template.text_content || '',
        status: template.status,
        is_default: template.is_default,
        version: template.version
      });
    }
  }, [template, templateTypes]);

  const loadTemplateTypes = async () => {
    try {
      const response = await apiClient.get('/mail-templates/types');
      setTemplateTypes(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des types:', error);
    }
  };

  const handleInputChange = (field: keyof MailTemplate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.subject.trim() || !formData.html_content.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      
      // Nettoyer les données - exclure les propriétés auto-générées
      const payload = {
        type: formData.type,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        subject: formData.subject.trim(),
        html_content: formData.html_content.trim(),
        text_content: formData.text_content?.trim() || undefined,
        status: formData.status,
        is_default: formData.is_default
      };

      if (template?.id) {
        const response = await apiClient.patch(`/mail-templates/${template.id}`, payload);
        toast.success('Template mis à jour avec succès');
        
        // Mettre à jour le formulaire avec TOUTES les données renvoyées par le serveur
        if (response.data) {
          setFormData({
            id: response.data.id,
            type: response.data.type,
            name: response.data.name,
            description: response.data.description || '',
            subject: response.data.subject,
            html_content: response.data.html_content,
            text_content: response.data.text_content || '',
            status: response.data.status,
            is_default: response.data.is_default,
            version: response.data.version
          });
        }
      } else {
        await apiClient.post('/mail-templates', payload);
        toast.success('Template créé avec succès');
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      if (!template?.id) {
        toast.error('Sauvegardez d\'abord le template pour le prévisualiser');
        return;
      }

      const variables = getPreviewVariables(formData.type);
      const response = await apiClient.post(`/mail-templates/${template.id}/preview`, {
        variables
      });

      // Ouvrir la prévisualisation dans une nouvelle fenêtre
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head>
              <title>Prévisualisation - ${formData.name}</title>
              <style>body { font-family: Arial, sans-serif; margin: 20px; }</style>
            </head>
            <body>
              <h2>Sujet: ${response.data.subject}</h2>
              <hr>
              <div>${response.data.html_content}</div>
            </body>
          </html>
        `);
        previewWindow.document.close();
      }
    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error);
      toast.error('Erreur lors de la prévisualisation');
    }
  };

  const getPreviewVariables = (type: string): Record<string, any> => {
    switch (type) {
      case 'invitation':
        return {
          name: 'Jean Dupont',
          companyName: 'Mon Entreprise',
          role: 'Manager',
          redirectUrl: 'https://example.com/invitation'
        };
      case 'verification':
        return {
          verificationUrl: 'https://example.com/verify'
        };
      case 'password_reset':
        return {
          resetUrl: 'https://example.com/reset'
        };
      default:
        return {
          name: 'Utilisateur',
          companyName: 'Mon Entreprise'
        };
    }
  };

  const getVariablesInfo = (type: string): string[] => {
    switch (type) {
      case 'invitation':
        return ['{{name}}', '{{companyName}}', '{{role}}', '{{redirectUrl}}'];
      case 'verification':
        return ['{{verificationUrl}}'];
      case 'password_reset':
        return ['{{resetUrl}}'];
      case 'welcome':
        return ['{{name}}', '{{companyName}}'];
      default:
        return ['{{name}}', '{{companyName}}'];
    }
  };

  const getTypesByContext = (context: 'system' | 'automation') => {
    if (context === 'system') {
      return templateTypes.filter(type => 
        ['invitation', 'verification', 'password_reset', 'welcome'].includes(type.type)
      );
    } else {
      return templateTypes.filter(type => 
        ['notification', 'custom'].includes(type.type)
      );
    }
  };

  const handleContextChange = (context: 'system' | 'automation') => {
    setSelectedContext(context);
    
    // Réinitialiser le type si le type actuel n'est pas compatible avec le nouveau contexte
    const availableTypes = getTypesByContext(context);
    if (availableTypes.length > 0 && !availableTypes.find(t => t.type === formData.type)) {
      handleInputChange('type', availableTypes[0].type);
    }
  };

  const isEditing = !!template?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h3 className="text-lg font-medium">
              {isEditing ? 'Modifier le template' : 'Nouveau template'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isEditing ? `Modification de "${template?.name}"` : 'Créez un nouveau template d\'email'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Prévisualiser
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-admin-light to-admin-dark">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Général
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Contenu HTML
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Version Texte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations générales</CardTitle>
                <CardDescription>
                  Configuration de base du template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du template *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nom du template"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="context">Contexte *</Label>
                      <Select
                        value={selectedContext}
                        onValueChange={handleContextChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un contexte" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">
                            <div className="flex flex-col">
                              <span className="font-medium">Système</span>
                              <span className="text-xs text-muted-foreground">Invitation, vérification, mot de passe</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="automation">
                            <div className="flex flex-col">
                              <span className="font-medium">Automation</span>
                              <span className="text-xs text-muted-foreground">Notifications, templates personnalisés</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => handleInputChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {getTypesByContext(selectedContext).map((type) => (
                            <SelectItem key={type.type} value={type.type}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Explication du contexte */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>
                      {selectedContext === 'system' ? 'Templates Système' : 'Templates Automation'}:
                    </strong>{' '}
                    {selectedContext === 'system' 
                      ? 'Ces templates sont utilisés par le système pour des fonctions essentielles (invitation d\'utilisateurs, vérification d\'email, etc.). Ils ne sont pas visibles par les Admin/RH dans l\'interface normale.'
                      : 'Ces templates sont utilisés pour les automatisations de mail créées par les Admin/RH. Ils sont visibles et modifiables dans l\'interface standard.'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Description du template (optionnel)"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet de l'email *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Sujet de l'email"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Statut</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value as 'active' | 'draft' | 'archived')}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Choisir statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => handleInputChange('is_default', checked)}
                    />
                    <Label htmlFor="is_default">Template par défaut</Label>
                  </div>
                </div>

                {/* Variables disponibles */}
                <div className="space-y-2">
                  <Label>Variables disponibles</Label>
                  <div className="flex flex-wrap gap-2">
                    {getVariablesInfo(formData.type).map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Utilisez ces variables dans le sujet et le contenu de votre template.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contenu HTML</CardTitle>
                <CardDescription>
                  Le contenu principal de votre email en HTML
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="html_content">Code HTML *</Label>
                  <Textarea
                    id="html_content"
                    value={formData.html_content}
                    onChange={(e) => handleInputChange('html_content', e.target.value)}
                    placeholder="<div>Contenu HTML de votre email...</div>"
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Utilisez du HTML valide. Les variables seront remplacées automatiquement.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="text" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Version texte (optionnel)</CardTitle>
                <CardDescription>
                  Version texte brut pour les clients email qui ne supportent pas le HTML
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="text_content">Contenu texte</Label>
                  <Textarea
                    id="text_content"
                    value={formData.text_content || ''}
                    onChange={(e) => handleInputChange('text_content', e.target.value)}
                    placeholder="Version texte de votre email..."
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Si non renseigné, le HTML sera automatiquement converti en texte.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}