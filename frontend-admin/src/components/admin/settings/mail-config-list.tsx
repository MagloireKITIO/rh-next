'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Mail, 
  Server, 
  Globe, 
  Building2,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface MailConfig {
  id: string;
  provider_type: 'smtp' | 'sendgrid' | 'mailgun' | 'aws_ses' | 'supabase';
  company_id?: string;
  company?: { name: string };
  from_email: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface MailConfigListProps {
  onEdit: (config: MailConfig) => void;
  onAdd: () => void;
}

export default function MailConfigList({ onEdit, onAdd }: MailConfigListProps) {
  const queryClient = useQueryClient();

  // Récupérer toutes les configurations
  const { data: configs, isLoading } = useQuery({
    queryKey: ['admin', 'mail-configs'],
    queryFn: () => adminApi.getAllMailConfigurations(),
    onSuccess: (data) => {
      console.log('📥 [FRONTEND] Configurations reçues:', data);
      console.log('📥 [FRONTEND] Type de data:', typeof data);
      console.log('📥 [FRONTEND] Structure data:', Object.keys(data || {}));
    },
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
    },
  });

  // Activer/Désactiver une configuration
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      adminApi.toggleMailConfiguration(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-configs'] });
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'smtp': return Server;
      case 'supabase': return Globe;
      case 'sendgrid':
      case 'mailgun':
      case 'aws_ses':
      default: return Mail;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'smtp': return 'Serveur SMTP';
      case 'supabase': return 'Supabase';
      case 'sendgrid': return 'SendGrid';
      case 'mailgun': return 'Mailgun';
      case 'aws_ses': return 'AWS SES';
      default: return provider;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'ajout */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Configurations Mail</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les serveurs de messagerie pour chaque compagnie
          </p>
        </div>
        <Button onClick={onAdd} className="bg-gradient-to-r from-admin-light to-admin-dark">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une configuration
        </Button>
      </div>

      {/* Liste des configurations */}
      <div className="grid gap-4">
        {(configs?.data?.data || configs?.data || []).map((config: MailConfig) => {
          const Icon = getProviderIcon(config.provider_type);
          
          return (
            <Card key={config.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-admin-light to-admin-dark rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {getProviderName(config.provider_type)}
                      </CardTitle>
                      <CardDescription>
                        {config.company_id ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3 h-3" />
                            {config.company?.name || 'Compagnie spécifique'}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3" />
                            Configuration globale
                          </div>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {config.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Par défaut
                      </Badge>
                    )}
                    <Badge 
                      variant={config.is_active ? "default" : "secondary"}
                      className={config.is_active 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : "bg-gray-100 text-gray-800 border-gray-200"
                      }
                    >
                      {config.is_active ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Actif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactif
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Email expéditeur:</span> {config.from_email}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Nom expéditeur:</span> {config.from_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Créé le {new Date(config.created_at).toLocaleDateString('fr-FR')}
                    {config.updated_at !== config.created_at && (
                      <> • Modifié le {new Date(config.updated_at).toLocaleDateString('fr-FR')}</>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleMutation.mutate({ 
                      id: config.id, 
                      is_active: !config.is_active 
                    })}
                    disabled={toggleMutation.isPending}
                  >
                    {config.is_active ? 'Désactiver' : 'Activer'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(config)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
                        deleteMutation.mutate(config.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(configs?.data?.data || configs?.data || []).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune configuration</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre première configuration mail.
            </p>
            <Button onClick={onAdd} className="bg-gradient-to-r from-admin-light to-admin-dark">
              <Plus className="w-4 h-4 mr-2" />
              Créer une configuration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}