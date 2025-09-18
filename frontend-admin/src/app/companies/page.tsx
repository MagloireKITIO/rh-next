'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, Company } from '@/lib/api-client';
import AdminLayout from '@/components/layout/admin-layout';
import ProtectedRoute from '@/components/layout/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Building, 
  Users, 
  FolderOpen, 
  Plus, 
  Search, 
 
  Shield, 
  Edit, 
  Trash2,
  Eye,
  Power,
  PowerOff
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    domain: '',
    description: '',
  });

  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: () => adminApi.getAllCompanies(),
  });

  const { data: companiesStats } = useQuery({
    queryKey: ['admin', 'companies', 'stats'],
    queryFn: () => adminApi.getCompaniesStats(),
  });

  const createCompanyMutation = useMutation({
    mutationFn: adminApi.createCompany,
  });

  // Handle create success
  useEffect(() => {
    if (createCompanyMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies', 'stats'] });
      setIsCreateDialogOpen(false);
      setNewCompany({ name: '', domain: '', description: '' });
      toast.success('Entreprise créée avec succès');
    }
  }, [createCompanyMutation.isSuccess, queryClient]);

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) =>
      adminApi.updateCompany(id, data),
  });

  // Handle update success
  useEffect(() => {
    if (updateCompanyMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies', 'stats'] });
      setIsEditDialogOpen(false);
      setSelectedCompany(null);
      toast.success('Entreprise modifiée avec succès');
    }
  }, [updateCompanyMutation.isSuccess, queryClient]);

  const deleteCompanyMutation = useMutation({
    mutationFn: adminApi.deleteCompany,
  });

  // Handle delete success
  useEffect(() => {
    if (deleteCompanyMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies', 'stats'] });
      toast.success('Entreprise supprimée avec succès');
    }
  }, [deleteCompanyMutation.isSuccess, queryClient]);

  const toggleStatusMutation = useMutation({
    mutationFn: adminApi.toggleCompanyStatus,
  });

  // Handle toggle success
  useEffect(() => {
    if (toggleStatusMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      toast.success('Statut de l\'entreprise modifié');
    }
  }, [toggleStatusMutation.isSuccess, queryClient]);

  // Handle mutation errors
  useEffect(() => {
    if (createCompanyMutation.error) {
      const error = createCompanyMutation.error as Error & { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Erreur lors de la création');
    }
  }, [createCompanyMutation.error]);

  useEffect(() => {
    if (updateCompanyMutation.error) {
      const error = updateCompanyMutation.error as Error & { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Erreur lors de la modification');
    }
  }, [updateCompanyMutation.error]);

  useEffect(() => {
    if (deleteCompanyMutation.error) {
      const error = deleteCompanyMutation.error as Error & { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression');
    }
  }, [deleteCompanyMutation.error]);

  useEffect(() => {
    if (toggleStatusMutation.error) {
      const error = toggleStatusMutation.error as Error & { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Erreur lors du changement de statut');
    }
  }, [toggleStatusMutation.error]);

  const handleCreateCompany = async () => {
    if (!newCompany.name || !newCompany.domain) {
      toast.error('Le nom et le domaine sont requis');
      return;
    }

    createCompanyMutation.mutate({
      name: newCompany.name,
      domain: newCompany.domain,
      description: newCompany.description || undefined,
    });
  };

  const handleUpdateCompany = () => {
    if (selectedCompany) {
      updateCompanyMutation.mutate({
        id: selectedCompany.id,
        data: selectedCompany,
      });
    }
  };

  const handleDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (companyToDelete) {
      deleteCompanyMutation.mutate(companyToDelete.id);
      setIsDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleToggleStatus = (companyId: string) => {
    toggleStatusMutation.mutate(companyId);
  };

  const filteredCompanies = companies?.data?.filter((company: Company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.domain.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getCompanyStats = (companyId: string) => {
    return companiesStats?.data?.find((stat: { id: string }) => stat.id === companyId);
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestion des Entreprises</h1>
                <p className="text-sm text-muted-foreground">Administrez toutes les entreprises de la plateforme</p>
              </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Entreprise
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle entreprise</DialogTitle>
                  <DialogDescription>
                    Ajoutez une nouvelle entreprise à la plateforme
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de l&apos;entreprise *</Label>
                    <Input
                      id="name"
                      placeholder="Mon Entreprise"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domaine *</Label>
                    <Input
                      id="domain"
                      placeholder="mon-entreprise.com"
                      value={newCompany.domain}
                      onChange={(e) => setNewCompany({ ...newCompany, domain: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnelle)</Label>
                    <Input
                      id="description"
                      placeholder="Description de l&apos;entreprise..."
                      value={newCompany.description}
                      onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleCreateCompany} 
                      disabled={createCompanyMutation.isPending}
                      className="flex-1"
                    >
                      {createCompanyMutation.isPending ? (
                        <>
                          <LoadingSpinner className="w-4 h-4 mr-2" />
                          Création...
                        </>
                      ) : (
                        'Créer l\'entreprise'
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Companies List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="w-8 h-8" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCompanies.map((company: Company) => {
              const stats = getCompanyStats(company.id);
              return (
                <Card key={company.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{company.name}</CardTitle>
                          <CardDescription>{company.domain}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={company.is_active ? "default" : "secondary"} className="gap-1">
                          {company.is_active ? (
                            <Power className="w-3 h-3" />
                          ) : (
                            <PowerOff className="w-3 h-3" />
                          )}
                          {company.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {company.description && (
                      <p className="text-sm text-muted-foreground">{company.description}</p>
                    )}
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{stats?.totalUsers || 0}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Utilisateurs</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <FolderOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{stats?.totalProjects || 0}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Projets</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{stats?.averageScore || 0}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Score moyen</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Créée le {format(new Date(company.created_at), 'dd MMM yyyy', { locale: fr })}
                      </p>
                      
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsEditDialogOpen(true);
                          }}
                          title="Modifier l'entreprise"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleStatus(company.id)}
                          disabled={toggleStatusMutation.isPending}
                          title={company.is_active ? 'Désactiver l\'entreprise' : 'Activer l\'entreprise'}
                        >
                          {company.is_active ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCompany(company)}
                          disabled={deleteCompanyMutation.isPending}
                          title="Supprimer l'entreprise"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredCompanies.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune entreprise trouvée</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Aucune entreprise ne correspond à votre recherche.' : 'Commencez par créer votre première entreprise.'}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une entreprise
            </Button>
          </div>
        )}

        {/* Edit Company Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l&apos;entreprise</DialogTitle>
              <DialogDescription>
                Modifiez les informations de l&apos;entreprise
              </DialogDescription>
            </DialogHeader>
            
            {selectedCompany && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom de l&apos;entreprise *</Label>
                  <Input
                    id="edit-name"
                    value={selectedCompany.name}
                    onChange={(e) => setSelectedCompany({ ...selectedCompany, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-domain">Domaine *</Label>
                  <Input
                    id="edit-domain"
                    value={selectedCompany.domain}
                    onChange={(e) => setSelectedCompany({ ...selectedCompany, domain: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={selectedCompany.description || ''}
                    onChange={(e) => setSelectedCompany({ ...selectedCompany, description: e.target.value })}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleUpdateCompany} 
                    disabled={updateCompanyMutation.isPending}
                    className="flex-1"
                  >
                    {updateCompanyMutation.isPending ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Modification...
                      </>
                    ) : (
                      'Sauvegarder les modifications'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedCompany(null);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer cette entreprise ?
              </DialogDescription>
            </DialogHeader>
            {companyToDelete && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{companyToDelete.name}</div>
                      <div className="text-sm text-muted-foreground">{companyToDelete.domain}</div>
                    </div>
                  </div>
                  <div className="text-sm text-red-600">
                    ⚠️ Cette action est irréversible. Tous les utilisateurs, projets et données associés seront définitivement supprimés.
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setCompanyToDelete(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={deleteCompanyMutation.isPending}
                  >
                    {deleteCompanyMutation.isPending ? (
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