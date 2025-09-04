"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Plus, Settings, Trash2, ToggleLeft, ToggleRight, Edit, Eye, BarChart3 } from "lucide-react";
import { mailAutomationsApi } from "@/lib/api-client";
import { toast } from "sonner";

interface MailAutomation {
  id: string;
  title: string;
  description?: string;
  trigger: 'on_create' | 'on_update' | 'on_delete';
  entity_type: 'candidate' | 'project' | 'user' | 'analysis';
  status: 'active' | 'inactive' | 'draft';
  recipients: string[];
  sent_count: number;
  success_count: number;
  failed_count: number;
  last_triggered_at?: string;
  mail_template: {
    id: string;
    name: string;
    subject: string;
  };
  conditions?: Array<{
    field_path: string;
    operator: string;
    value: any;
    logic?: string;
  }>;
}

interface AutomationTemplate {
  key: string;
  title: string;
  description: string;
  entity_type: string;
  trigger: string;
}

const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    key: 'CANDIDATE_CONFIRMATION',
    title: 'Confirmation - Candidature reçue',
    description: 'Envoyer une confirmation automatique au candidat',
    entity_type: 'candidate',
    trigger: 'on_create'
  },
  {
    key: 'NEW_CANDIDATE_NOTIFICATION',
    title: 'Notification - Nouveau candidat',
    description: 'Notifier l\'équipe RH quand un nouveau candidat postule',
    entity_type: 'candidate',
    trigger: 'on_create'
  },
  {
    key: 'HIGH_SCORE_CANDIDATE',
    title: 'Alerte - Candidat à fort potentiel',
    description: 'Alerter quand un candidat obtient un score élevé',
    entity_type: 'candidate',
    trigger: 'on_update'
  },
  {
    key: 'CANDIDATE_ANALYZED',
    title: 'Notification - Analyse terminée',
    description: 'Informer quand l\'analyse d\'un candidat est complète',
    entity_type: 'candidate',
    trigger: 'on_update'
  },
  {
    key: 'NEW_PROJECT_CREATED',
    title: 'Notification - Nouveau projet',
    description: 'Notifier l\'équipe RH lors de la création d\'un projet',
    entity_type: 'project',
    trigger: 'on_create'
  }
];

interface MailAutomationsSectionProps {
  currentUser: any;
  isUserAdmin: boolean;
}

export function MailAutomationsSection({ currentUser, isUserAdmin }: MailAutomationsSectionProps) {
  const [automations, setAutomations] = useState<MailAutomation[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_automations: 0,
    active_automations: 0,
    total_sent: 0,
    success_rate: 0
  });

  // Dialogs states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<MailAutomation | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    template_id: '',
    recipients: [] as string[],
    conditions: [] as any[]
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    mail_template_id: '',
    recipients: [] as string[],
    conditions: [] as any[]
  });

  useEffect(() => {
    loadAutomations();
    loadStats();
    loadMailTemplates();
  }, []);

  const loadMailTemplates = async () => {
    try {
      const response = await mailAutomationsApi.getMailTemplates();
      setAvailableTemplates(response.data);
    } catch (error) {
      console.error("Error loading mail templates:", error);
    }
  };

  const loadAutomations = async () => {
    setLoading(true);
    try {
      const response = await mailAutomationsApi.getAll();
      setAutomations(response.data);
    } catch (error) {
      console.error("Error loading automations:", error);
      toast.error("Erreur lors du chargement des automatisations");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await mailAutomationsApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await mailAutomationsApi.toggleStatus(id);
      toast.success("Statut mis à jour avec succès");
      await loadAutomations();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'automatisation "${title}" ?`)) {
      return;
    }

    try {
      await mailAutomationsApi.delete(id);
      toast.success("Automatisation supprimée avec succès");
      await loadAutomations();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEditAutomation = async (automation: MailAutomation) => {
    setSelectedAutomation(automation);
    setEditForm({
      title: automation.title,
      description: automation.description || '',
      mail_template_id: automation.mail_template.id,
      recipients: automation.recipients,
      conditions: automation.conditions || []
    });
    setEditDialogOpen(true);
  };

  const handleUpdateAutomation = async () => {
    if (!selectedAutomation) return;

    try {
      await mailAutomationsApi.update(selectedAutomation.id, editForm);
      toast.success("Automatisation mise à jour avec succès");
      setEditDialogOpen(false);
      setSelectedAutomation(null);
      await loadAutomations();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleCreateFromTemplate = async (template: AutomationTemplate) => {
    try {
      // Vérifier que l'utilisateur a une entreprise
      if (!currentUser.company?.id) {
        toast.error("Aucune entreprise associée à ce compte");
        return;
      }

      // Trouver le template de mail RH correspondant
      const mailTemplatesResponse = await mailAutomationsApi.getMailTemplates();
      const mailTemplates = mailTemplatesResponse.data;
      const hrTemplate = mailTemplates.find((t: any) => 
        t.name.includes(template.title.split(' - ')[1]) || 
        t.name.includes('RH')
      );

      if (!hrTemplate) {
        toast.error("Template de mail non trouvé");
        return;
      }

      // Définir les destinataires selon le type d'automatisation
      let recipients: string[] = ['company_hr']; // Par défaut
      if (template.key === 'CANDIDATE_CONFIRMATION') {
        recipients = ['candidate_email']; // Envoyer au candidat
      }

      const automationData = {
        title: template.title,
        description: template.description,
        trigger: template.trigger,
        entity_type: template.entity_type,
        company_id: currentUser.company.id,
        mail_template_id: hrTemplate.id,
        recipients: recipients,
        conditions: template.key === 'HIGH_SCORE_CANDIDATE' ? [
          {
            field_path: 'score',
            operator: 'greater_than',
            value: 80
          }
        ] : []
      };

      await mailAutomationsApi.create(automationData);
      toast.success("Automatisation créée avec succès");
      setCreateDialogOpen(false);
      await loadAutomations();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Actif</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactif</Badge>;
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'on_create': return 'À la création';
      case 'on_update': return 'À la mise à jour';
      case 'on_delete': return 'À la suppression';
      default: return trigger;
    }
  };

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case 'candidate': return 'Candidat';
      case 'project': return 'Projet';
      case 'user': return 'Utilisateur';
      case 'analysis': return 'Analyse';
      default: return entity;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Chargement des automatisations..." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Automatisations Mail
          </CardTitle>
          <CardDescription>
            Configurez des automatisations pour envoyer des emails lors d'événements RH
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-sm font-medium">Total</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{stats.total_automations}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Actives</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-green-600">{stats.active_automations}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Emails envoyés</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{stats.total_sent}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Taux de succès</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-blue-600">{stats.success_rate}%</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Automatisations configurées ({automations.length})</h3>
              <p className="text-sm text-muted-foreground">
                Gérez vos automatisations d'emails
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStatsDialogOpen(true)} className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Statistiques
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer une automatisation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Créer une automatisation</DialogTitle>
                    <DialogDescription>
                      Choisissez un modèle prédéfini pour commencer rapidement
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    {AUTOMATION_TEMPLATES.map((template) => (
                      <div
                        key={template.key}
                        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted"
                        onClick={() => handleCreateFromTemplate(template)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{template.title}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {getEntityLabel(template.entity_type)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getTriggerLabel(template.trigger)}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Utiliser ce modèle
                        </Button>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Automations List */}
          <div className="space-y-3">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{automation.title}</span>
                        {getStatusBadge(automation.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{automation.description}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getEntityLabel(automation.entity_type)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getTriggerLabel(automation.trigger)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {automation.sent_count} envoyés
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Template utilisé */}
                  <div className="text-sm text-muted-foreground text-right">
                    <div className="font-medium">{automation.mail_template.name}</div>
                    <div className="text-xs">{automation.mail_template.subject}</div>
                  </div>

                  {/* Edit */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditAutomation(automation)}
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="Modifier l'automatisation"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* Toggle Status */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(automation.id)}
                    className="h-8 w-8 p-0"
                  >
                    {automation.status === 'active' ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(automation.id, automation.title)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {automations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune automatisation configurée</p>
                <p className="text-sm">Créez votre première automatisation pour commencer</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Automation Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'automatisation</DialogTitle>
            <DialogDescription>
              Personnalisez les paramètres de votre automatisation mail
            </DialogDescription>
          </DialogHeader>
          
          {selectedAutomation && (
            <div className="space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informations générales</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="edit-title">Titre de l'automatisation</Label>
                    <Input
                      id="edit-title"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Nom de l'automatisation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description détaillée (optionnel)"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Template de mail */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Template de mail</h3>
                <div>
                  <Label htmlFor="edit-template">Choisir un template</Label>
                  <Select 
                    value={editForm.mail_template_id}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, mail_template_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un template" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground">{template.subject}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Destinataires */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Destinataires</h3>
                <div className="space-y-2">
                  <Label>Qui doit recevoir cet email ?</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="recipient-hr"
                        checked={editForm.recipients.includes('company_hr')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditForm(prev => ({ 
                              ...prev, 
                              recipients: [...prev.recipients.filter(r => r !== 'company_hr'), 'company_hr']
                            }));
                          } else {
                            setEditForm(prev => ({ 
                              ...prev, 
                              recipients: prev.recipients.filter(r => r !== 'company_hr')
                            }));
                          }
                        }}
                      />
                      <Label htmlFor="recipient-hr">Équipe RH de l'entreprise</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="recipient-candidate"
                        checked={editForm.recipients.includes('candidate_email')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditForm(prev => ({ 
                              ...prev, 
                              recipients: [...prev.recipients.filter(r => r !== 'candidate_email'), 'candidate_email']
                            }));
                          } else {
                            setEditForm(prev => ({ 
                              ...prev, 
                              recipients: prev.recipients.filter(r => r !== 'candidate_email')
                            }));
                          }
                        }}
                      />
                      <Label htmlFor="recipient-candidate">Candidat concerné</Label>
                    </div>
                  </div>
                  
                  {/* Emails personnalisés */}
                  <div className="mt-4">
                    <Label htmlFor="custom-recipients">Emails personnalisés (optionnel)</Label>
                    <Input
                      id="custom-recipients"
                      placeholder="email1@exemple.com, email2@exemple.com"
                      value={editForm.recipients.filter(r => !['company_hr', 'candidate_email'].includes(r)).join(', ')}
                      onChange={(e) => {
                        const customEmails = e.target.value ? e.target.value.split(',').map(email => email.trim()) : [];
                        const systemRecipients = editForm.recipients.filter(r => ['company_hr', 'candidate_email'].includes(r));
                        setEditForm(prev => ({ 
                          ...prev, 
                          recipients: [...systemRecipients, ...customEmails]
                        }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Séparez plusieurs emails par des virgules
                    </p>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              {selectedAutomation.entity_type === 'candidate' && selectedAutomation.trigger === 'on_update' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Conditions de déclenchement</h3>
                  <div className="space-y-2">
                    <Label>Cette automatisation se déclenche quand :</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="condition-score"
                        checked={editForm.conditions.some(c => c.field_path === 'score')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditForm(prev => ({ 
                              ...prev, 
                              conditions: [...prev.conditions.filter(c => c.field_path !== 'score'), {
                                field_path: 'score',
                                operator: 'greater_than',
                                value: 80
                              }]
                            }));
                          } else {
                            setEditForm(prev => ({ 
                              ...prev, 
                              conditions: prev.conditions.filter(c => c.field_path !== 'score')
                            }));
                          }
                        }}
                      />
                      <Label htmlFor="condition-score">Le score du candidat est supérieur à</Label>
                      {editForm.conditions.some(c => c.field_path === 'score') && (
                        <Input
                          type="number"
                          className="w-20"
                          value={editForm.conditions.find(c => c.field_path === 'score')?.value || 80}
                          onChange={(e) => {
                            setEditForm(prev => ({
                              ...prev,
                              conditions: prev.conditions.map(c => 
                                c.field_path === 'score' 
                                  ? { ...c, value: parseInt(e.target.value) }
                                  : c
                              )
                            }));
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleUpdateAutomation}>
                  Enregistrer les modifications
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Statistiques détaillées</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.total_automations}</div>
                <div className="text-sm text-muted-foreground">Automatisations totales</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.active_automations}</div>
                <div className="text-sm text-muted-foreground">Automatisations actives</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total_sent}</div>
                <div className="text-sm text-muted-foreground">Emails envoyés</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.success_rate}%</div>
                <div className="text-sm text-muted-foreground">Taux de succès</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Détail par automatisation</h4>
              {automations.map((auto) => (
                <div key={auto.id} className="flex justify-between text-sm">
                  <span>{auto.title}</span>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground">
                      {auto.sent_count} envoyés
                    </span>
                    <span className="text-green-600">
                      {auto.success_count} réussis
                    </span>
                    <span className="text-red-600">
                      {auto.failed_count} échoués
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}