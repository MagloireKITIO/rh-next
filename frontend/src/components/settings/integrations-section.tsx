'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Globe,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCcw,
  Trash2,
  Loader2,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface UserIntegration {
  connected: boolean;
  provider?: string;
  provider_email?: string;
  calendar_id?: string;
  is_active?: boolean;
  last_sync_at?: string;
  sync_errors?: any;
  created_at?: string;
}

export function IntegrationsSection() {
  const [loading, setLoading] = useState(true);
  const [googleCalendar, setGoogleCalendar] = useState<UserIntegration | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchParams = useSearchParams();

  const fetchIntegrations = useCallback(async () => {
    try {
      // Récupérer l'état de Google Calendar
      const response = await apiClient.get('/integrations/google_calendar');
      setGoogleCalendar(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des intégrations:', error);
      setGoogleCalendar({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Gérer les retours de l'OAuth (success/error)
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'google_calendar_connected') {
      toast.success('Google Calendar connecté avec succès !');
      fetchIntegrations();
    } else if (error) {
      let errorMessage = 'Erreur lors de la connexion';
      switch (error) {
        case 'access_denied':
          errorMessage = 'Autorisation refusée par l\'utilisateur';
          break;
        case 'invalid_request':
          errorMessage = 'Requête invalide';
          break;
        case 'connection_failed':
          errorMessage = 'Échec de la connexion à Google Calendar';
          break;
      }
      toast.error(errorMessage);
    }
  }, [searchParams, fetchIntegrations]);

  const handleConnectGoogleCalendar = async () => {
    setConnecting(true);
    try {
      const response = await apiClient.post('/integrations/google-calendar/connect');
      // Ouvrir l'URL d'authentification dans un nouvel onglet
      window.open(response.data.authUrl, '_blank');
      toast.info('Complétez l\'autorisation dans le nouvel onglet');
    } catch (error) {
      console.error('Erreur lors de la connexion Google Calendar:', error);
      toast.error('Erreur lors de l\'initiation de la connexion');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      await apiClient.delete('/integrations/google_calendar');
      setGoogleCalendar({ connected: false });
      toast.success('Google Calendar déconnecté');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await apiClient.post('/integrations/google_calendar/test');
      if (response.data.success) {
        toast.success('Connexion Google Calendar testée avec succès');
      } else {
        toast.error('Test de connexion échoué');
      }
      fetchIntegrations(); // Rafraîchir pour voir les erreurs éventuelles
    } catch (error) {
      console.error('Erreur lors du test:', error);
      toast.error('Erreur lors du test de connexion');
    } finally {
      setTesting(false);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshing(true);
    try {
      const response = await apiClient.post('/integrations/google-calendar/refresh');
      if (response.data.success) {
        toast.success('Token Google rafraîchi avec succès');
        fetchIntegrations();
      } else {
        toast.error('Impossible de rafraîchir le token');
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      toast.error('Erreur lors du rafraîchissement du token');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Google Calendar
                  {googleCalendar?.connected && (
                    <Badge variant={googleCalendar?.is_active ? "default" : "secondary"}>
                      {googleCalendar?.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Synchronisez vos entretiens avec votre calendrier Google
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {googleCalendar?.connected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={testing}
                  >
                    {testing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Tester
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshToken}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="w-4 h-4" />
                    )}
                    Rafraîchir
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnectGoogleCalendar}
                  >
                    <Trash2 className="w-4 h-4" />
                    Déconnecter
                  </Button>
                </>
              ) : (
                <Button onClick={handleConnectGoogleCalendar} disabled={connecting}>
                  {connecting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Connecter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {googleCalendar?.connected && (
          <CardContent>
            <div className="space-y-4">
              {/* Informations de connexion */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Email connecté</Label>
                  <p className="font-medium">{googleCalendar.provider_email || 'Non disponible'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Calendrier</Label>
                  <p className="font-medium">{googleCalendar.calendar_id || 'primary'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Connecté le</Label>
                  <p className="font-medium">
                    {googleCalendar.created_at ? new Date(googleCalendar.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dernière sync</Label>
                  <p className="font-medium">
                    {googleCalendar.last_sync_at ? new Date(googleCalendar.last_sync_at).toLocaleDateString() : 'Jamais'}
                  </p>
                </div>
              </div>

              {/* Erreurs de synchronisation */}
              {googleCalendar.sync_errors && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Erreur de synchronisation :</strong> {googleCalendar.sync_errors.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Statut de connexion */}
              {!googleCalendar.sync_errors && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Connexion active. Vos entretiens seront automatiquement synchronisés avec Google Calendar.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Intégrations à venir */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Autres intégrations
                <Badge variant="secondary">Bientôt</Badge>
              </CardTitle>
              <CardDescription>
                Microsoft Calendar, Slack, Teams, et plus encore...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Instructions */}
      <Alert>
        <Calendar className="h-4 w-4" />
        <AlertDescription>
          <strong>Note :</strong> Une fois connecté, Google Calendar synchronisera automatiquement vos entretiens.
          Vous pouvez tester la connexion à tout moment et rafraîchir les tokens si nécessaire.
        </AlertDescription>
      </Alert>
    </div>
  );
}