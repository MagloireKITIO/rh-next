'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, ApiKey, OpenRouterModel, ModelConfig } from '@/lib/api-client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Zap, Shield, DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ModelConfigDialogProps {
  apiKey: ApiKey;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ModelConfigDialog({
  apiKey,
  isOpen,
  onOpenChange,
}: ModelConfigDialogProps) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    primaryModel: '',
    fallbackModel1: '',
    fallbackModel2: '',
    fallbackModel3: '',
    notes: '',
  });

  // Fetch available models
  const { data: modelsResponse, isLoading: modelsLoading } = useQuery({
    queryKey: ['openrouter-models', apiKey.id],
    queryFn: () => adminApi.getOpenRouterModels(apiKey.id),
    enabled: isOpen && apiKey.provider === 'openrouter' && apiKey.isActive,
  });

  // Fetch existing config
  const { data: existingConfig, isLoading: configLoading } = useQuery({
    queryKey: ['model-config', apiKey.id],
    queryFn: () => adminApi.getModelConfig(apiKey.id),
    enabled: isOpen && apiKey.provider === 'openrouter',
  });

  // Load existing config when data is available
  useEffect(() => {
    if (existingConfig?.data) {
      setConfig({
        primaryModel: existingConfig.data.primaryModel || '',
        fallbackModel1: existingConfig.data.fallbackModel1 || '',
        fallbackModel2: existingConfig.data.fallbackModel2 || '',
        fallbackModel3: existingConfig.data.fallbackModel3 || '',
        notes: existingConfig.data.notes || '',
      });
    }
  }, [existingConfig]);

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: (configData: typeof config) => {
      if (existingConfig?.data) {
        return adminApi.updateModelConfig(apiKey.id, configData);
      } else {
        return adminApi.createModelConfig(apiKey.id, configData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-config', apiKey.id] });
      toast.success('Configuration des modèles sauvegardée');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    },
  });

  // Delete config mutation
  const deleteConfigMutation = useMutation({
    mutationFn: () => adminApi.deleteModelConfig(apiKey.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-config', apiKey.id] });
      setConfig({
        primaryModel: '',
        fallbackModel1: '',
        fallbackModel2: '',
        fallbackModel3: '',
        notes: '',
      });
      toast.success('Configuration supprimée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const models = modelsResponse?.data?.data || [];

  // Filter models by performance/cost tiers
  const getModelsByTier = () => {
    const premium = models.filter(m => 
      m.id.includes('gpt-4') || 
      m.id.includes('claude-3-opus') ||
      m.id.includes('llama-3.2-90b')
    );
    
    const balanced = models.filter(m => 
      m.id.includes('claude-3-sonnet') ||
      m.id.includes('llama-3.2-11b') ||
      m.id.includes('gpt-3.5-turbo-16k')
    );
    
    const economical = models.filter(m => 
      m.id.includes('claude-3-haiku') ||
      m.id.includes('llama-3.2-3b') ||
      m.id.includes('gpt-3.5-turbo')
    );

    return { premium, balanced, economical };
  };

  const { premium, balanced, economical } = getModelsByTier();

  const getModelInfo = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return null;

    return {
      name: model.name,
      description: model.description,
      contextLength: model.context_length,
      promptPrice: parseFloat(model.pricing.prompt),
      completionPrice: parseFloat(model.pricing.completion),
    };
  };

  const formatPrice = (price: number) => {
    return price < 0.001 ? `${(price * 1000000).toFixed(1)}µ` : `${price.toFixed(4)}`;
  };

  const handleSave = () => {
    if (!config.primaryModel) {
      toast.error('Le modèle principal est requis');
      return;
    }
    saveConfigMutation.mutate(config);
  };

  if (apiKey.provider !== 'openrouter') {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuration des Modèles</DialogTitle>
            <DialogDescription>
              Cette fonctionnalité n'est disponible que pour les clés OpenRouter.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration des Modèles
          </DialogTitle>
          <DialogDescription>
            Configurez les modèles à utiliser pour l'analyse CV avec cette clé API
          </DialogDescription>
        </DialogHeader>

        {(modelsLoading || configLoading) ? (
          <div className="text-center py-8">
            <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-96 overflow-auto">
            {/* Primary Model */}
            <div className="space-y-2">
              <Label htmlFor="primaryModel" className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                Modèle Principal *
              </Label>
              <Select
                value={config.primaryModel}
                onValueChange={(value) => setConfig({ ...config, primaryModel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le modèle principal" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">🏆 Premium</div>
                  {premium.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          ${formatPrice(parseFloat(model.pricing.prompt))}/1K
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">⚖️ Équilibrés</div>
                  {balanced.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          ${formatPrice(parseFloat(model.pricing.prompt))}/1K
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {config.primaryModel && (
                <div className="text-xs text-muted-foreground">
                  {getModelInfo(config.primaryModel)?.description}
                </div>
              )}
            </div>

            <Separator />

            {/* Fallback Models */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                Modèles de Secours (Fallback)
              </Label>

              {[1, 2, 3].map((level) => (
                <div key={level} className="space-y-2">
                  <Label 
                    htmlFor={`fallbackModel${level}`} 
                    className="text-sm text-muted-foreground"
                  >
                    Fallback {level} {level === 1 && '(Recommandé)'}
                  </Label>
                  <Select
                    value={config[`fallbackModel${level}` as keyof typeof config] || 'none'}
                    onValueChange={(value) => 
                      setConfig({ ...config, [`fallbackModel${level}`]: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Modèle de secours ${level}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      
                      {level >= 2 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">⚖️ Équilibrés</div>
                          {balanced.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{model.name}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  ${formatPrice(parseFloat(model.pricing.prompt))}/1K
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">💰 Économiques</div>
                      {economical.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{model.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              ${formatPrice(parseFloat(model.pricing.prompt))}/1K
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Notes sur cette configuration..."
                value={config.notes}
                onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Configuration Summary */}
            {config.primaryModel && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Résumé de la Configuration
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Modèle principal: {getModelInfo(config.primaryModel)?.name}</div>
                  {config.fallbackModel1 && (
                    <div>• Fallback 1: {getModelInfo(config.fallbackModel1)?.name}</div>
                  )}
                  {config.fallbackModel2 && (
                    <div>• Fallback 2: {getModelInfo(config.fallbackModel2)?.name}</div>
                  )}
                  {config.fallbackModel3 && (
                    <div>• Fallback 3: {getModelInfo(config.fallbackModel3)?.name}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div>
              {existingConfig?.data && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteConfigMutation.mutate()}
                  disabled={deleteConfigMutation.isPending}
                  className="text-red-600 hover:text-red-800"
                >
                  {deleteConfigMutation.isPending ? <LoadingSpinner className="w-3 h-3 mr-2" /> : null}
                  Supprimer
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saveConfigMutation.isPending || !config.primaryModel}
              >
                {saveConfigMutation.isPending ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}