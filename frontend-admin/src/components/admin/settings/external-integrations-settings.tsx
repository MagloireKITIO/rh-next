'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Globe,
  Settings,
  Save,
  Cable,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api-client';

interface GoogleOAuthConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export default function ExternalIntegrationsSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [config, setConfig] = useState<GoogleOAuthConfig>({
    client_id: '',
    client_secret: '',
    redirect_uri: ''
  });

  const fetchConfig = useCallback(async () => {
    try {
      // Récupérer la configuration OAuth Google depuis les settings système
      const response = await adminApi.getSystemSettings();
      const systemConfig = response.data;

      setConfig({
        client_id: systemConfig?.google_oauth_client_id || '',
        client_secret: systemConfig?.google_oauth_client_secret || '',
        redirect_uri: systemConfig?.google_oauth_redirect_uri || 'http://localhost:3001/api/integrations/google-calendar/callback'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await adminApi.updateSystemSettings({
        google_oauth_client_id: config.client_id,
        google_oauth_client_secret: config.client_secret,
        google_oauth_redirect_uri: config.redirect_uri
      });
      toast.success('Configuration Google OAuth sauvegardée');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setSaving(false);
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Cable className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configuration des intégrations externes</h3>
          <p className="text-sm text-muted-foreground">
            Configurez les paramètres OAuth pour les services externes
          </p>
        </div>
      </div>

      {/* Google Calendar OAuth Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Configuration Google Calendar OAuth</CardTitle>
              <CardDescription>
                Paramètres OAuth pour l'authentification Google Calendar des utilisateurs RH
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="client_id">Client ID Google OAuth</Label>
              <Input
                id="client_id"
                value={config.client_id}
                onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                placeholder="xxxxx.apps.googleusercontent.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Obtenez ce Client ID depuis la Google Console
              </p>
            </div>

            <div>
              <Label htmlFor="client_secret">Client Secret Google OAuth</Label>
              <div className="relative">
                <Input
                  id="client_secret"
                  type={showSecret ? "text" : "password"}
                  value={config.client_secret}
                  onChange={(e) => setConfig({ ...config, client_secret: e.target.value })}
                  placeholder="Entrez le Client Secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gardez ce secret confidentiel
              </p>
            </div>

            <div>
              <Label htmlFor="redirect_uri">URI de redirection</Label>
              <Input
                id="redirect_uri"
                value={config.redirect_uri}
                onChange={(e) => setConfig({ ...config, redirect_uri: e.target.value })}
                placeholder="http://localhost:3001/api/integrations/google-calendar/callback"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cette URI doit être configurée dans la Google Console
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Instructions :</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Créez un projet dans la Google Cloud Console</li>
            <li>Activez l'API Google Calendar</li>
            <li>Créez des identifiants OAuth 2.0</li>
            <li>Ajoutez l'URI de redirection ci-dessus</li>
            <li>Copiez le Client ID et Client Secret ici</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Status */}
      {config.client_id && config.client_secret && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Configuration Google Calendar OAuth active. Les utilisateurs RH peuvent maintenant connecter leur compte Google Calendar.
          </AlertDescription>
        </Alert>
      )}

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
    </div>
  );
}