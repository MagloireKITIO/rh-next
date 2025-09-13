'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

// Interface pour une automatisation simple (version frontend)
interface MailAutomation {
  id: string;
  title: string;
  description?: string;
  target_entity: string;
  trigger_type: 'onCreate' | 'onUpdate' | 'onDelete';
  is_active: boolean;
  created_at: string;
  mail_template?: {
    subject: string;
    template_type: string;
  };
}

const ENTITY_LABELS = {
  candidates: 'Candidats',
  projects: 'Projets', 
  companies: 'Entreprises',
  users: 'Utilisateurs',
};

const TRIGGER_LABELS = {
  onCreate: 'Création',
  onUpdate: 'Modification',
  onDelete: 'Suppression',
};

export function MailAutomationsSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');

  // Récupérer toutes les automatisations
  const { data: automations, isLoading, error } = useQuery({
    queryKey: ['mail-automations'],
    queryFn: () => apiClient.get('/mail-automations'),
  });

  // Récupérer les stats
  const { data: stats } = useQuery({
    queryKey: ['mail-automation-stats'],
    queryFn: () => apiClient.get('/mail-automations/stats'),
  });

  // Mutation pour basculer le statut
  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/mail-automations/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-automations'] });
      queryClient.invalidateQueries({ queryKey: ['mail-automation-stats'] });
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  });

  // Mutation pour supprimer
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/mail-automations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-automations'] });
      queryClient.invalidateQueries({ queryKey: ['mail-automation-stats'] });
      toast.success('Automatisation supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  });

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette automatisation ?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner className="w-6 h-6 mr-2" />
        Chargement des automatisations...
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des automatisations mail
        </AlertDescription>
      </Alert>
    );
  }

  const automationsList = automations?.data?.data || [];
  const statsData = stats?.data?.data || { total: 0, active: 0, thisWeek: 0, errors: 0 };

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{statsData.total}</p>
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
                <p className="text-2xl font-bold text-green-600">{statsData.active}</p>
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
                <p className="text-2xl font-bold text-blue-600">{statsData.thisWeek}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Erreurs</p>
                <p className="text-2xl font-bold text-red-600">{statsData.errors}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mes Automatisations Email</h3>
          <p className="text-sm text-muted-foreground">
            Configurez l'envoi automatique d'emails pour votre entreprise
          </p>
        </div>
        <Button 
          onClick={() => setCurrentView('form')}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle automatisation
        </Button>
      </div>

      {/* Liste des automatisations */}
      {automationsList.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune automatisation</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première automatisation pour envoyer des emails automatiquement.
            </p>
            <Button 
              onClick={() => setCurrentView('form')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une automatisation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {automationsList.map((automation: MailAutomation) => (
            <Card key={automation.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{automation.title}</CardTitle>
                      <CardDescription>{automation.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={automation.is_active ? "default" : "secondary"}>
                      {automation.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Entité cible
                    </p>
                    <p>{ENTITY_LABELS[automation.target_entity as keyof typeof ENTITY_LABELS] || automation.target_entity}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Déclencheur</p>
                    <p>{TRIGGER_LABELS[automation.trigger_type] || automation.trigger_type}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Template</p>
                    <p className="truncate">{automation.mail_template?.subject || 'Non défini'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(automation.id)}
                    disabled={toggleMutation.isPending}
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
                    onClick={() => {
                      // TODO: Implémenter l'édition
                      toast.info('Fonctionnalité d\'édition à venir');
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(automation.id)}
                    disabled={deleteMutation.isPending}
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

      {/* Formulaire simple pour plus tard */}
      {currentView === 'form' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Formulaire de création à venir</strong><br />
            Pour l'instant, utilisez l'interface d'administration pour créer des automatisations.
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setCurrentView('list')}
              className="ml-2"
            >
              Retour à la liste
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}