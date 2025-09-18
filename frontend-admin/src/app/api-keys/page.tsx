'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, ApiKey, Company } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/components/layout/admin-layout';
import ProtectedRoute from '@/components/layout/protected-route';
import OpenRouterModelsDialog from '@/components/admin/api-keys/openrouter-models-dialog';
import ModelConfigDialog from '@/components/admin/api-keys/model-config-dialog';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Key, 
  Building, 
  Activity, 
  Clock,
  Power,
  PowerOff,
  Eye,
  EyeOff,
  List,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ApiKeysPage() {
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [apiKeyToDelete, setApiKeyToDelete] = useState<ApiKey | null>(null);
  const [showFullKey, setShowFullKey] = useState<{[key: string]: boolean}>({});
  const [isModelsDialogOpen, setIsModelsDialogOpen] = useState(false);
  const [selectedApiKeyForModels, setSelectedApiKeyForModels] = useState<ApiKey | null>(null);
  const [isModelConfigDialogOpen, setIsModelConfigDialogOpen] = useState(false);
  const [selectedApiKeyForConfig, setSelectedApiKeyForConfig] = useState<ApiKey | null>(null);
  const [newApiKey, setNewApiKey] = useState({
    key: '',
    name: '',
    provider: 'openrouter',
    company_id: 'unassigned',
  });

  const queryClient = useQueryClient();

  // Fetch API keys
  const { data: apiKeys, isLoading: apiKeysLoading } = useQuery({
    queryKey: ['admin', 'api-keys'],
    queryFn: () => adminApi.getAllApiKeys(),
  });

  // Fetch API keys stats
  const { data: apiKeysStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'api-keys', 'stats'],
    queryFn: () => adminApi.getApiKeysStats(),
  });

  // Fetch companies for selection
  const { data: companies } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: () => adminApi.getAllCompanies(),
  });

  // Create API key mutation
  const createApiKeyMutation = useMutation({
    mutationFn: adminApi.createApiKey,
  });

  // Handle create success and error
  useEffect(() => {
    if (createApiKeyMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys', 'stats'] });
      setIsCreateDialogOpen(false);
      setNewApiKey({ key: '', name: '', provider: 'openrouter', company_id: 'unassigned' });
      toast.success('Clé API créée avec succès');
    }
  }, [createApiKeyMutation.isSuccess, queryClient]);

  useEffect(() => {
    if (createApiKeyMutation.isError) {
      const error = createApiKeyMutation.error as Error & { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  }, [createApiKeyMutation.isError, createApiKeyMutation.error]);

  // Update API key mutation
  const updateApiKeyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApiKey> }) =>
      adminApi.updateApiKey(id, data),
  });

  // Handle update success and error
  useEffect(() => {
    if (updateApiKeyMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys'] });
      setIsEditDialogOpen(false);
      setSelectedApiKey(null);
      toast.success('Clé API modifiée avec succès');
    }
  }, [updateApiKeyMutation.isSuccess, queryClient]);

  useEffect(() => {
    if (updateApiKeyMutation.isError) {
      const error = updateApiKeyMutation.error as Error & { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  }, [updateApiKeyMutation.isError, updateApiKeyMutation.error]);

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: adminApi.deleteApiKey,
  });

  // Handle delete success and error
  useEffect(() => {
    if (deleteApiKeyMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys', 'stats'] });
      toast.success('Clé API supprimée avec succès');
    }
  }, [deleteApiKeyMutation.isSuccess, queryClient]);

  useEffect(() => {
    if (deleteApiKeyMutation.isError) {
      const error = deleteApiKeyMutation.error as Error & { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }, [deleteApiKeyMutation.isError, deleteApiKeyMutation.error]);

  // Toggle API key status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: adminApi.toggleApiKeyStatus,
  });

  // Handle toggle success and error
  useEffect(() => {
    if (toggleStatusMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys', 'stats'] });
      toast.success('Statut de la clé API modifié');
    }
  }, [toggleStatusMutation.isSuccess, queryClient]);

  useEffect(() => {
    if (toggleStatusMutation.isError) {
      const error = toggleStatusMutation.error as Error & { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  }, [toggleStatusMutation.isError, toggleStatusMutation.error]);

  // Filter API keys
  const filteredApiKeys = apiKeys?.data?.filter((apiKey: ApiKey) => {
    const matchesSearch = apiKey.name?.toLowerCase().includes(search.toLowerCase()) ||
                         apiKey.provider.toLowerCase().includes(search.toLowerCase()) ||
                         apiKey.company?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCompany = selectedCompany === 'all' || 
                         (selectedCompany === 'unassigned' && !apiKey.company_id) ||
                         apiKey.company_id === selectedCompany;
    return matchesSearch && matchesCompany;
  }) || [];

  const handleCreateApiKey = () => {
    if (!newApiKey.key.trim()) {
      toast.error('La clé API est requise');
      return;
    }
    createApiKeyMutation.mutate(newApiKey);
  };

  const handleUpdateApiKey = () => {
    if (selectedApiKey) {
      if (!selectedApiKey.key.trim()) {
        toast.error('La clé API est requise');
        return;
      }
      updateApiKeyMutation.mutate({
        id: selectedApiKey.id,
        data: {
          key: selectedApiKey.key,
          name: selectedApiKey.name,
          company_id: selectedApiKey.company_id,
          provider: selectedApiKey.provider,
        },
      });
    }
  };

  const handleDeleteApiKey = (apiKey: ApiKey) => {
    setApiKeyToDelete(apiKey);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (apiKeyToDelete) {
      deleteApiKeyMutation.mutate(apiKeyToDelete.id);
      setIsDeleteDialogOpen(false);
      setApiKeyToDelete(null);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowFullKey(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    return `${key.substring(0, 8)}${'*'.repeat(Math.max(0, key.length - 12))}${key.substring(key.length - 4)}`;
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'openrouter': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'together_ai': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'openai': return 'bg-green-100 text-green-800 border-green-200';
      case 'anthropic': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const stats = apiKeysStats?.data;

  if (apiKeysLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des clés API...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Gestion des Clés API</h2>
              <p className="text-muted-foreground">
                Gérez les clés API et leur assignation aux entreprises
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Clé API
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter une Clé API</DialogTitle>
                  <DialogDescription>
                    Ajoutez une nouvelle clé API à la plateforme
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key">Clé API *</Label>
                    <Textarea
                      id="key"
                      placeholder="sk-..."
                      value={newApiKey.key}
                      onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nom (optionnel)</Label>
                    <Input
                      id="name"
                      placeholder="Ma clé API"
                      value={newApiKey.name}
                      onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider">Fournisseur</Label>
                    <Select value={newApiKey.provider} onValueChange={(value) => setNewApiKey({ ...newApiKey, provider: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openrouter">OpenRouter</SelectItem>
                        <SelectItem value="together_ai">Together AI</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="company">Entreprise (optionnel)</Label>
                    <Select value={newApiKey.company_id || 'unassigned'} onValueChange={(value) => setNewApiKey({ ...newApiKey, company_id: value === 'unassigned' ? '' : value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Non assignée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Non assignée</SelectItem>
                        {companies?.data?.map((company: Company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateApiKey}
                    disabled={createApiKeyMutation.isPending}
                  >
                    {createApiKeyMutation.isPending ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clés</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalKeys || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clés Actives</CardTitle>
                <Power className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.activeKeys || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clés Inactives</CardTitle>
                <PowerOff className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.inactiveKeys || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requêtes</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalRequests?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, fournisseur ou entreprise..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les entreprises</SelectItem>
                      <SelectItem value="unassigned">Non assignées</SelectItem>
                      {companies?.data?.map((company: Company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Keys Table */}
          <Card>
            <CardHeader>
              <CardTitle>Clés API ({filteredApiKeys.length})</CardTitle>
              <CardDescription>
                Liste de toutes les clés API configurées sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clé</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Utilisation</TableHead>
                    <TableHead>Dernière utilisation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApiKeys.map((apiKey: ApiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {showFullKey[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {showFullKey[apiKey.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{apiKey.name || <span className="text-muted-foreground italic">Sans nom</span>}</TableCell>
                      <TableCell>
                        <Badge className={getProviderBadgeColor(apiKey.provider)}>
                          {apiKey.provider}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {apiKey.company ? (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span>{apiKey.company.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Non assignée</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={apiKey.isActive ? "default" : "secondary"}
                          className={apiKey.isActive ? "bg-green-100 text-green-800 border-green-200" : ""}
                        >
                          {apiKey.isActive ? (
                            <>
                              <Power className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <PowerOff className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{apiKey.requestCount}</span>
                          <span className="text-sm text-muted-foreground">requêtes</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {apiKey.lastUsedAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(apiKey.lastUsedAt), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        ) : (
                          'Jamais utilisée'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {apiKey.provider === 'openrouter' && apiKey.isActive && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedApiKeyForConfig(apiKey);
                                  setIsModelConfigDialogOpen(true);
                                }}
                                title="Configurer les modèles"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedApiKeyForModels(apiKey);
                                  setIsModelsDialogOpen(true);
                                }}
                                title="Voir les modèles disponibles"
                              >
                                <List className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedApiKey(apiKey);
                              setIsEditDialogOpen(true);
                            }}
                            title="Modifier la clé API"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatusMutation.mutate(apiKey.id)}
                            disabled={toggleStatusMutation.isPending}
                            title={apiKey.isActive ? "Désactiver la clé" : "Activer la clé"}
                          >
                            {apiKey.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteApiKey(apiKey)}
                            disabled={deleteApiKeyMutation.isPending}
                            title="Supprimer la clé API"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit API Key Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Modifier la Clé API</DialogTitle>
                <DialogDescription>
                  Modifiez les informations de la clé API
                </DialogDescription>
              </DialogHeader>
              {selectedApiKey && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-key">Clé API *</Label>
                    <Textarea
                      id="edit-key"
                      placeholder="sk-..."
                      value={selectedApiKey.key || ''}
                      onChange={(e) => setSelectedApiKey({ ...selectedApiKey, key: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-name">Nom</Label>
                    <Input
                      id="edit-name"
                      value={selectedApiKey.name || ''}
                      onChange={(e) => setSelectedApiKey({ ...selectedApiKey, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-provider">Fournisseur</Label>
                    <Select 
                      value={selectedApiKey.provider} 
                      onValueChange={(value) => setSelectedApiKey({ ...selectedApiKey, provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openrouter">OpenRouter</SelectItem>
                        <SelectItem value="together_ai">Together AI</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-company">Entreprise</Label>
                    <Select 
                      value={selectedApiKey.company_id || 'unassigned'} 
                      onValueChange={(value) => setSelectedApiKey({ ...selectedApiKey, company_id: value === 'unassigned' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Non assignée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Non assignée</SelectItem>
                        {companies?.data?.map((company: Company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpdateApiKey}
                  disabled={updateApiKeyMutation.isPending}
                >
                  {updateApiKeyMutation.isPending ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
                  Sauvegarder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* OpenRouter Models Dialog */}
          {selectedApiKeyForModels && (
            <OpenRouterModelsDialog
              apiKey={selectedApiKeyForModels}
              isOpen={isModelsDialogOpen}
              onOpenChange={(open) => {
                setIsModelsDialogOpen(open);
                if (!open) {
                  setSelectedApiKeyForModels(null);
                }
              }}
            />
          )}

          {/* Model Configuration Dialog */}
          {selectedApiKeyForConfig && (
            <ModelConfigDialog
              apiKey={selectedApiKeyForConfig}
              isOpen={isModelConfigDialogOpen}
              onOpenChange={(open) => {
                setIsModelConfigDialogOpen(open);
                if (!open) {
                  setSelectedApiKeyForConfig(null);
                }
              }}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer cette clé API ?
                </DialogDescription>
              </DialogHeader>
              {apiKeyToDelete && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {apiKeyToDelete.name || 'Clé API sans nom'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {apiKeyToDelete.provider} • {apiKeyToDelete.company?.name || 'Non assignée'}
                        </div>
                        <code className="text-xs bg-background px-2 py-1 rounded font-mono">
                          {maskKey(apiKeyToDelete.key)}
                        </code>
                      </div>
                    </div>
                    <div className="text-sm text-red-600">
                      ⚠️ Cette action est irréversible. La clé API sera définitivement supprimée.
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeleteDialogOpen(false);
                        setApiKeyToDelete(null);
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={confirmDelete}
                      disabled={deleteApiKeyMutation.isPending}
                    >
                      {deleteApiKeyMutation.isPending ? (
                        <>
                          <LoadingSpinner className="w-4 h-4 mr-2" />
                          Suppression...
                        </>
                      ) : (
                        'Supprimer définitivement'
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}