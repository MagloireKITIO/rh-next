'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/components/layout/admin-layout';
import ProtectedRoute from '@/components/layout/protected-route';
import { 
  ArrowLeft,
  Download,
  Calendar,
  Users,
  BarChart3,
  TrendingUp,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';


export default function ProjectReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'overview';
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.replace(url.pathname + url.search, { scroll: false });
  };
  
  const [periodFilter, setPeriodFilter] = useState('all');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['admin', 'analytics', 'project', projectId, periodFilter],
    queryFn: () => adminApi.getProjectReport(projectId, { period: periodFilter }),
  });

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportProjectReport(projectId, {
        format: exportFormat,
        period: periodFilter,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${report?.project.name}-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
              <p className="text-muted-foreground">Génération du rapport...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (error || !report) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="min-h-screen flex items-center justify-center bg-background">
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Erreur de chargement</h3>
                <p className="text-muted-foreground mb-4">
                  Impossible de charger le rapport pour ce projet
                </p>
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </CardContent>
            </Card>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const { project, metrics, scoreDistribution, timeline, topCandidates, skillsAnalysis, hrRecommendations, risks, insights } = report;

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-muted-foreground">{project.companyName}</p>
              </div>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>

            {/* Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Période:</span>
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toute la période</SelectItem>
                        <SelectItem value="30">30 derniers jours</SelectItem>
                        <SelectItem value="90">3 derniers mois</SelectItem>
                        <SelectItem value="180">6 derniers mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm font-medium">Export:</span>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Candidats</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalCandidates}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.analyzedCandidates} analysés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(metrics.averageScore)}</div>
                <p className="text-xs text-muted-foreground">
                  sur 100
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meilleur Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(metrics.topScore)}</div>
                <p className="text-xs text-green-600">
                  Candidat star
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(metrics.conversionRate)}%</div>
                <p className="text-xs text-muted-foreground">
                  Analysés / Total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
              <TabsTrigger value="candidates">Top Candidats</TabsTrigger>
              <TabsTrigger value="skills">Compétences</TabsTrigger>
              <TabsTrigger value="decisions">Décisions RH</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution des Scores</CardTitle>
                    <CardDescription>Répartition des candidats par niveau</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-sm">Excellent (80-100)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{scoreDistribution.excellent}</span>
                          <div className="w-20 h-2 bg-muted rounded-full">
                            <div 
                              className="h-2 bg-green-500 rounded-full"
                              style={{ width: `${(scoreDistribution.excellent / metrics.totalCandidates) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-sm">Bon (60-79)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{scoreDistribution.good}</span>
                          <div className="w-20 h-2 bg-muted rounded-full">
                            <div 
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${(scoreDistribution.good / metrics.totalCandidates) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded"></div>
                          <span className="text-sm">Moyen (40-59)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{scoreDistribution.average}</span>
                          <div className="w-20 h-2 bg-muted rounded-full">
                            <div 
                              className="h-2 bg-orange-500 rounded-full"
                              style={{ width: `${(scoreDistribution.average / metrics.totalCandidates) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span className="text-sm">Faible (0-39)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{scoreDistribution.poor}</span>
                          <div className="w-20 h-2 bg-muted rounded-full">
                            <div 
                              className="h-2 bg-red-500 rounded-full"
                              style={{ width: `${(scoreDistribution.poor / metrics.totalCandidates) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution Temporelle</CardTitle>
                    <CardDescription>Candidatures et analyses dans le temps</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {timeline.slice(-5).map((point, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{new Date(point.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600">+{point.candidatesAdded} candidats</span>
                            <span className="text-blue-600">{point.candidatesAnalyzed} analysés</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="candidates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Candidats</CardTitle>
                  <CardDescription>Les candidats les mieux notés de ce projet</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCandidates.map((candidate, index) => (
                      <div key={candidate.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full font-bold text-sm">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{candidate.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-sm">
                                Score: {Math.round(candidate.score)}
                              </Badge>
                              {candidate.hrDecision && (
                                <Badge 
                                  variant={
                                    candidate.hrDecision.recommendation === 'RECRUTER' ? 'default' : 
                                    candidate.hrDecision.recommendation === 'ENTRETIEN' ? 'secondary' : 'destructive'
                                  }
                                >
                                  {candidate.hrDecision.recommendation}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {candidate.summary}
                          </p>
                          
                          {candidate.hrDecision && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className={`px-2 py-1 rounded ${
                                candidate.hrDecision.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                candidate.hrDecision.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {candidate.hrDecision.priority} PRIORITY
                              </span>
                              <span className="text-muted-foreground">
                                Confiance: {Math.round(candidate.hrDecision.confidence)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analyse des Compétences</CardTitle>
                  <CardDescription>Correspondance moyenne des candidats avec les exigences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Compétences Techniques</span>
                          <span className="text-sm text-muted-foreground">{Math.round(skillsAnalysis.technical)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${skillsAnalysis.technical}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Expérience</span>
                          <span className="text-sm text-muted-foreground">{Math.round(skillsAnalysis.experience)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div 
                            className="bg-green-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${skillsAnalysis.experience}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Fit Culturel</span>
                          <span className="text-sm text-muted-foreground">{Math.round(skillsAnalysis.cultural)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div 
                            className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${skillsAnalysis.cultural}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Score Global</span>
                          <span className="text-sm text-muted-foreground">{Math.round(skillsAnalysis.overall)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div 
                            className="bg-primary h-3 rounded-full transition-all duration-300"
                            style={{ width: `${skillsAnalysis.overall}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decisions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">À Recruter</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{hrRecommendations.recruit}</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.totalCandidates > 0 ? Math.round((hrRecommendations.recruit / metrics.totalCandidates) * 100) : 0}% du total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Entretien</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{hrRecommendations.interview}</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.totalCandidates > 0 ? Math.round((hrRecommendations.interview / metrics.totalCandidates) * 100) : 0}% du total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">À Rejeter</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{hrRecommendations.reject}</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.totalCandidates > 0 ? Math.round((hrRecommendations.reject / metrics.totalCandidates) * 100) : 0}% du total
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition des Décisions RH</CardTitle>
                  <CardDescription>Distribution des recommandations IA pour ce projet</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-muted rounded-full h-4 flex overflow-hidden">
                        <div 
                          className="bg-green-600 transition-all duration-300"
                          style={{ width: `${(hrRecommendations.recruit / (hrRecommendations.recruit + hrRecommendations.interview + hrRecommendations.reject)) * 100}%` }}
                        />
                        <div 
                          className="bg-orange-600 transition-all duration-300"
                          style={{ width: `${(hrRecommendations.interview / (hrRecommendations.recruit + hrRecommendations.interview + hrRecommendations.reject)) * 100}%` }}
                        />
                        <div 
                          className="bg-red-600 transition-all duration-300"
                          style={{ width: `${(hrRecommendations.reject / (hrRecommendations.recruit + hrRecommendations.interview + hrRecommendations.reject)) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-600 rounded"></div>
                        <span>Recruter ({Math.round((hrRecommendations.recruit / (hrRecommendations.recruit + hrRecommendations.interview + hrRecommendations.reject)) * 100)}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-600 rounded"></div>
                        <span>Entretien ({Math.round((hrRecommendations.interview / (hrRecommendations.recruit + hrRecommendations.interview + hrRecommendations.reject)) * 100)}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-600 rounded"></div>
                        <span>Rejeter ({Math.round((hrRecommendations.reject / (hrRecommendations.recruit + hrRecommendations.interview + hrRecommendations.reject)) * 100)}%)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Insights &amp; Recommandations
                    </CardTitle>
                    <CardDescription>Points clés identifiés par l&apos;IA</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {insights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Risques Identifiés
                    </CardTitle>
                    <CardDescription>Points d&apos;attention pour ce projet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {risks.map((risk, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}