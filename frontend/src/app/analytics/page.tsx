'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sidebar } from '@/components/ui/sidebar';
import { NavBar } from '@/components/ui/navbar';
import Link from 'next/link';
import { 
  Search, 
  FileText, 
  Users, 
  BarChart3, 
  TrendingUp, 
  Filter,
  Eye,
  Download,
  Calendar,
  Target
} from 'lucide-react';

interface ProjectAnalytics {
  id: string;
  name: string;
  status: string;
  totalCandidates: number;
  analyzedCandidates: number;
  averageScore: number;
  topCandidateScore: number;
  createdAt: string;
  lastActivity: string;
}

export default function AnalyticsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('lastActivity');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', 'analytics', search, statusFilter, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (sortBy) params.append('sortBy', sortBy);
      
      const response = await apiClient.get(`/projects-analytics?${params.toString()}`);
      return response.data.data;
    },
  });

  const filteredProjects = projects || [];

  if (isLoading) {
    return (
      <>
        <NavBar withSidebar />
        <Sidebar />
        <main className="ml-64 pt-24 min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="p-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
                <p className="text-muted-foreground">Chargement des analytics...</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <NavBar withSidebar />
      <Sidebar />
      <main className="ml-64 pt-24 min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Analytics & Rapports
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Analysez les performances de vos projets de recrutement et générez des rapports détaillés
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projets Actifs</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredProjects.filter((p: ProjectAnalytics) => p.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sur {filteredProjects.length} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Candidats</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredProjects.reduce((sum: number, p: ProjectAnalytics) => sum + p.totalCandidates, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tous projets confondus
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analyses Réalisées</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredProjects.reduce((sum: number, p: ProjectAnalytics) => sum + p.analyzedCandidates, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  CV analysés par IA
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Moyen Global</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredProjects.length > 0 
                    ? Math.round(filteredProjects.reduce((sum: number, p: ProjectAnalytics) => sum + p.averageScore, 0) / filteredProjects.length)
                    : 0
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Moyenne pondérée
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtres et Recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rechercher</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom du projet..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="completed">Terminés</SelectItem>
                      <SelectItem value="draft">Brouillons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Trier par</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordre de tri" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lastActivity">Dernière activité</SelectItem>
                      <SelectItem value="totalCandidates">Nombre de candidats</SelectItem>
                      <SelectItem value="averageScore">Score moyen</SelectItem>
                      <SelectItem value="name">Nom du projet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('all');
                      setSortBy('lastActivity');
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun projet trouvé</h3>
                <p className="text-muted-foreground text-center">
                  {search || statusFilter !== 'all' 
                    ? 'Aucun projet ne correspond à vos critères de recherche'
                    : 'Créez votre premier projet pour voir les analytics'
                  }
                </p>
                {!search && statusFilter === 'all' && (
                  <Link href="/projects" className="mt-4">
                    <Button>Créer un projet</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project: ProjectAnalytics) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={project.status === 'active' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {project.status === 'active' ? 'Actif' : 
                         project.status === 'completed' ? 'Terminé' : 'Brouillon'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                        <div className="text-2xl font-bold">{project.totalCandidates}</div>
                        <div className="text-xs text-muted-foreground">Candidats</div>
                      </div>
                      
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <FileText className="w-5 h-5 mx-auto mb-1 text-green-600" />
                        <div className="text-2xl font-bold">{project.analyzedCandidates}</div>
                        <div className="text-xs text-muted-foreground">Analysés</div>
                      </div>
                      
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <BarChart3 className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                        <div className="text-2xl font-bold">
                          {project.averageScore ? Math.round(project.averageScore) : 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Score moyen</div>
                      </div>
                      
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <TrendingUp className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                        <div className="text-2xl font-bold">
                          {project.topCandidateScore ? Math.round(project.topCandidateScore) : 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Meilleur score</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progression des analyses</span>
                        <span className="font-medium">
                          {project.totalCandidates > 0 
                            ? Math.round((project.analyzedCandidates / project.totalCandidates) * 100)
                            : 0
                          }%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${project.totalCandidates > 0 
                              ? (project.analyzedCandidates / project.totalCandidates) * 100
                              : 0
                            }%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="text-xs text-muted-foreground">
                      <div>Dernière activité: {new Date(project.lastActivity).toLocaleDateString('fr-FR')}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/analytics/${project.id}`} className="flex-1">
                        <Button className="w-full" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Voir le rapport
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // TODO: Implement direct export
                          window.open(`/analytics/${project.id}/export`, '_blank');
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}