'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Mail, 
  Server, 
  Key, 
  Send, 
  Globe, 
  Building2,
  AlertCircle,
  TestTube2,
  Save,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface MailConfiguration {
  id?: string;
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

interface MailConfigFormProps {
  config?: MailConfiguration | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function MailConfigForm({ config, onCancel, onSuccess }: MailConfigFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('smtp');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isGlobal, setIsGlobal] = useState<boolean>(true);
  const [testEmail, setTestEmail] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  
  const [configuration, setConfiguration] = useState<MailConfiguration>({
    provider_type: 'smtp',
    from_email: '',
    from_name: 'RH Analytics Pro',
    is_active: true,
    is_default: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_secure: true,
    smtp_require_tls: false,
  });

  const queryClient = useQueryClient();
  const isEditing = !!config;

  // Charger les compagnies
  const { data: companies, isLoading: companiesLoading, isSuccess: companiesSuccess, isError: companiesError } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: () => adminApi.getCompanies(),
  });

  // Handle companies success and error
  useEffect(() => {
    if (companiesSuccess && companies) {
      console.log('📥 [FRONTEND] Entreprises reçues:', companies);
      console.log('📥 [FRONTEND] Nombre d\'entreprises:', companies?.data?.length || 0);
    }
  }, [companiesSuccess, companies]);

  useEffect(() => {
    if (companiesError) {
      console.error('❌ [FRONTEND] Erreur chargement entreprises:', companiesError);
    }
  }, [companiesError]);

  // Charger les entreprises affectées si on édite
  const { isSuccess: assignedSuccess } = useQuery({
    queryKey: ['admin', 'mail-config-companies', config?.id],
    queryFn: async () => {
      if (config?.id) {
        return await adminApi.getConfigurationCompanies(config.id);
      }
      return { data: [] };
    },
    enabled: !!config?.id,
    staleTime: 0, // Toujours considérer les données comme périmées
    gcTime: 0, // Ne pas garder en cache
  });

  // Handle assigned companies success
  useEffect(() => {
    if (assignedSuccess) {
      console.log('📥 [FRONTEND] Entreprises affectées chargées');
    }
  }, [assignedSuccess]);

  // Initialiser le formulaire si on édite
  useEffect(() => {
    if (config) {
      setConfiguration(config);
      setSelectedProvider(config.provider_type);
      
      // Déterminer si c'est global ou spécifique
      if (config.company_id) {
        // Configuration ancienne avec company_id unique
        setIsGlobal(false);
        setSelectedCompanies([config.company_id]);
      } else if (config.configurationCompanies && config.configurationCompanies.length > 0) {
        // Configuration avec assignations d&apos;entreprises
        const companyIds = config.configurationCompanies.map(cc => cc.company_id);
        setSelectedCompanies(companyIds);
        setIsGlobal(false);
      } else {
        // Configuration globale (aucune entreprise assignée)
        setIsGlobal(true);
        setSelectedCompanies([]);
      }
    }
  }, [config]);

  // Note: Les entreprises assignées sont maintenant incluses directement dans config.configurationCompanies

  // Sauvegarder la configuration
  const saveConfigMutation = useMutation({
    mutationFn: (data: MailConfiguration) => {
      if (isEditing) {
        return adminApi.updateMailConfiguration(config!.id!, data);
      } else {
        return adminApi.createMailConfiguration(data);
      }
    },
  });

  // Handle save success and error
  useEffect(() => {
    if (saveConfigMutation.isSuccess) {
      // L'invalidation est gérée dans handleSave après les affectations
      toast.success(`Configuration ${isEditing ? 'mise à jour' : 'créée'} avec succès`);
    }
  }, [saveConfigMutation.isSuccess, isEditing]);

  useEffect(() => {
    if (saveConfigMutation.isError) {
      const error = saveConfigMutation.error as Error & { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  }, [saveConfigMutation.isError, saveConfigMutation.error]);

  // Tester la configuration
  const testConfigMutation = useMutation({
    mutationFn: (email: string) => adminApi.testMailConfiguration(email, isGlobal ? undefined : selectedCompanies[0]),
  });

  // Handle test success and error
  useEffect(() => {
    if (testConfigMutation.isSuccess) {
      toast.success('Email de test envoyé avec succès');
      setIsTestMode(false);
      setTestEmail('');
    }
  }, [testConfigMutation.isSuccess]);

  useEffect(() => {
    if (testConfigMutation.isError) {
      const error = testConfigMutation.error as Error & { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi du test');
    }
  }, [testConfigMutation.isError, testConfigMutation.error]);

  const providers = [
    {
      id: 'smtp',
      name: 'Serveur SMTP',
      description: 'Gmail, Outlook, ou serveur SMTP personnalisé',
      icon: Server,
      requiresConfig: true,
    },
  ];

  const handleSave = async () => {
    if (!configuration.from_email) {
      toast.error('L\'email expéditeur est requis');
      return;
    }

    if (!isGlobal && selectedCompanies.length === 0) {
      toast.error('Veuillez sélectionner au moins une entreprise');
      return;
    }

    const configToSave = {
      provider_type: 'smtp' as const,
      company_id: undefined, // Toujours undefined pour les nouvelles configs
      smtp_host: configuration.smtp_host,
      smtp_port: configuration.smtp_port,
      smtp_user: configuration.smtp_user,
      smtp_password: configuration.smtp_password,
      smtp_secure: configuration.smtp_secure,
      smtp_require_tls: configuration.smtp_require_tls,
      from_email: configuration.from_email,
      from_name: configuration.from_name,
      is_active: configuration.is_active,
      is_default: configuration.is_default,
    };

    try {
      // 1. Sauvegarder la configuration
      const result = await saveConfigMutation.mutateAsync(configToSave);
      const savedConfigId = result.data?.id || config?.id;

      // 2. Gérer les affectations d&apos;entreprises
      if (savedConfigId) {
        if (isGlobal) {
          // Si c&apos;est global, supprimer toutes les affectations d&apos;entreprises
          await adminApi.assignCompaniesToConfiguration(savedConfigId, []);
        } else if (selectedCompanies.length > 0) {
          // Affecter les entreprises sélectionnées
          await adminApi.assignCompaniesToConfiguration(savedConfigId, selectedCompanies);
        }
      }

      // Invalider les caches spécifiques
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-configs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-config-companies', savedConfigId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail-config-companies'] });
      
      // Mettre à jour l'état isGlobal après la sauvegarde
      setIsGlobal(selectedCompanies.length === 0);
      
      toast.success('Configuration sauvegardée avec succès');
      onSuccess();
    } catch (error: unknown) {
      const err = error as Error & { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      toast.error('Veuillez saisir un email de test');
      return;
    }

    if (!configuration.smtp_host || !configuration.from_email) {
      toast.error('Veuillez remplir au minimum le serveur SMTP et l\'email expéditeur');
      return;
    }

    // Si on est en mode édition, utiliser l'API normale
    if (isEditing && config?.id) {
      testConfigMutation.mutate(testEmail);
    } else {
      // Si on est en mode création, il faut d'abord sauvegarder temporairement pour tester
      try {
        toast.info('Sauvegarde temporaire pour le test...');
        
        const configToSave = {
          provider_type: 'smtp' as const,
          smtp_host: configuration.smtp_host,
          smtp_port: configuration.smtp_port,
          smtp_user: configuration.smtp_user,
          smtp_password: configuration.smtp_password,
          smtp_secure: configuration.smtp_secure,
          smtp_require_tls: configuration.smtp_require_tls,
          from_email: configuration.from_email,
          from_name: configuration.from_name,
          is_active: false, // Inactif pendant les tests
          is_default: false,
        };

        const result = await saveConfigMutation.mutateAsync(configToSave);
        const tempConfigId = result.data?.id;

        if (tempConfigId) {
          // Assigner aux entreprises si nécessaire
          if (!isGlobal && selectedCompanies.length > 0) {
            await adminApi.assignCompaniesToConfiguration(tempConfigId, selectedCompanies);
          }

          // Maintenant tester avec cette config temporaire
          await adminApi.testMailConfiguration(testEmail, isGlobal ? undefined : selectedCompanies[0]);
          
          toast.success('Email de test envoyé avec succès ! Configuration sauvegardée mais inactive.');
          
          // Invalider les caches
          queryClient.invalidateQueries({ queryKey: ['admin', 'mail-configs'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'mail-config-companies', tempConfigId] });
          
          setIsTestMode(false);
          setTestEmail('');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors du test');
      }
    }
  };

  const renderConfigurationFields = () => {
    const selectedProviderData = providers.find(p => p.id === selectedProvider);
    
    if (!selectedProviderData?.requiresConfig) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ce fournisseur ne nécessite pas de configuration supplémentaire.
          </AlertDescription>
        </Alert>
      );
    }

    switch (selectedProvider) {
      case 'smtp':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp_host">Serveur SMTP</Label>
                <Input
                  id="smtp_host"
                  placeholder="smtp.gmail.com"
                  value={configuration.smtp_host || ''}
                  onChange={(e) => setConfiguration({...configuration, smtp_host: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="smtp_port">Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  placeholder="587"
                  value={configuration.smtp_port || 587}
                  onChange={(e) => setConfiguration({...configuration, smtp_port: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="smtp_user">Nom d&apos;utilisateur</Label>
              <Input
                id="smtp_user"
                placeholder="votre-email@gmail.com"
                value={configuration.smtp_user || ''}
                onChange={(e) => setConfiguration({...configuration, smtp_user: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="smtp_password">Mot de passe</Label>
              <Input
                id="smtp_password"
                type="password"
                placeholder={configuration.smtp_password ? "••••••••••••" : "Mot de passe ou App Password"}
                value={configuration.smtp_password || ''}
                onChange={(e) => setConfiguration({...configuration, smtp_password: e.target.value})}
              />
              {isEditing && (
                <p className="text-xs text-muted-foreground mt-1">
                  Laissez vide pour conserver le mot de passe actuel.
                </p>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp_secure"
                  checked={configuration.smtp_secure || false}
                  onCheckedChange={(checked) => setConfiguration({...configuration, smtp_secure: checked})}
                />
                <Label htmlFor="smtp_secure">SSL (port 465)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp_require_tls"
                  checked={configuration.smtp_require_tls || false}
                  onCheckedChange={(checked) => setConfiguration({...configuration, smtp_require_tls: checked})}
                />
                <Label htmlFor="smtp_require_tls">TLS requis (port 587)</Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h3 className="text-lg font-semibold">
              {isEditing ? 'Modifier la configuration' : 'Nouvelle configuration mail'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isEditing ? 'Modifiez les paramètres de cette configuration' : 'Créez une nouvelle configuration de messagerie'}
            </p>
          </div>
        </div>
      </div>

      {/* Sélection compagnie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Portée de la Configuration
          </CardTitle>
          <CardDescription>
            Choisissez si cette configuration s&apos;applique globalement ou à des entreprises spécifiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Switch Global/Spécifique */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_global"
                checked={isGlobal}
                onCheckedChange={setIsGlobal}
              />
              <Label htmlFor="is_global" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Configuration globale
              </Label>
            </div>
            
            {!isGlobal && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Entreprises utilisant cette configuration :</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {companiesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Chargement des entreprises...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(companies?.data || []).map((company: { id: string; name: string }) => (
                        <div key={company.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`company-${company.id}`}
                            checked={selectedCompanies.includes(company.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCompanies([...selectedCompanies, company.id]);
                              } else {
                                setSelectedCompanies(selectedCompanies.filter(id => id !== company.id));
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`company-${company.id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Building2 className="w-4 h-4" />
                            {company.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedCompanies.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">
                      {selectedCompanies.length} entreprise{selectedCompanies.length > 1 ? 's' : ''} sélectionnée{selectedCompanies.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={configuration.is_default}
                onCheckedChange={(checked) => setConfiguration({...configuration, is_default: checked})}
              />
              <Label htmlFor="is_default">Configuration par défaut</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sélection du fournisseur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Fournisseur de Messagerie
          </CardTitle>
          <CardDescription>
            Choisissez le service qui sera utilisé pour envoyer les emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => {
              const Icon = provider.icon;
              const isSelected = selectedProvider === provider.id;
              
              return (
                <div
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setConfiguration({
                      ...configuration,
                      provider_type: 'smtp'
                    });
                  }}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-admin-light bg-admin-light/5 ring-2 ring-admin-light/20' 
                      : 'border-border hover:border-admin-light/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{provider.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {provider.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration du fournisseur sélectionné */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configuration
          </CardTitle>
          <CardDescription>
            Paramètres spécifiques au fournisseur sélectionné
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderConfigurationFields()}
          
          <Separator />
          
          {/* Configuration générale */}
          <div className="space-y-4">
            <h4 className="font-medium">Expéditeur par défaut</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from_email">Email expéditeur *</Label>
                <Input
                  id="from_email"
                  type="email"
                  placeholder="noreply@votre-domaine.com"
                  value={configuration.from_email}
                  onChange={(e) => setConfiguration({...configuration, from_email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="from_name">Nom expéditeur</Label>
                <Input
                  id="from_name"
                  placeholder="RH Analytics Pro"
                  value={configuration.from_name}
                  onChange={(e) => setConfiguration({...configuration, from_name: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={configuration.is_active}
                onCheckedChange={(checked) => setConfiguration({...configuration, is_active: checked})}
              />
              <Label htmlFor="is_active">Configuration active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test de configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="w-5 h-5" />
            Test de Configuration
          </CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Testez votre configuration existante en envoyant un email de test'
              : 'Testez votre configuration avant de la sauvegarder (sauvegarde automatique pour le test)'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isTestMode ? (
            <Button 
              onClick={() => setIsTestMode(true)}
              variant="outline"
              className="w-full"
              disabled={!configuration.smtp_host || !configuration.from_email}
            >
              <TestTube2 className="w-4 h-4 mr-2" />
              Tester la configuration
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="test_email">Email de test</Label>
                <Input
                  id="test_email"
                  type="email"
                  placeholder="test@exemple.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleTest}
                  disabled={testConfigMutation.isPending}
                  className="flex-1"
                >
                  {testConfigMutation.isPending ? (
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Envoyer le test
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsTestMode(false);
                    setTestEmail('');
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          onClick={handleSave}
          disabled={saveConfigMutation.isPending}
          className="bg-gradient-to-r from-admin-light to-admin-dark"
        >
          {saveConfigMutation.isPending ? (
            <LoadingSpinner className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isEditing ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </div>
  );
}