'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  Globe,
  Building2,
  CheckCircle,
  AlertCircle,
  FileText,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import MailConfigForm from './mail-config-form';
import MailTemplates from './mail-templates';
import AutomationForm from './automation-form';

interface MailConfiguration {
  id: string;
  provider_type: 'smtp';
  company_id?: string;
  configurationCompanies?: Array<{
    id: string;
    company_id: string;
    company?: { name: string };
  }>;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  smtp_secure?: boolean;
  smtp_require_tls?: boolean;
  from_email: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function MailSettings() {
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'automation-form'>('list');
  const [selectedConfig, setSelectedConfig] = useState<MailConfiguration | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<any>(null);
  
  const queryClient = useQueryClient();

  // Récupérer toutes les configurations
  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['admin', 'mail-configs'],
    queryFn: () => adminApi.getAllMailConfigurations(),
  });

  // Récupérer les stats des automatisations
  const { data: automationStats } = useQuery({
    queryKey: ['admin', 'mail-automation-stats'],
    queryFn: () => adminApi.getMailAutomationStats(),
  });

  // Récupérer toutes les automatisations
  const { data: automations, isLoading: automationsLoading, error: automationsError } = useQuery({
    queryKey: ['admin', 'mail-automations'],
    queryFn: () => adminApi.getAllMailAutomations(),
  });

  // Supprimer une configuration
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMailConfiguration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-configs'] });
      toast.success('Configuration supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  });

  // Basculer le statut d'une configuration
  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleMailConfiguration(id, !configs?.data?.data?.find(c => c.id === id)?.is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-configs'] });
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  });

  // Supprimer une automatisation
  const deleteAutomationMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMailAutomation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-automations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-automation-stats'] });
      toast.success('Automatisation supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  });

  // Basculer le statut d'une automatisation
  const toggleAutomationMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleMailAutomation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-automations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-automation-stats'] });
      toast.success('Statut de l\'automatisation mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  });

  const handleEdit = (config: MailConfiguration) => {
    setSelectedConfig(config);
    setCurrentView('form');
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleFormSuccess = () => {
    setCurrentView('list');
    setSelectedConfig(null);
    queryClient.invalidateQueries({ queryKey: ['admin', 'mail-configs'] });
  };

  const handleFormCancel = () => {
    setCurrentView('list');
    setSelectedConfig(null);
  };

  const handleAutomationFormSuccess = () => {
    setCurrentView('list');
    setSelectedAutomation(null);
    queryClient.invalidateQueries({ queryKey: ['admin', 'mail-automations'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'mail-automation-stats'] });
  };

  const handleAutomationFormCancel = () => {
    setCurrentView('list');
    setSelectedAutomation(null);
  };

  const handleNewAutomation = () => {
    setSelectedAutomation(null);
    setCurrentView('automation-form');
  };

  const handleEditAutomation = (automation: any) => {
    setSelectedAutomation(automation);
    setCurrentView('automation-form');
  };

  const handleDeleteAutomation = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette automatisation ?')) {
      deleteAutomationMutation.mutate(id);
    }
  };

  const handleToggleAutomation = (id: string) => {
    toggleAutomationMutation.mutate(id);
  };

  if (currentView === 'form') {
    return (
      <MailConfigForm
        config={selectedConfig}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
      />
    );
  }

  if (currentView === 'automation-form') {
    return (
      <AutomationForm
        automation={selectedAutomation}
        onCancel={handleAutomationFormCancel}
        onSuccess={handleAutomationFormSuccess}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner className="w-6 h-6 mr-2" />
        Chargement des configurations...
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des configurations mail
        </AlertDescription>
      </Alert>
    );
  }

  console.log('🔍 [DEBUG] configs from API:', configs);
  console.log('🔍 [DEBUG] configs.data:', configs?.data);
  
  const configurations = Array.isArray(configs?.data?.data) ? configs.data.data : [];
  const defaultConfig = configurations.find(c => c.is_default);
  const activeConfigs = configurations.filter(c => c.is_active);
  
  console.log('🔍 [DEBUG] configurations after processing:', configurations);

  return (
    <Tabs defaultValue="configurations" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="configurations" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Serveurs SMTP
        </TabsTrigger>
        <TabsTrigger value="templates" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Templates
        </TabsTrigger>
        <TabsTrigger value="automations" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Automatisations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="configurations" className="space-y-6">
        {/* Header avec stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{configurations.length}</p>
              </div>
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actives</p>
                <p className="text-2xl font-bold text-green-600">{activeConfigs.length}</p>
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
                <p className="text-2xl font-bold text-blue-600">{defaultConfig ? 'Oui' : 'Non'}</p>
              </div>
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configurations SMTP</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les serveurs de messagerie pour l'envoi d'emails
          </p>
        </div>
        <Button 
          onClick={() => setCurrentView('form')}
          className="bg-gradient-to-r from-admin-light to-admin-dark"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle configuration
        </Button>
      </div>

      {/* Liste des configurations */}
      {configurations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune configuration SMTP</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première configuration pour pouvoir envoyer des emails.
            </p>
            <Button 
              onClick={() => setCurrentView('form')}
              className="bg-gradient-to-r from-admin-light to-admin-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une configuration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configurations.map((config) => (
            <Card key={config.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-admin-light to-admin-dark rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{config.from_name}</CardTitle>
                      <CardDescription>{config.from_email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.is_default && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Par défaut
                      </Badge>
                    )}
                    <Badge variant={config.is_active ? "default" : "secondary"}>
                      {config.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Serveur</p>
                    <p>{config.smtp_host}:{config.smtp_port}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Utilisateur</p>
                    <p className="truncate">{config.smtp_user}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Portée</p>
                    <div className="flex items-center gap-1">
                      {config.configurationCompanies && config.configurationCompanies.length > 0 ? (
                        <>
                          <Building2 className="w-4 h-4" />
                          <span>{config.configurationCompanies.length} entreprise{config.configurationCompanies.length > 1 ? 's' : ''}</span>
                        </>
                      ) : config.company_id ? (
                        <>
                          <Building2 className="w-4 h-4" />
                          <span>Spécifique</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          <span>Globale</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(config.id)}
                    disabled={toggleMutation.isPending}
                  >
                    {config.is_active ? (
                      <PowerOff className="w-4 h-4 mr-1" />
                    ) : (
                      <Power className="w-4 h-4 mr-1" />
                    )}
                    {config.is_active ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(config)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  {!config.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
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
      </TabsContent>

      <TabsContent value="templates">
        <MailTemplates />
      </TabsContent>

      <TabsContent value="automations" className="space-y-6">
        {/* Header avec stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{automationStats?.data?.total || 0}</p>
                </div>
                <Mail className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actives</p>
                  <p className="text-2xl font-bold text-green-600">{automationStats?.data?.active || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cette semaine</p>
                  <p className="text-2xl font-bold text-blue-600">{automationStats?.data?.thisWeek || 0}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Erreurs</p>
                  <p className="text-2xl font-bold text-red-600">{automationStats?.data?.errors || 0}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Automatisations Email</h3>
            <p className="text-sm text-muted-foreground">
              Configurez l'envoi automatique d'emails basé sur les actions du système
            </p>
          </div>
          <Button 
            onClick={handleNewAutomation}
            className="bg-gradient-to-r from-admin-light to-admin-dark"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle automatisation
          </Button>
        </div>

        {/* Liste des automatisations */}
        {automationsLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="w-6 h-6 mr-2" />
            Chargement des automatisations...
          </div>
        ) : automationsError ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement des automatisations mail
            </AlertDescription>
          </Alert>
        ) : !automations?.data?.data || automations.data.data.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune automatisation</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre première automatisation pour envoyer des emails automatiquement.
              </p>
              <Button 
                onClick={handleNewAutomation}
                className="bg-gradient-to-r from-admin-light to-admin-dark"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une automatisation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {automations.data.data.map((automation: any) => (
              <Card key={automation.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-admin-light to-admin-dark rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{automation.title}</CardTitle>
                        <CardDescription>
                          {automation.description || `${automation.target_entity} - ${automation.trigger_type}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={automation.is_active ? "default" : "secondary"}>
                        {automation.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {automation.visibility === 'system' && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          Système
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className="font-medium text-muted-foreground">Entité cible</p>
                      <p className="capitalize">{automation.target_entity}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Déclencheur</p>
                      <p>{automation.trigger_type}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Template</p>
                      <p className="truncate">{automation.mail_template?.subject || 'Non défini'}</p>
                    </div>
                  </div>
                  
                  {automation.conditions && (
                    <div className="text-sm mb-4">
                      <p className="font-medium text-muted-foreground">Conditions</p>
                      <p className="text-xs bg-muted p-2 rounded font-mono">{automation.conditions}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAutomation(automation.id)}
                      disabled={toggleAutomationMutation.isPending}
                    >
                      {automation.is_active ? (
                        <PowerOff className="w-4 h-4 mr-1" />
                      ) : (
                        <Power className="w-4 h-4 mr-1" />
                      )}
                      {automation.is_active ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAutomation(automation)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAutomation(automation.id)}
                      disabled={deleteAutomationMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}