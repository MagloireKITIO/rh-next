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
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [selectedConfig, setSelectedConfig] = useState<MailConfiguration | null>(null);
  
  const queryClient = useQueryClient();

  // Récupérer toutes les configurations
  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['admin', 'mail-configs'],
    queryFn: () => adminApi.getAllMailConfigurations(),
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

  if (currentView === 'form') {
    return (
      <MailConfigForm
        config={selectedConfig}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
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
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="configurations" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Serveurs SMTP
        </TabsTrigger>
        <TabsTrigger value="templates" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Templates
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
    </Tabs>
  );
}