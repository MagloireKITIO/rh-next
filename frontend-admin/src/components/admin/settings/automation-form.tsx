'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, AlertCircle, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

interface AutomationFormProps {
  automation?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

const ENTITY_OPTIONS = [
  { value: 'candidates', label: 'Candidats' },
  { value: 'projects', label: 'Projets' },
  { value: 'companies', label: 'Entreprises' },
  { value: 'users', label: 'Utilisateurs' },
];

const TRIGGER_OPTIONS = [
  { value: 'onCreate', label: 'Création (onCreate)' },
  { value: 'onUpdate', label: 'Modification (onUpdate)' },
  { value: 'onDelete', label: 'Suppression (onDelete)' },
];

const VISIBILITY_OPTIONS = [
  { value: 'company', label: 'Entreprise uniquement' },
  { value: 'system', label: 'Système (toutes les entreprises)' },
];

export default function AutomationForm({ automation, onCancel, onSuccess }: AutomationFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';
  const isEditing = !!automation;

  const [form, setForm] = useState({
    title: automation?.title || '',
    description: automation?.description || '',
    company_id: automation?.company_id === '' ? 'all' : automation?.company_id || 'all',
    target_entity: automation?.target_entity || '',
    trigger_type: automation?.trigger_type || '',
    conditions: automation?.conditions || '',
    mail_template_id: automation?.mail_template_id || '',
    recipient_rules: automation?.recipient_rules || '{"field":"email"}',
    cc_users: automation?.cc_users || [],
    is_active: automation?.is_active !== false,
    visibility: automation?.visibility || 'company',
  });

  // Récupérer les entreprises (pour SuperAdmin)
  const { data: companies } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: () => adminApi.getCompanies(),
    enabled: isSuperAdmin,
  });

  // Récupérer les templates de mail
  const { data: templates, isLoading: templatesLoading, error: templatesError } = useQuery({
    queryKey: ['admin', 'mail-templates'],
    queryFn: () => adminApi.getAllMailTemplates(),
  });

  // Debug logs pour les templates
  console.log('🔍 [AUTOMATION DEBUG] Templates data:', templates);
  console.log('🔍 [AUTOMATION DEBUG] Templates loading:', templatesLoading);
  console.log('🔍 [AUTOMATION DEBUG] Templates error:', templatesError);
  console.log('🔍 [AUTOMATION DEBUG] Templates.data:', templates?.data);
  console.log('🔍 [AUTOMATION DEBUG] Templates.data.data:', templates?.data?.data);
  console.log('🔍 [AUTOMATION DEBUG] Is array:', Array.isArray(templates?.data?.data));
  console.log('🔍 [AUTOMATION DEBUG] Length:', templates?.data?.data?.length);

  // Mutation pour créer/modifier
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing) {
        return adminApi.updateMailAutomation(automation.id, data);
      }
      return adminApi.createMailAutomation(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-automations'] });
      toast.success(`Automatisation ${isEditing ? 'modifiée' : 'créée'} avec succès`);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!form.title || !form.target_entity || !form.trigger_type || !form.mail_template_id) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Préparer les données pour l'API en convertissant "all" en chaîne vide
    const formData = {
      ...form,
      company_id: form.company_id === 'all' ? '' : form.company_id
    };

    saveMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Modifier l\'automatisation' : 'Nouvelle automatisation'}
          </h2>
          <p className="text-muted-foreground">
            Configurez l'envoi automatique d'emails basé sur les actions du système
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Configuration de l'automatisation</CardTitle>
            <CardDescription>
              Définissez les règles et conditions de déclenchement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Bienvenue candidat"
                  required
                />
              </div>

              {/* Sélection entreprise (SuperAdmin uniquement) */}
              {isSuperAdmin && (
                <div>
                  <Label htmlFor="company">Entreprise</Label>
                  <Select
                    value={form.company_id}
                    onValueChange={(value) => handleInputChange('company_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une entreprise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les entreprises</SelectItem>
                      {Array.isArray(companies?.data) && companies.data.map((company: any) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Description de l'automatisation..."
                rows={3}
              />
            </div>

            {/* Configuration du déclencheur */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_entity">Entité cible *</Label>
                <Select
                  value={form.target_entity}
                  onValueChange={(value) => handleInputChange('target_entity', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une entité" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="trigger_type">Déclencheur *</Label>
                <Select
                  value={form.trigger_type}
                  onValueChange={(value) => handleInputChange('trigger_type', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un déclencheur" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Template email */}
            <div>
              <Label htmlFor="mail_template">Template email *</Label>
              <Select
                value={form.mail_template_id}
                onValueChange={(value) => handleInputChange('mail_template_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  {templatesLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">Chargement...</div>
                  ) : templatesError ? (
                    <div className="p-2 text-sm text-red-500">Erreur lors du chargement des templates</div>
                  ) : Array.isArray(templates?.data?.data) && templates.data.data.length > 0 ? (
                    templates.data.data.map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.subject} ({template.template_type})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">Aucun template disponible</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Conditions (simple pour l'instant) */}
            <div>
              <Label htmlFor="conditions">Conditions (optionnel)</Label>
              <Textarea
                id="conditions"
                value={form.conditions}
                onChange={(e) => handleInputChange('conditions', e.target.value)}
                placeholder="Ex: status == 'pending'"
                rows={2}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Laissez vide pour déclencher dans tous les cas
              </p>
            </div>

            {/* Visibilité (SuperAdmin uniquement) */}
            {isSuperAdmin && (
              <div>
                <Label htmlFor="visibility">Visibilité</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(value) => handleInputChange('visibility', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Variables disponibles */}
            {form.target_entity && (
              <VariablesHelper entityType={form.target_entity} />
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_active">Automatisation active</Label>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  className="bg-gradient-to-r from-admin-light to-admin-dark"
                >
                  {saveMutation.isPending && <LoadingSpinner className="w-4 h-4 mr-2" />}
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Info sur les règles de destinataires */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Règles de destinataires :</strong> Pour l'instant, l'email sera envoyé au champ "email" de l'entité concernée. 
          Des règles plus avancées seront disponibles dans une prochaine version.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Composant helper pour afficher les variables disponibles
function VariablesHelper({ entityType }: { entityType: string }) {
  const { data: variables, isLoading } = useQuery({
    queryKey: ['admin', 'available-variables', entityType],
    queryFn: () => adminApi.getAvailableVariables(entityType),
    enabled: !!entityType
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            Variables disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner className="w-4 h-4 mr-2" />
          Chargement des variables...
        </CardContent>
      </Card>
    );
  }

  if (!variables?.data || !Array.isArray(variables.data) || variables.data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Code2 className="w-4 h-4" />
          Variables disponibles pour {entityType}
        </CardTitle>
        <CardDescription className="text-xs">
          Cliquez sur une variable pour la copier dans le presse-papiers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {Array.isArray(variables.data) && variables.data.map((variable: any, index: number) => (
            <div
              key={index}
              className="group cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(variable.name);
                toast.success(`Variable ${variable.name} copiée !`);
              }}
            >
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded block hover:bg-muted/80 transition-colors">
                {variable.name}
              </code>
              <p className="text-xs text-muted-foreground mt-1 hidden group-hover:block">
                {variable.description}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Astuce :</strong> Toutes ces variables sont automatiquement disponibles dans vos templates d'emails.
            Le système génère dynamiquement {Array.isArray(variables.data) ? variables.data.length : 0} variables basées sur l'entité sélectionnée.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}