'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, MailTemplate, TemplateType, TemplateVariable } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Editor from '@monaco-editor/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  ArrowLeft,
  Code,
  FileText,
  Send,
  AlertCircle,
  CheckCircle,
  Code2
} from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'list' | 'form' | 'preview';

export default function MailTemplates() {
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<MailTemplate | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const editorRef = useRef<any>(null);
  
  const [formData, setFormData] = useState({
    template_type: '',
    subject: '',
    html_body: '',
    text_body: '',
    description: '',
    is_active: true,
    is_default: false
  });

  const queryClient = useQueryClient();

  // Récupérer tous les templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['admin', 'mail-templates'],
    queryFn: () => adminApi.getAllMailTemplates(),
  });

  // Récupérer les types de templates
  const { data: templateTypes } = useQuery({
    queryKey: ['admin', 'template-types'],
    queryFn: () => adminApi.getTemplateTypes(),
  });

  // ✅ SUPPRIMÉ - Plus de variables statiques
  // Toutes les variables sont maintenant gérées dynamiquement

  // ✅ Debug logs supprimés - Plus de variables statiques

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => adminApi.createMailTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-templates'] });
      toast.success('Template créé avec succès');
      setCurrentView('list');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<typeof formData>) => 
      adminApi.updateMailTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-templates'] });
      toast.success('Template mis à jour avec succès');
      setCurrentView('list');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMailTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-templates'] });
      toast.success('Template supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, subject }: { id: string; subject?: string }) => 
      adminApi.duplicateMailTemplate(id, subject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-templates'] });
      toast.success('Template dupliqué avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la duplication');
    }
  });

  // Mutation pour créer les templates par défaut
  const createDefaultsMutation = useMutation({
    mutationFn: () => adminApi.createDefaultTemplates(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-templates'] });
      toast.success('Templates par défaut créés avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création des templates par défaut');
    }
  });

  const resetForm = () => {
    setFormData({
      template_type: '',
      subject: '',
      html_body: '',
      text_body: '',
      description: '',
      is_active: true,
      is_default: false
    });
    setSelectedTemplate(null);
    setSelectedType('');
  };

  const handleEdit = (template: MailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      template_type: template.template_type,
      subject: template.subject,
      html_body: template.html_body,
      text_body: template.text_body || '',
      description: template.description || '',
      is_active: template.is_active,
      is_default: template.is_default
    });
    setSelectedType(template.template_type);
    setCurrentView('form');
  };

  const handleDelete = (id: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error('Impossible de supprimer un template par défaut');
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.template_type || !formData.subject || !formData.html_body) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePreview = (template: MailTemplate) => {
    setSelectedTemplate(template);
    setSelectedType(template.template_type);
    
    // Initialiser les variables avec des exemples
    const variables = templateVariables?.data?.data || [];
    const exampleVars: Record<string, string> = {};
    variables.forEach(variable => {
      const varName = variable.name.replace(/[{}]/g, '');
      exampleVars[varName] = variable.example;
    });
    setPreviewVariables(exampleVars);
    setCurrentView('preview');
  };

  if (currentView === 'form') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setCurrentView('list')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h3 className="text-lg font-semibold">
              {selectedTemplate ? 'Modifier le template' : 'Nouveau template'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedTemplate ? 'Modifiez ce template d\'email' : 'Créez un nouveau template d\'email'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedTemplate && (
                <div>
                  <Label htmlFor="template_type">Type de template *</Label>
                  <Select
                    value={formData.template_type}
                    onValueChange={(value) => {
                      setFormData({...formData, template_type: value});
                      setSelectedType(value);
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(templateTypes?.data?.data) && templateTypes.data.data.map((type: any) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="subject">Sujet *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Sujet de l'email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Description du template (optionnel)"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="is_active">Template actif</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
                  />
                  <Label htmlFor="is_default">Template par défaut</Label>
                </div>
              </div>
            </CardContent>
          </Card>


          <Tabs defaultValue="html" className="w-full">
            <TabsList>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="text">Texte brut</TabsTrigger>
            </TabsList>
            
            <TabsContent value="html" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contenu HTML *</CardTitle>
                  <CardDescription>
                    Corps de l'email en HTML (supporté par la plupart des clients email)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden">
                    <Editor
                      height="400px"
                      defaultLanguage="html"
                      value={formData.html_body}
                      onChange={(value) => setFormData({...formData, html_body: value || ''})}
                      onMount={(editor) => { editorRef.current = editor; }}
                      theme="vs"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        tabSize: 2,
                        insertSpaces: true,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: 'on',
                        bracketPairColorization: { enabled: true },
                        folding: true,
                        showFoldingControls: 'always',
                        formatOnPaste: true,
                        formatOnType: true
                      }}
                    />
                  </div>
                  {/* Variables disponibles - Mode dynamique */}
                  {(() => {
                    console.log('🔍 [TEMPLATE FORM] selectedType before rendering DynamicVariablesHelper:', selectedType);
                    console.log('🔍 [TEMPLATE FORM] formData.template_type:', formData.template_type);
                    return selectedType;
                  })() && (
                    <DynamicVariablesHelper
                      templateType={selectedType}
                      onVariableClick={(variable) => {
                        if (editorRef.current) {
                          const editor = editorRef.current;
                          const selection = editor.getSelection();
                          const range = {
                            startLineNumber: selection.startLineNumber,
                            startColumn: selection.startColumn,
                            endLineNumber: selection.endLineNumber,
                            endColumn: selection.endColumn
                          };
                          editor.executeEdits('insert-variable', [
                            { range, text: variable.name, forceMoveMarkers: true }
                          ]);
                          editor.focus();
                        }
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Version texte brut</CardTitle>
                  <CardDescription>
                    Version alternative en texte brut (recommandée pour la compatibilité)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.text_body}
                    onChange={(e) => setFormData({...formData, text_body: e.target.value})}
                    placeholder="Version texte brut de votre email..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCurrentView('list')}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-gradient-to-r from-admin-light to-admin-dark"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <LoadingSpinner className="w-4 h-4 mr-2" />
              ) : selectedTemplate ? (
                'Mettre à jour'
              ) : (
                'Créer le template'
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (currentView === 'preview') {
    // TODO: Implémenter la preview avec rendu des variables
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setCurrentView('list')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h3 className="text-lg font-semibold">Aperçu du template</h3>
            <p className="text-sm text-muted-foreground">
              Prévisualisation avec des données d'exemple
            </p>
          </div>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            La fonctionnalité de prévisualisation sera implémentée dans une prochaine version.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <strong>Sujet:</strong> {selectedTemplate?.subject}
              </div>
              <div>
                <strong>Contenu HTML:</strong>
                <div className="mt-2 border rounded-lg max-h-96 overflow-auto">
                  <div 
                    className="p-4 bg-white text-gray-900 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate?.html_body || '' }}
                    style={{
                      color: '#1f2937',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vue liste
  console.log('🔍 [DEBUG] templates from API:', templates);
  console.log('🔍 [DEBUG] templates.data:', templates?.data);
  
  const templatesList = Array.isArray(templates?.data?.data) ? templates.data.data : [];
  const activeTemplates = templatesList.filter(t => t.is_active);
  const defaultTemplates = templatesList.filter(t => t.is_default);
  
  console.log('🔍 [DEBUG] templatesList after processing:', templatesList);

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{templatesList.length}</p>
              </div>
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{activeTemplates.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Par défaut</p>
                <p className="text-2xl font-bold text-blue-600">{defaultTemplates.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates d'emails</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les templates pour tous types d'emails automatiques
          </p>
        </div>
        <div className="flex gap-2">
          {templatesList.length === 0 && (
            <Button 
              onClick={() => createDefaultsMutation.mutate()}
              variant="outline"
              disabled={createDefaultsMutation.isPending}
            >
              {createDefaultsMutation.isPending ? (
                <LoadingSpinner className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Créer templates par défaut
            </Button>
          )}
          <Button 
            onClick={() => setCurrentView('form')}
            className="bg-gradient-to-r from-admin-light to-admin-dark"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau template
          </Button>
        </div>
      </div>

      {/* Liste des templates */}
      {templatesLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner className="w-6 h-6 mr-2" />
          Chargement des templates...
        </div>
      ) : templatesList.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun template d'email</h3>
            <p className="text-muted-foreground mb-4">
              Créez vos premiers templates pour personnaliser les emails automatiques.
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => createDefaultsMutation.mutate()}
                variant="outline"
                disabled={createDefaultsMutation.isPending}
              >
                {createDefaultsMutation.isPending ? (
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Templates par défaut
              </Button>
              <Button 
                onClick={() => setCurrentView('form')}
                className="bg-gradient-to-r from-admin-light to-admin-dark"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templatesList.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.subject}</CardTitle>
                      <CardDescription>
                        {templateTypes?.data?.data?.find(t => t.value === template.template_type)?.label || template.template_type}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.is_default && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Par défaut
                      </Badge>
                    )}
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                )}
                
                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Aperçu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateMutation.mutate({ id: template.id })}
                    disabled={duplicateMutation.isPending}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Dupliquer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  {!template.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id, template.is_default)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant pour afficher les variables dynamiquement selon le type de template
function DynamicVariablesHelper({
  templateType,
  onVariableClick
}: {
  templateType: string;
  onVariableClick: (variable: any) => void;
}) {
  console.log('🔍 [DYNAMIC VARIABLES] Component rendered with templateType:', templateType);

  // Mapper le type de template vers le type d'entité pour les automations
  const getEntityTypeFromTemplate = (templateType: string): string | null => {
    console.log('🔍 [DYNAMIC VARIABLES] Mapping templateType:', templateType);

    const mapping: Record<string, string> = {
      // Templates candidats
      'candidate_application': 'candidates',
      'candidate_analysis_complete': 'candidates',
      'CANDIDATE_APPLICATION': 'candidates',

      // Templates projets
      'project_created': 'projects',
      'team_request_notification': 'projects',
      'TEAM_REQUEST_NOTIFICATION': 'projects',

      // Templates entreprises
      'company_created': 'companies',

      // Templates utilisateurs
      'user_invitation': 'users',
      'invite_user': 'users',
      'INVITE_USER': 'users',
      'confirm_signup': 'users',
      'CONFIRM_SIGNUP': 'users',
      'magic_link': 'users',
      'MAGIC_LINK': 'users',
      'change_email': 'users',
      'CHANGE_EMAIL': 'users',
      'reset_password': 'users',
      'RESET_PASSWORD': 'users',
      'reauthentication': 'users',
      'REAUTHENTICATION': 'users',
    };

    const entityType = mapping[templateType] || null;
    console.log('🔍 [DYNAMIC VARIABLES] Mapped to entityType:', entityType);

    return entityType;
  };

  const entityType = getEntityTypeFromTemplate(templateType);

  // ✅ SEULEMENT LES VARIABLES DYNAMIQUES - Plus de variables statiques !
  const { data: dynamicVariables, isLoading, error } = useQuery({
    queryKey: ['admin', 'available-variables', entityType],
    queryFn: () => {
      console.log('🔍 [DYNAMIC VARIABLES] Making API call for entityType:', entityType);
      return adminApi.getAvailableVariables(entityType!);
    },
    enabled: !!entityType
  });

  console.log('🔍 [DYNAMIC VARIABLES] Query result:', {
    isLoading,
    error,
    dynamicVariables,
    dataStructure: dynamicVariables?.data,
    fullResponse: JSON.stringify(dynamicVariables, null, 2)
  });

  // ✅ DEBUG - Vérifions toutes les possibilités de structure
  console.log('🔍 [DYNAMIC VARIABLES] Data structure analysis:');
  console.log('  - dynamicVariables?.data:', dynamicVariables?.data);
  console.log('  - dynamicVariables?.data?.data:', dynamicVariables?.data?.data);
  console.log('  - Array.isArray(dynamicVariables?.data):', Array.isArray(dynamicVariables?.data));
  console.log('  - Array.isArray(dynamicVariables?.data?.data):', Array.isArray(dynamicVariables?.data?.data));

  // Essayons différentes structures possibles
  let dynamicVars: any[] = [];

  if (Array.isArray(dynamicVariables?.data?.data)) {
    dynamicVars = dynamicVariables.data.data;
    console.log('🔍 [DYNAMIC VARIABLES] Using structure: dynamicVariables.data.data');
  } else if (Array.isArray(dynamicVariables?.data)) {
    dynamicVars = dynamicVariables.data;
    console.log('🔍 [DYNAMIC VARIABLES] Using structure: dynamicVariables.data');
  } else if (Array.isArray(dynamicVariables)) {
    dynamicVars = dynamicVariables;
    console.log('🔍 [DYNAMIC VARIABLES] Using structure: dynamicVariables');
  } else {
    console.log('🔍 [DYNAMIC VARIABLES] No array structure found in response');
  }

  console.log('🔍 [DYNAMIC VARIABLES] Final dynamicVars:', dynamicVars.length, dynamicVars);

  // ✅ TOUTES les variables sont maintenant dynamiques !
  const allVariables = dynamicVars;
  console.log('🔍 [DYNAMIC VARIABLES] Final allVariables:', allVariables.length, allVariables);

  if (isLoading) {
    console.log('🔍 [DYNAMIC VARIABLES] Showing loading state');
    return (
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4" />
          <span className="text-sm">Chargement des variables...</span>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('🔍 [DYNAMIC VARIABLES] Showing error state:', error);
    return (
      <div className="mt-3 pt-3 border-t">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>❌ Erreur :</strong> Impossible de charger les variables dynamiques.
            <br />Détails : {error.message || 'Erreur inconnue'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (allVariables.length === 0) {
    console.log('🔍 [DYNAMIC VARIABLES] No variables found, showing appropriate message');
    if (!entityType) {
      return (
        <div className="mt-3 pt-3 border-t">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>💡 Astuce :</strong> Ce type de template n'est pas encore mappé pour les variables dynamiques.
              Les variables seront disponibles une fois le mapping ajouté dans le code.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t">
      <div className="flex items-center gap-2 mb-3">
        <Code2 className="w-4 h-4" />
        <span className="text-sm font-medium">Variables dynamiques disponibles</span>
        <span className="text-xs text-muted-foreground">
          ({allVariables.length} variables auto-générées)
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
        {allVariables.map((variable, index) => (
          <div key={index} className="group">
            <code
              className="text-xs font-mono bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80 transition-colors block"
              onClick={() => onVariableClick(variable)}
              title={variable.description}
            >
              {variable.name}
            </code>
          </div>
        ))}
      </div>

      {entityType && allVariables.length > 0 && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>🎉 Système 100% dynamique !</strong>
            Ces {allVariables.length} variables sont automatiquement générées pour l'entité "{entityType}".
            Ajoutez de nouveaux champs à votre entité → les variables apparaissent automatiquement !
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}