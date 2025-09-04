'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, BarChart3, Building2, Users, Mail, AlertTriangle, CheckCircle, XCircle, Search, Filter, ToggleLeft, ToggleRight, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api-client';

interface MailAutomation {
  id: string;
  title: string;
  description?: string;
  trigger: string;
  entity_type: string;
  status: string;
  company_id: string;
  company?: {
    name: string;
    domain: string;
  };
  sent_count: number;
  success_count: number;
  failed_count: number;
  last_triggered_at?: string;
  created_at: string;
  created_by_user?: {
    name: string;
    email: string;
  };
}

interface Company {
  id: string;
  name: string;
  domain: string;
  users_count: number;
  automations_count: number;
  total_sent: number;
  success_rate: number;
}

interface GlobalStats {
  total_companies: number;
  total_automations: number;
  active_automations: number;
  total_sent: number;
  success_rate: number;
  automations_by_type: Record<string, number>;
}

export default function MailAutomationsTab() {
  const [activeView, setActiveView] = useState<'overview' | 'automations' | 'companies'>('overview');
  const [automations, setAutomations] = useState<MailAutomation[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    total_companies: 0,
    total_automations: 0,
    active_automations: 0,
    total_sent: 0,
    success_rate: 0,
    automations_by_type: {}
  });
  const [loading, setLoading] = useState(false);

  // CRUD States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<MailAutomation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingAutomations, setLoadingAutomations] = useState<Record<string, boolean>>({});
  
  // Form States
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    trigger: '',
    entity_type: '',
    company_id: '',
    mail_template_id: '',
    recipients: [] as string[]
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    trigger: '',
    entity_type: '',
    mail_template_id: '',
    recipients: [] as string[]
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [activeView]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeView === 'overview' || activeView === 'automations') {
        // Load global stats, all automations, and companies for form
        const [statsResponse, automationsResponse, allCompaniesResponse] = await Promise.all([
          adminApi.getMailAutomationsStats(),
          adminApi.getAllMailAutomations(),
          adminApi.getAllCompanies()
        ]);

        setGlobalStats(statsResponse.data);
        setAutomations(automationsResponse.data);
        setCompanies(allCompaniesResponse.data);
      }

      if (activeView === 'companies') {
        // Load companies with automation stats
        const companiesResponse = await adminApi.getCompaniesAutomationStats();
        setCompanies(companiesResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutomation = async (automationId: string, currentStatus: string) => {
    setLoadingAutomations(prev => ({ ...prev, [automationId]: true }));
    try {
      await adminApi.toggleMailAutomation(automationId);
      toast.success(`Automatisation ${currentStatus === 'active' ? 'désactivée' : 'activée'}`);
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    } finally {
      setLoadingAutomations(prev => ({ ...prev, [automationId]: false }));
    }
  };

  const handleCreateAutomation = async () => {
    if (!createForm.title || !createForm.trigger || !createForm.entity_type || !createForm.company_id) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Prepare data with required fields
    const automationData = {
      ...createForm,
      mail_template_id: createForm.mail_template_id || '567d6d53-982f-48b1-a398-95f272de0683', // Use existing template ID
      recipients: createForm.recipients.length > 0 && createForm.recipients[0] !== '' 
        ? createForm.recipients 
        : ['company_hr'] // Default to company HR
    };

    setIsCreating(true);
    try {
      await adminApi.createMailAutomation(automationData);
      toast.success('Automatisation créée avec succès');
      setIsCreateDialogOpen(false);
      setCreateForm({
        title: '',
        description: '',
        trigger: '',
        entity_type: '',
        company_id: '',
        mail_template_id: '',
        recipients: []
      });
      await loadData();
    } catch (error) {
      console.error('Create automation error:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateAutomation = async () => {
    if (!selectedAutomation) return;

    setIsUpdating(true);
    try {
      await adminApi.updateMailAutomation(selectedAutomation.id, editForm);
      toast.success('Automatisation modifiée avec succès');
      setIsEditDialogOpen(false);
      setSelectedAutomation(null);
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette automatisation ?')) {
      return;
    }

    setLoadingAutomations(prev => ({ ...prev, [id]: true }));
    try {
      await adminApi.deleteMailAutomation(id);
      toast.success('Automatisation supprimée avec succès');
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoadingAutomations(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleEditAutomation = (automation: MailAutomation) => {
    setSelectedAutomation(automation);
    setEditForm({
      title: automation.title,
      description: automation.description || '',
      trigger: automation.trigger,
      entity_type: automation.entity_type,
      mail_template_id: automation.id, // Nous devrons récupérer le vrai template ID
      recipients: [] // Nous devrons récupérer les vrais destinataires
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Actif</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactif</Badge>;
      case 'draft':
        return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      'on_create': 'À la création',
      'on_update': 'À la mise à jour', 
      'on_delete': 'À la suppression'
    };
    return labels[trigger] || trigger;
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      'candidate': 'Candidat',
      'project': 'Projet',
      'user': 'Utilisateur',
      'analysis': 'Analyse'
    };
    return labels[entity] || entity;
  };

  const filteredAutomations = automations.filter(automation => {
    const matchesSearch = automation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         automation.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         automation.created_by_user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || automation.status === statusFilter;
    const matchesCompany = companyFilter === 'all' || automation.company_id === companyFilter;

    return matchesSearch && matchesStatus && matchesCompany;
  });

  const uniqueCompanies = Array.from(new Set(automations.map(a => a.company_id)))
    .map(companyId => automations.find(a => a.company_id === companyId)!)
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automatisations Mail</h2>
          <p className="text-muted-foreground">
            Gérez toutes les automatisations mail des entreprises
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)} 
          className="flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Créer une automatisation
        </Button>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Automatisations
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Entreprises
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Global Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entreprises</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{globalStats.total_companies}</div>
                <p className="text-xs text-muted-foreground">
                  avec automatisations configurées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Automatisations</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{globalStats.total_automations}</div>
                <p className="text-xs text-muted-foreground">
                  {globalStats.active_automations} actives
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emails Envoyés</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{globalStats.total_sent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  ce mois-ci
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{globalStats.success_rate}%</div>
                <p className="text-xs text-muted-foreground">
                  {globalStats.success_rate >= 95 ? 'Excellent' : globalStats.success_rate >= 90 ? 'Bon' : 'À améliorer'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Automations by Type Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Type d'Entité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(globalStats.automations_by_type).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{getEntityLabel(type)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{count}</Badge>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(count / globalStats.total_automations) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label htmlFor="search">Rechercher</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Titre, entreprise ou créateur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status-filter">Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="company-filter">Entreprise</Label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {uniqueCompanies.map((automation) => (
                        <SelectItem key={automation.company_id} value={automation.company_id}>
                          {automation.company?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Automations Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Automatisation</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Déclencheur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAutomations.map((automation) => (
                    <TableRow key={automation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{automation.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {automation.description}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getEntityLabel(automation.entity_type)}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{automation.company?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {automation.company?.domain}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {getTriggerLabel(automation.trigger)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(automation.status)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{automation.sent_count}</span> envoyés
                          </div>
                          <div className="flex gap-2 text-xs">
                            <span className="text-green-600">
                              {automation.success_count} ✓
                            </span>
                            <span className="text-red-600">
                              {automation.failed_count} ✗
                            </span>
                          </div>
                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ 
                                width: automation.sent_count > 0 
                                  ? `${(automation.success_count / automation.sent_count) * 100}%` 
                                  : '0%' 
                              }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="text-sm">
                            {new Date(automation.created_at).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            par {automation.created_by_user?.name}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAutomation(automation.id, automation.status)}
                            className="h-8 w-8 p-0"
                            disabled={loadingAutomations[automation.id]}
                          >
                            {loadingAutomations[automation.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : automation.status === 'active' ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditAutomation(automation)}
                            className="h-8 w-8 p-0"
                            disabled={loadingAutomations[automation.id]}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteAutomation(automation.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            disabled={loadingAutomations[automation.id]}
                          >
                            {loadingAutomations[automation.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>

                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredAutomations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune automatisation trouvée</p>
                  {searchTerm && (
                    <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          {/* Companies with Automation Stats */}
          <div className="grid gap-6">
            {companies.map((company) => (
              <Card key={company.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {company.name}
                    </div>
                    <Badge variant="outline">{company.automations_count} automatisations</Badge>
                  </CardTitle>
                  <CardDescription>
                    {company.domain} • {company.users_count} utilisateurs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{company.total_sent}</div>
                      <div className="text-sm text-muted-foreground">Emails envoyés</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{company.success_rate}%</div>
                      <div className="text-sm text-muted-foreground">Taux de succès</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{company.automations_count}</div>
                      <div className="text-sm text-muted-foreground">Automatisations</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {companies.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune entreprise avec automatisations trouvée</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Automation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle automatisation</DialogTitle>
            <DialogDescription>
              Configurez une nouvelle automatisation mail pour une entreprise
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input 
                id="title" 
                placeholder="Nom de l'automatisation"
                value={createForm.title}
                onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                placeholder="Description (optionnel)"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trigger">Déclencheur *</Label>
                <Select 
                  value={createForm.trigger}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, trigger: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un déclencheur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_create">À la création</SelectItem>
                    <SelectItem value="on_update">À la mise à jour</SelectItem>
                    <SelectItem value="on_delete">À la suppression</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="entity">Type d'entité *</Label>
                <Select 
                  value={createForm.entity_type}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, entity_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une entité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="candidate">Candidat</SelectItem>
                    <SelectItem value="project">Projet</SelectItem>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="analysis">Analyse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="company">Entreprise *</Label>
              <Select 
                value={createForm.company_id}
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, company_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une entreprise" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name} ({company.domain})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="recipients">Destinataires *</Label>
              <Input 
                id="recipients" 
                placeholder="company_hr (par défaut)"
                value={createForm.recipients.join(', ')}
                onChange={(e) => setCreateForm(prev => ({ 
                  ...prev, 
                  recipients: e.target.value ? e.target.value.split(',').map(email => email.trim()) : []
                }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Séparez plusieurs emails par des virgules
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreateAutomation}
                disabled={isCreating}
              >
                {isCreating ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Automation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'automatisation</DialogTitle>
            <DialogDescription>
              Modifiez les paramètres de l'automatisation
            </DialogDescription>
          </DialogHeader>
          {selectedAutomation && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Titre</Label>
                <Input 
                  id="edit-title" 
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nom de l'automatisation" 
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input 
                  id="edit-description" 
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optionnel)" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-trigger">Déclencheur</Label>
                  <Select 
                    value={editForm.trigger}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, trigger: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un déclencheur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_create">À la création</SelectItem>
                      <SelectItem value="on_update">À la mise à jour</SelectItem>
                      <SelectItem value="on_delete">À la suppression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-entity">Type d'entité</Label>
                  <Select 
                    value={editForm.entity_type}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, entity_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une entité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="candidate">Candidat</SelectItem>
                      <SelectItem value="project">Projet</SelectItem>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="analysis">Analyse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-recipients">Destinataires</Label>
                <Input 
                  id="edit-recipients" 
                  placeholder="company_hr (par défaut)"
                  value={editForm.recipients.join(', ')}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    recipients: e.target.value ? e.target.value.split(',').map(email => email.trim()) : []
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Séparez plusieurs emails par des virgules. Utilisez 'company_hr' pour l'équipe RH ou 'candidate_email' pour le candidat.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpdateAutomation}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    'Sauvegarder'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}