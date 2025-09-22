'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, LoginAuditRecord, LoginAuditQuery } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Clock,
  User,
  MapPin,
  Smartphone,
  Monitor,
  RefreshCw,
  Download,
  Search,
  Tablet,
  HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SecuritySettings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(50);

  // Construction de la query pour l'API
  const buildQuery = (): LoginAuditQuery => {
    const query: LoginAuditQuery = {
      page: currentPage,
      limit: pageLimit,
    };

    if (searchTerm.trim()) {
      query.search = searchTerm.trim();
    }

    if (statusFilter !== 'all') {
      query.status = statusFilter as 'success' | 'failed' | 'suspicious';
    }

    if (deviceFilter !== 'all') {
      query.device_type = deviceFilter as 'desktop' | 'mobile' | 'tablet' | 'unknown';
    }

    return query;
  };

  // Récupération des données avec React Query
  const {
    data: auditData,
    isLoading: auditLoading,
    error: auditError,
    refetch: refetchAudit
  } = useQuery({
    queryKey: ['admin', 'security', 'login-audit', buildQuery()],
    queryFn: async () => {
      console.log('🔍 [FRONTEND] Calling getLoginAuditLogs with query:', buildQuery());
      const result = await adminApi.getLoginAuditLogs(buildQuery());
      console.log('🔍 [FRONTEND] getLoginAuditLogs result:', result.data);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: statsData,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['admin', 'security', 'login-audit', 'stats'],
    queryFn: async () => {
      console.log('🔍 [FRONTEND] Calling getLoginAuditStats');
      const result = await adminApi.getLoginAuditStats();
      console.log('🔍 [FRONTEND] getLoginAuditStats result:', result.data);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Réussi</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échec</Badge>;
      case 'suspicious':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Suspect</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  const handleRefresh = () => {
    refetchAudit();
  };

  const handleExport = () => {
    // TODO: Implémenter l'export des données
    console.log('Export des données d\'audit...');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDeviceFilter('all');
    setCurrentPage(1);
  };

  const auditLogs = auditData?.data?.data || [];
  const auditStats = statsData?.data;

  if (auditLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des données de sécurité...</p>
        </div>
      </div>
    );
  }

  if (auditError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">Erreur lors du chargement des données</p>
          <Button onClick={() => refetchAudit()} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="login-audit" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="login-audit" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Audit des Connexions
          </TabsTrigger>
          <TabsTrigger value="access-control" disabled className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Contrôle d'Accès
            <Badge variant="secondary" className="ml-1 text-xs">Bientôt</Badge>
          </TabsTrigger>
          <TabsTrigger value="security-policies" disabled className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Politiques de Sécurité
            <Badge variant="secondary" className="ml-1 text-xs">Bientôt</Badge>
          </TabsTrigger>
          <TabsTrigger value="monitoring" disabled className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Surveillance
            <Badge variant="secondary" className="ml-1 text-xs">Bientôt</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login-audit" className="space-y-6">
          {/* En-tête avec statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Connexions Réussies</p>
                    <p className="text-2xl font-bold text-green-600">
                      {auditStats?.successful_logins || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Tentatives Échouées</p>
                    <p className="text-2xl font-bold text-red-600">
                      {auditStats?.failed_attempts || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Activités Suspectes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {auditStats?.suspicious_activities || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total Événements</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {auditStats?.total_attempts || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres et actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Journal d'Audit des Connexions
                  </CardTitle>
                  <CardDescription>
                    Surveillance en temps réel de toutes les tentatives de connexion à la plateforme
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Actualiser
                  </Button>
                  <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Exporter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Barre de filtres */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Rechercher</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Email, nom d'utilisateur ou adresse IP..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="success">Réussi</SelectItem>
                      <SelectItem value="failed">Échec</SelectItem>
                      <SelectItem value="suspicious">Suspect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Appareil</Label>
                  <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tous les appareils" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les appareils</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="tablet">Tablette</SelectItem>
                      <SelectItem value="unknown">Inconnu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={resetFilters}>
                    Réinitialiser
                  </Button>
                </div>
              </div>

              {/* Tableau des résultats */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Date & Heure</TableHead>
                      <TableHead>Adresse IP</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead>Appareil</TableHead>
                      <TableHead>Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Activity className="w-8 h-8 text-muted-foreground" />
                            <p className="text-muted-foreground">Aucune donnée d'audit trouvée</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((record: LoginAuditRecord) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(record.status)}
                              {getStatusBadge(record.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {record.user?.name || 'Utilisateur inconnu'}
                              </p>
                              <p className="text-sm text-muted-foreground">{record.email_attempt}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm">
                                  {format(new Date(record.created_at), 'dd/MM/yyyy', { locale: fr })}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(record.created_at), 'HH:mm:ss', { locale: fr })}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {record.ip_address}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {record.location_city ?
                                  `${record.location_city}, ${record.location_country}` :
                                  record.location_country || 'Inconnu'
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(record.device_type)}
                              <div>
                                <span className="text-sm capitalize">{record.device_type}</span>
                                {record.browser && (
                                  <p className="text-xs text-muted-foreground">{record.browser}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.status === 'failed' && record.failure_reason && (
                              <Badge variant="destructive" className="text-xs">
                                {record.failure_reason}
                              </Badge>
                            )}
                            {record.status === 'suspicious' && record.suspicious_reasons && (
                              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                {record.suspicious_reasons}
                              </Badge>
                            )}
                            {record.status === 'success' && record.session_duration_seconds && (
                              <Badge variant="outline" className="text-xs">
                                {Math.round(record.session_duration_seconds / 60)}min
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {auditData?.data?.total && auditData.data.total > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Affichage de {auditLogs.length} résultat(s) sur {auditData.data.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                      Précédent
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} sur {auditData.data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= auditData.data.totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(auditData.data.totalPages, prev + 1))}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Autres onglets (placeholder) */}
        <TabsContent value="access-control">
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Contrôle d'Accès</h3>
              <p className="text-muted-foreground">
                Gestion des permissions et des rôles utilisateurs
              </p>
              <Badge variant="secondary" className="mt-4">À venir</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security-policies">
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Politiques de Sécurité</h3>
              <p className="text-muted-foreground">
                Configuration des règles de sécurité et des restrictions
              </p>
              <Badge variant="secondary" className="mt-4">À venir</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardContent className="text-center py-12">
              <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Surveillance</h3>
              <p className="text-muted-foreground">
                Monitoring en temps réel et alertes de sécurité
              </p>
              <Badge variant="secondary" className="mt-4">À venir</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}