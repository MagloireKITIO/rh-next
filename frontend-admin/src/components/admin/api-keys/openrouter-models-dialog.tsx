'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, ApiKey, OpenRouterModel } from '@/lib/api-client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Search, Cpu, DollarSign, Layers, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface OpenRouterModelsDialogProps {
  apiKey: ApiKey;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OpenRouterModelsDialog({
  apiKey,
  isOpen,
  onOpenChange,
}: OpenRouterModelsDialogProps) {
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  // Fetch OpenRouter models for this API key
  const { data: modelsResponse, isLoading: modelsLoading, error: modelsError } = useQuery({
    queryKey: ['openrouter-models', apiKey.id, modalityFilter, providerFilter],
    queryFn: () => adminApi.getOpenRouterModels(apiKey.id, {
      ...(modalityFilter !== 'all' && { modality: modalityFilter }),
      ...(providerFilter !== 'all' && { provider: providerFilter }),
    }),
    enabled: isOpen && apiKey.provider === 'openrouter' && apiKey.isActive,
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des modèles');
    },
  });

  // Fetch providers for filter
  const { data: providersResponse } = useQuery({
    queryKey: ['openrouter-providers', apiKey.id],
    queryFn: () => adminApi.getOpenRouterProviders(apiKey.id),
    enabled: isOpen && apiKey.provider === 'openrouter' && apiKey.isActive,
  });

  const models = modelsResponse?.data?.data || [];
  const providers = providersResponse?.data || [];

  // Filter models by search
  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(search.toLowerCase()) ||
    model.id.toLowerCase().includes(search.toLowerCase()) ||
    model.description.toLowerCase().includes(search.toLowerCase())
  );

  const getModalityColor = (modality: string) => {
    switch (modality.toLowerCase()) {
      case 'text': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'multimodal': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'image': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num < 0.001 ? `${(num * 1000000).toFixed(2)}µ` : `${num.toFixed(4)}`;
  };

  if (apiKey.provider !== 'openrouter') {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modèles OpenRouter</DialogTitle>
            <DialogDescription>
              Cette fonctionnalité n'est disponible que pour les clés OpenRouter.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <Cpu className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              La clé sélectionnée n'est pas une clé OpenRouter.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!apiKey.isActive) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modèles OpenRouter</DialogTitle>
            <DialogDescription>
              La clé API doit être active pour consulter les modèles.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <Cpu className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Activez la clé API pour consulter les modèles disponibles.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Modèles OpenRouter Disponibles</DialogTitle>
          <DialogDescription>
            Modèles accessibles avec la clé : {apiKey.name || 'Sans nom'}
          </DialogDescription>
        </DialogHeader>

        {modelsError ? (
          <div className="text-center py-8">
            <Cpu className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 font-medium">Erreur lors du chargement des modèles</p>
            <p className="text-sm text-muted-foreground mt-2">
              Vérifiez que la clé API est valide et active.
            </p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Rechercher</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Rechercher un modèle..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="modality">Modalité</Label>
                  <Select value={modalityFilter} onValueChange={setModalityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="text">Texte</SelectItem>
                      <SelectItem value="multimodal">Multimodal</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Label htmlFor="provider">Fournisseur</Label>
                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {providers.map(provider => (
                        <SelectItem key={provider} value={provider}>
                          {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Models List */}
            <div className="flex-1 overflow-auto">
              {modelsLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
                  <p className="text-muted-foreground">Chargement des modèles...</p>
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="text-center py-8">
                  <Cpu className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {search ? 'Aucun modèle trouvé pour cette recherche.' : 'Aucun modèle disponible.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-auto">
                  {filteredModels.map((model: OpenRouterModel) => (
                    <Card key={model.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-medium">{model.name}</CardTitle>
                            <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                              {model.id}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getModalityColor(model.architecture.modality)}>
                              {model.architecture.modality}
                            </Badge>
                            {model.top_provider.is_moderated && (
                              <Badge variant="outline" className="text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                Modéré
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3">
                          {model.description || 'Aucune description disponible'}
                        </p>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Contexte:</span>
                            <span>{model.context_length.toLocaleString()} tokens</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Prompt:</span>
                            <span>${formatPrice(model.pricing.prompt)}/1K</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Completion:</span>
                            <span>${formatPrice(model.pricing.completion)}/1K</span>
                          </div>
                        </div>

                        {model.top_provider.max_completion_tokens && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium">Max completion:</span> {model.top_provider.max_completion_tokens.toLocaleString()} tokens
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{filteredModels.length} modèle{filteredModels.length !== 1 ? 's' : ''} affiché{filteredModels.length !== 1 ? 's' : ''}</span>
                <span>{models.length} modèle{models.length !== 1 ? 's' : ''} total{models.length !== 1 ? 'aux' : ''}</span>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}