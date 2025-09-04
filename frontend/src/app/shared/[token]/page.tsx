'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ScoreIndicator } from '@/components/ui/score-indicator';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, User, Calendar, Building, Users, Eye, Download, Mail, Phone, FileText, TrendingUp, Search, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { publicApi, PaginatedResponse } from '@/lib/api-client';
import { useSharedProjectCandidates } from '@/hooks/queries/useCandidates';

interface Candidate {
  id: string;
  name: string;
  score: number;
  summary: string;
  status: string;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
  extractedText?: string;
  extractedData?: {
    name: string;
    email?: string;
    phone?: string;
    experience?: string;
    skills?: string[];
    education?: string;
  };
  analyses?: Analysis[];
}

interface Analysis {
  id: string;
  aiResponse: string;
  analysisData: {
    score: number;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
  };
  score: number;
  summary?: string;
  candidateId: string;
  createdAt: string;
}

interface SharedProject {
  id: string;
  name: string;
  jobDescription: string;
  status: string;
  createdAt: string;
  candidates: Candidate[];
  analyses: Analysis[];
  company: {
    id: string;
    name: string;
  };
}

export default function SharedProjectPage() {
  const { token } = useParams();
  const [project, setProject] = useState<SharedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinFormData, setJoinFormData] = useState({
    requester_name: '',
    requester_email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateDetail, setShowCandidateDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce pour la recherche (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Réinitialiser la page quand on change les filtres
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, scoreFilter]);

  useEffect(() => {
    const fetchSharedProject = async () => {
      try {
        const response = await publicApi.getSharedProject(token);
        // On garde seulement les infos du projet, pas les candidats
        setProject({
          ...response.data,
          candidates: [] // Les candidats seront chargés séparément
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Projet non trouvé ou lien expiré');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedProject();
  }, [token]);

  // Hook pour charger les candidats avec recherche et pagination
  const candidatesQuery = useSharedProjectCandidates(token, {
    search: debouncedSearchQuery,
    statusFilter,
    scoreFilter,
    page: currentPage,
    limit: 20
  });

  const requestToJoinTeam = () => {
    setShowJoinDialog(true);
  };

  const viewCandidateDetail = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateDetail(true);
  };

  const downloadCV = async (candidate: Candidate) => {
    console.log('🔽 [DOWNLOAD] Attempting to download CV for candidate:', candidate);
    console.log('🔽 [DOWNLOAD] fileUrl:', candidate.fileUrl);
    console.log('🔽 [DOWNLOAD] fileName:', candidate.fileName);
    
    if (candidate.fileUrl && candidate.fileName) {
      try {
        const finalUrl = candidate.fileUrl.startsWith('http') 
          ? candidate.fileUrl 
          : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/${candidate.fileUrl}`;
        
        console.log('🔽 [DOWNLOAD] Final URL:', finalUrl);
        
        // Méthode 1: Essayer fetch avec blob pour télécharger le fichier
        try {
          const response = await fetch(finalUrl);
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = candidate.fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            
            console.log('🔽 [DOWNLOAD] Downloading via blob...');
            link.click();
            
            // Nettoyer
            setTimeout(() => {
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              console.log('🔽 [DOWNLOAD] Blob download cleaned up');
            }, 1000);
            
            toast.success('Téléchargement du CV lancé');
            return;
          } else {
            console.log('🔽 [DOWNLOAD] Fetch failed with status:', response.status);
          }
        } catch (fetchError) {
          console.log('🔽 [DOWNLOAD] Fetch method failed, trying direct link:', fetchError);
        }
        
        // Méthode 2: Fallback avec lien direct (pour les URLs publiques Supabase)
        const link = document.createElement('a');
        link.href = finalUrl;
        link.download = candidate.fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        
        console.log('🔽 [DOWNLOAD] Trying direct link download...');
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          console.log('🔽 [DOWNLOAD] Direct link cleaned up');
        }, 1000);
        
        toast.success('Téléchargement du CV lancé');
      } catch (error) {
        console.error('🔽 [DOWNLOAD] Error downloading CV:', error);
        toast.error('Erreur lors du téléchargement du CV');
      }
    } else {
      console.log('🔽 [DOWNLOAD] Missing fileUrl or fileName');
      toast.error('CV non disponible pour le téléchargement');
    }
  };

  const openCV = (candidate: Candidate) => {
    console.log('👁️ [VIEW] Attempting to open CV for candidate:', candidate);
    console.log('👁️ [VIEW] fileUrl:', candidate.fileUrl);
    
    if (candidate.fileUrl) {
      try {
        const finalUrl = candidate.fileUrl.startsWith('http') 
          ? candidate.fileUrl 
          : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/${candidate.fileUrl}`;
        
        console.log('👁️ [VIEW] Final URL:', finalUrl);
        
        // Créer un lien temporaire avec les bonnes propriétés
        const link = document.createElement('a');
        link.href = finalUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        
        // Ajouter au DOM temporairement
        document.body.appendChild(link);
        
        // Déclencher l'ouverture
        link.click();
        
        // Nettoyer
        setTimeout(() => {
          document.body.removeChild(link);
          console.log('👁️ [VIEW] Link cleaned up');
        }, 100);
        
        toast.success('CV ouvert dans un nouvel onglet');
      } catch (error) {
        console.error('👁️ [VIEW] Error opening CV:', error);
        toast.error('Erreur lors de l\'ouverture du CV');
      }
    } else {
      console.log('👁️ [VIEW] Missing fileUrl');
      toast.error('CV non disponible pour la visualisation');
    }
  };

  const handleJoinSubmit = async () => {
    if (!joinFormData.requester_name || !joinFormData.requester_email) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    setIsSubmitting(true);
    try {
      await publicApi.submitTeamRequest({
        ...joinFormData,
        project_share_token: token,
      });

      // Rediriger vers la page de confirmation
      const companyName = encodeURIComponent(project?.company.name || '');
      window.location.href = `/team-request-submitted?company=${companyName}`;
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-destructive mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // Récupérer les candidats depuis le nouveau hook (déjà filtrés et triés côté serveur)
  const candidatesData = candidatesQuery.data;
  const sortedCandidates = candidatesData?.data || [];
  const paginationInfo = candidatesData;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Building className="w-4 h-4" />
                {project.company.name}
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{project.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {project.candidates.length} candidat{project.candidates.length > 1 ? 's' : ''}
                </div>
              </div>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <Button onClick={requestToJoinTeam}>
              <Users className="w-4 h-4 mr-2" />
              Demander à rejoindre l'équipe
            </Button>
          </div>
        </Card>

        {/* Job Description */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Description du poste</h2>
          <p className="text-foreground whitespace-pre-wrap">{project.jobDescription}</p>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{project.candidates.length}</div>
            <div className="text-sm text-muted-foreground">Candidats total</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {project.candidates.filter(c => c.status === 'analyzed').length}
            </div>
            <div className="text-sm text-muted-foreground">Analysés</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {project.candidates.filter(c => c.status !== 'analyzed').length}
            </div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(() => {
                if (project.candidates.length === 0) return '0';
                const validScores = project.candidates.filter(c => c.score && !isNaN(c.score));
                if (validScores.length === 0) return '0';
                const average = validScores.reduce((sum, c) => sum + c.score, 0) / validScores.length;
                return Math.round(average * 100) / 100;
              })()}
            </div>
            <div className="text-sm text-muted-foreground">Score moyen</div>
          </Card>
        </div>

        {/* Candidates List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Classement des candidats</h2>
          </div>
          
          {/* Recherche et filtres */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Barre de recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email ou résumé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Bouton pour afficher/masquer les filtres */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtres
                {(statusFilter !== "all" || scoreFilter !== "all") && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {(statusFilter !== "all" ? 1 : 0) + (scoreFilter !== "all" ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>
            
            {/* Filtres détaillés */}
            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Statut</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="analyzed">Analysé</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="error">Erreur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Score</label>
                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les scores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les scores</SelectItem>
                      <SelectItem value="excellent">Excellent (80+)</SelectItem>
                      <SelectItem value="good">Bon (60-79)</SelectItem>
                      <SelectItem value="average">Moyen (40-59)</SelectItem>
                      <SelectItem value="poor">Faible (&lt;40)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Bouton pour réinitialiser les filtres */}
                {(statusFilter !== "all" || scoreFilter !== "all") && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("all");
                        setScoreFilter("all");
                      }}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Réinitialiser
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Résultats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {paginationInfo
                  ? `${paginationInfo.total} résultat${paginationInfo.total > 1 ? 's' : ''} trouvé${paginationInfo.total > 1 ? 's' : ''}`
                  : `${sortedCandidates.length} candidat${sortedCandidates.length > 1 ? 's' : ''}`
                }
              </span>
              {(searchQuery || statusFilter !== "all" || scoreFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setScoreFilter("all");
                    setShowFilters(false);
                  }}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  Effacer tous les filtres
                </Button>
              )}
            </div>
          </div>
          {candidatesQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2">Chargement des candidats...</span>
            </div>
          ) : sortedCandidates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {(debouncedSearchQuery || statusFilter !== "all" || scoreFilter !== "all")
                ? "Aucun candidat ne correspond aux critères de recherche"
                : "Aucun candidat pour ce projet"
              }
            </p>
          ) : (
            <div className="space-y-4">
              {sortedCandidates.map((candidate, index) => (
                <div key={candidate.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{candidate.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{candidate.summary}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={candidate.status === 'analyzed' ? 'default' : 'secondary'}>
                        {candidate.status === 'analyzed' ? 'Analysé' : 'En attente'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(candidate.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreIndicator score={candidate.score} />
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => viewCandidateDetail(candidate)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Détail
                      </Button>
                      {candidate.fileUrl && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadCV(candidate)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          CV
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {paginationInfo && paginationInfo.totalPages > 1 && (
            <div className="mt-6 border-t pt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={paginationInfo.totalPages}
                onPageChange={setCurrentPage}
                showInfo={true}
                totalItems={paginationInfo.total}
                itemsPerPage={paginationInfo.limit}
              />
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center text-muted-foreground text-sm mt-8 p-4">
          <p>Cette page est en lecture seule. Pour accéder aux fonctionnalités complètes, demandez à rejoindre l'équipe.</p>
        </div>
      </div>

      {/* Join Team Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander à rejoindre l'équipe</DialogTitle>
            <DialogDescription>
              Envoyez une demande pour rejoindre l'équipe de {project?.company.name}.
              <br />
              <strong>Processus :</strong> Un administrateur examinera votre demande. Si elle est approuvée, 
              vous recevrez un email d'invitation avec un lien pour créer votre compte et accéder à la plateforme.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                value={joinFormData.requester_name}
                onChange={(e) => setJoinFormData(prev => ({ ...prev, requester_name: e.target.value }))}
                placeholder="Votre nom complet"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={joinFormData.requester_email}
                onChange={(e) => setJoinFormData(prev => ({ ...prev, requester_email: e.target.value }))}
                placeholder="votre.email@example.com"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea
                id="message"
                value={joinFormData.message}
                onChange={(e) => setJoinFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Présentez-vous et expliquez pourquoi vous souhaitez rejoindre l'équipe..."
                disabled={isSubmitting}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowJoinDialog(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleJoinSubmit}
              disabled={isSubmitting || !joinFormData.requester_name || !joinFormData.requester_email}
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate Detail Dialog */}
      <Dialog open={showCandidateDetail} onOpenChange={setShowCandidateDetail}>
        <DialogContent className="!max-w-6xl !w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedCandidate?.name}
            </DialogTitle>
            <DialogDescription>
              Détail du candidat et analyse complète
            </DialogDescription>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Score Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Analysis Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <ScoreIndicator score={selectedCandidate.score} size="lg" />
                      <div>
                        <p className="text-2xl font-bold">{selectedCandidate.score}/100</p>
                        <Badge variant={selectedCandidate.status === 'analyzed' ? 'default' : 'secondary'}>
                          {selectedCandidate.status === 'analyzed' ? 'Analyzed' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                    {selectedCandidate.summary && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm">{selectedCandidate.summary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Analysis Details */}
                {(() => {
                  // Debug: afficher les données disponibles
                  console.log('Candidate data:', selectedCandidate);
                  console.log('Analyses:', selectedCandidate.analyses);
                  
                  // Si pas d'analyses dans l'objet candidat, essayons de chercher dans le projet
                  const candidateAnalysis = project?.analyses?.find(a => a.candidateId === selectedCandidate.id);
                  console.log('Candidate analysis from project:', candidateAnalysis);
                  
                  // Utiliser l'analyse trouvée ou celle du candidat
                  const latestAnalysis = selectedCandidate.analyses?.[0] || candidateAnalysis;
                  
                  if (!latestAnalysis) {
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle>Detailed Analysis</CardTitle>
                          <CardDescription>No analysis available</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-4 text-muted-foreground">
                            <p>No detailed analysis available for this candidate.</p>
                            <p className="text-sm mt-2">The candidate might have been analyzed but details are not yet available.</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Essayer d'extraire les données d'analyse de différentes sources
                  let analysisData = latestAnalysis.analysisData;
                  
                  // Si pas d'analysisData, essayer de parser depuis aiResponse
                  if (!analysisData && latestAnalysis.aiResponse) {
                    try {
                      // Tenter de parser le JSON depuis la réponse AI
                      const jsonMatch = latestAnalysis.aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
                      if (jsonMatch) {
                        analysisData = JSON.parse(jsonMatch[1]);
                      }
                    } catch (e) {
                      console.log('Could not parse AI response as JSON');
                    }
                  }

                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle>Detailed Analysis</CardTitle>
                        <CardDescription>
                          Latest analysis from {new Date(latestAnalysis.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysisData?.strengths && analysisData.strengths.length > 0 && (
                          <div>
                            <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {analysisData.strengths.map((strength, index) => (
                                <li key={index}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysisData?.weaknesses && analysisData.weaknesses.length > 0 && (
                          <div>
                            <h4 className="font-medium text-orange-600 mb-2">Areas for Improvement</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {analysisData.weaknesses.map((weakness, index) => (
                                <li key={index}>{weakness}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysisData?.recommendations && analysisData.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-blue-600 mb-2">Recommendations</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {analysisData.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Si aucune donnée structurée, afficher la réponse brute */}
                        {!analysisData?.strengths && !analysisData?.weaknesses && !analysisData?.recommendations && latestAnalysis.aiResponse && (
                          <div>
                            <h4 className="font-medium mb-2">Complete Analysis</h4>
                            <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                              {latestAnalysis.aiResponse}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCandidate.name}</span>
                    </div>
                    
                    {selectedCandidate.extractedData?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedCandidate.extractedData.email}</span>
                      </div>
                    )}
                    
                    {selectedCandidate.extractedData?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedCandidate.extractedData.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Added {new Date(selectedCandidate.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCandidate.fileUrl ? (
                      <>
                        <Button 
                          onClick={() => {
                            console.log('🔥 [MODAL] Download button clicked');
                            downloadCV(selectedCandidate);
                          }}
                          className="w-full gap-2"
                          variant="outline"
                        >
                          <Download className="h-4 w-4" />
                          Download CV
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            console.log('🔥 [MODAL] View button clicked');
                            openCV(selectedCandidate);
                          }}
                          className="w-full gap-2"
                          variant="outline"
                        >
                          <FileText className="h-4 w-4" />
                          View PDF
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">CV files not available for this candidate.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* File Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>File Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedCandidate.fileName && (
                      <div>
                        <p className="text-sm font-medium">Original filename</p>
                        <p className="text-sm text-muted-foreground">{selectedCandidate.fileName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">Upload date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedCandidate.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}