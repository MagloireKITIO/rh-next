"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreIndicator, RankingBadge } from "@/components/ui/score-indicator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Candidate, RankingChange, PaginatedResponse } from "@/lib/api-client";
import { useCandidatesByProject, useCandidatesByProjectLegacy, useRankingChanges, useCandidatesWithSearch } from "@/hooks/queries";
import { useDeleteCandidate } from "@/hooks/mutations";
import { useWebSocketSync } from "@/hooks/useWebSocketSync";
import { useQueryClient } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, RefreshCw, Eye, FileText, Wifi, Trash2, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateRankingProps {
  projectId: string;
  candidates?: Candidate[]; // Maintenant optionnel
  onViewCandidate?: (candidate: Candidate) => void;
  onDeleteCandidates?: (candidateIds: string[]) => Promise<void>;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enablePagination?: boolean;
  pageSize?: number;
}

export function CandidateRanking({
  projectId,
  candidates: initialCandidates,
  onViewCandidate,
  onDeleteCandidates,
  autoRefresh = true,
  refreshInterval = 10000, // 10 seconds
  enablePagination = false,
  pageSize = 20
}: CandidateRankingProps) {
  // États de base
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

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

  // Déterminer si on doit utiliser la recherche côté serveur
  const hasActiveFilters = debouncedSearchQuery.trim() !== "" || statusFilter !== "all" || scoreFilter !== "all";
  
  // Hooks de requête
  const legacyQuery = useCandidatesByProjectLegacy(projectId);
  const paginatedQuery = useCandidatesByProject(projectId, enablePagination && !hasActiveFilters ? { page: currentPage, limit: pageSize } : undefined);
  const searchQueryResult = useCandidatesWithSearch(projectId, {
    search: debouncedSearchQuery,
    statusFilter,
    scoreFilter,
    page: currentPage,
    limit: pageSize
  });
  
  // Choisir la requête appropriée
  const queryToUse = hasActiveFilters ? searchQueryResult : (enablePagination ? paginatedQuery : legacyQuery);
  
  // Extraire les données selon le type de réponse avec useMemo pour stabiliser
  const candidates = useMemo(() => {
    if (hasActiveFilters || enablePagination) {
      return (queryToUse.data as PaginatedResponse<Candidate>)?.data || [];
    } else {
      return (queryToUse.data as Candidate[]) || initialCandidates || [];
    }
  }, [queryToUse.data, hasActiveFilters, enablePagination, initialCandidates]);
    
  const paginationInfo = useMemo(() => {
    return (hasActiveFilters || enablePagination) ? (queryToUse.data as PaginatedResponse<Candidate>) : null;
  }, [queryToUse.data, hasActiveFilters, enablePagination]);
  
  const { data: rankingChanges = [], isLoading: rankingLoading } = useRankingChanges(projectId);
  const deleteCandidateMutation = useDeleteCandidate();
  const queryClient = useQueryClient();
  
  const { isConnected } = useWebSocketSync(projectId);
  
  const candidatesLoading = queryToUse.isLoading;

  const refreshData = useCallback(() => {
    // Invalider les queries pour forcer un refetch
    queryClient.invalidateQueries({ queryKey: ['candidates', 'project', projectId] });
    queryClient.invalidateQueries({ queryKey: ['candidates', 'project', projectId, 'rankings'] });
    setLastUpdate(new Date());
  }, [queryClient, projectId]);

  // Pas besoin de useEffect pour lastUpdate, on l'initialise une fois


  const getStatusColor = (status: string) => {
    switch (status) {
      case "analyzed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "error": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getTrendInfo = useCallback((candidateId: string) => {
    return rankingChanges.find(change => change.id === candidateId);
  }, [rankingChanges]);

  const handleSelectCandidate = useCallback((candidateId: string, checked: boolean) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(candidateId);
      } else {
        newSet.delete(candidateId);
      }
      return newSet;
    });
  }, []);

  // Les candidats sont maintenant filtrés côté serveur quand hasActiveFilters est true
  const filteredCandidates = candidates;

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
    } else {
      setSelectedCandidates(new Set());
    }
  }, [filteredCandidates]);

  const handleDeleteSelected = async () => {
    if (selectedCandidates.size === 0) return;
    
    setIsDeleting(true);
    try {
      // Utiliser la mutation pour chaque candidat
      const deletePromises = Array.from(selectedCandidates).map(candidateId =>
        new Promise((resolve, reject) => {
          deleteCandidateMutation.mutate(candidateId, {
            onSuccess: resolve,
            onError: reject
          });
        })
      );
      
      await Promise.all(deletePromises);
      setSelectedCandidates(new Set());
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting candidates:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isAllSelected = filteredCandidates.length > 0 && selectedCandidates.size === filteredCandidates.length;
  const isIndeterminate = selectedCandidates.size > 0 && selectedCandidates.size < filteredCandidates.length;

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    // First by status (analyzed first)
    if (a.status === "analyzed" && b.status !== "analyzed") return -1;
    if (b.status === "analyzed" && a.status !== "analyzed") return 1;
    
    // Then by score (descending)
    return Number(b.score) - Number(a.score);
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Live Candidate Ranking
            {autoRefresh && (
              <Badge 
                variant={isConnected ? "default" : "destructive"} 
                className="text-xs flex items-center gap-1"
              >
                <Wifi className="h-3 w-3" />
                {isConnected ? "Live" : "Offline"}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
            {!isConnected && autoRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={candidatesLoading || rankingLoading}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", (candidatesLoading || rankingLoading) && "animate-spin")} />
                Refresh
              </Button>
            )}
          </div>
        </div>
        
        {/* Recherche et filtres */}
        <div className="pt-4 space-y-4">
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg"
            >
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
            </motion.div>
          )}
          
          {/* Résultats et sélection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {hasActiveFilters && paginationInfo 
                  ? `${paginationInfo.total} résultat${paginationInfo.total > 1 ? 's' : ''}`
                  : `${filteredCandidates.length} candidat${filteredCandidates.length > 1 ? 's' : ''}`
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
        </div>

        {filteredCandidates.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all candidates"
                className={cn(isIndeterminate && "data-[state=checked]:bg-blue-500")}
              />
              <span className="text-sm text-muted-foreground">
                {selectedCandidates.size > 0 
                  ? `${selectedCandidates.size} selected` 
                  : "Select all"
                }
              </span>
            </div>
            {selectedCandidates.size > 0 && onDeleteCandidates && (
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected ({selectedCandidates.size})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure to delete these candidates?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete {selectedCandidates.size} candidate{selectedCandidates.size > 1 ? 's' : ''} and remove their data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                      className="gap-2"
                    >
                      {isDeleting && <LoadingSpinner size="sm" />}
                      Delete {selectedCandidates.size} candidate{selectedCandidates.size > 1 ? 's' : ''}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {sortedCandidates.map((candidate, index) => {
              const trendInfo = getTrendInfo(candidate.id);
              
              return (
                <motion.div
                  key={candidate.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Selection Checkbox */}
                      <Checkbox
                        checked={selectedCandidates.has(candidate.id)}
                        onCheckedChange={(checked) => handleSelectCandidate(candidate.id, checked as boolean)}
                        aria-label={`Select ${candidate.name}`}
                      />
                      
                      {/* Ranking */}
                      <RankingBadge
                        ranking={index + 1}
                        total={sortedCandidates.length}
                        trend={trendInfo?.trend}
                      />
                      
                      {/* Candidate Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{candidate.name}</h3>
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(candidate.status)}
                          >
                            {candidate.status}
                          </Badge>
                        </div>
                        {candidate.email && (
                          <p className="text-sm text-muted-foreground truncate">
                            {candidate.email}
                          </p>
                        )}
                        {candidate.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {candidate.summary}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Score and Actions */}
                    <div className="flex items-center gap-4">
                      {candidate.status === "analyzed" ? (
                        <ScoreIndicator
                          score={Number(candidate.score)}
                          previousScore={Number(candidate.previousScore || 0)}
                          size="lg"
                        />
                      ) : candidate.status === "pending" ? (
                        <LoadingSpinner size="sm" text="Analyzing..." />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {candidate.status === "error" ? "Error" : "N/A"}
                        </span>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {onViewCandidate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewCandidate(candidate)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => window.open(candidate.fileUrl.startsWith('http') ? candidate.fileUrl : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/${candidate.fileUrl}`, '_blank')}
                        >
                          <FileText className="h-3 w-3" />
                          CV
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Trend Animation */}
                  {trendInfo && trendInfo.trend !== "stable" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="mt-2 flex items-center gap-2"
                    >
                      <div className={cn(
                        "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                        trendInfo.trend === "up" 
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      )}>
                        {trendInfo.trend === "up" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {trendInfo.trend === "up" ? "+" : ""}
                          {trendInfo.scoreDiff.toFixed(1)} points
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {sortedCandidates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No candidates found</p>
              <p className="text-sm">Upload some CVs to get started</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {(enablePagination || hasActiveFilters) && paginationInfo && paginationInfo.totalPages > 1 && (
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
      </CardContent>
    </Card>
  );
}

// Composant pour les statistiques de ranking
interface RankingStatsProps {
  candidates: Candidate[];
  className?: string;
}

export function RankingStats({ candidates, className }: RankingStatsProps) {
  const analyzedCandidates = candidates.filter(c => c.status === "analyzed");
  const averageScore = analyzedCandidates.length > 0
    ? analyzedCandidates.reduce((sum, c) => sum + Number(c.score), 0) / analyzedCandidates.length
    : 0;
  
  const topScore = analyzedCandidates.length > 0
    ? Math.max(...analyzedCandidates.map(c => Number(c.score)))
    : 0;
    
  const scoreDistribution = {
    excellent: analyzedCandidates.filter(c => Number(c.score) >= 80).length,
    good: analyzedCandidates.filter(c => Number(c.score) >= 60 && Number(c.score) < 80).length,
    average: analyzedCandidates.filter(c => Number(c.score) >= 40 && Number(c.score) < 60).length,
    poor: analyzedCandidates.filter(c => Number(c.score) < 40).length,
  };

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{analyzedCandidates.length}</div>
          <p className="text-xs text-muted-foreground">Analyzed</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{averageScore.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">Avg Score</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{topScore.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">Top Score</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {scoreDistribution.excellent}
          </div>
          <p className="text-xs text-muted-foreground">Excellent (80+)</p>
        </CardContent>
      </Card>
    </div>
  );
}