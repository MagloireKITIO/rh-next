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
import { Candidate, RankingChange, PaginatedResponse } from "@/lib/api-client";
import { useCandidatesByProject, useCandidatesByProjectLegacy, useRankingChanges } from "@/hooks/queries";
import { useDeleteCandidate } from "@/hooks/mutations";
import { useWebSocketSync } from "@/hooks/useWebSocketSync";
import { useQueryClient } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, RefreshCw, Eye, FileText, Wifi, Trash2 } from "lucide-react";
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
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Choisir le hook approprié selon si la pagination est activée
  const legacyQuery = useCandidatesByProjectLegacy(projectId);
  const paginatedQuery = useCandidatesByProject(projectId, enablePagination ? { page: currentPage, limit: pageSize } : undefined);
  
  const queryToUse = enablePagination ? paginatedQuery : legacyQuery;
  
  // Extraire les données selon le type de réponse avec useMemo pour stabiliser
  const candidates = useMemo(() => {
    if (enablePagination) {
      return (queryToUse.data as PaginatedResponse<Candidate>)?.data || [];
    } else {
      return (queryToUse.data as Candidate[]) || initialCandidates || [];
    }
  }, [queryToUse.data, enablePagination, initialCandidates]);
    
  const paginationInfo = useMemo(() => {
    return enablePagination ? (queryToUse.data as PaginatedResponse<Candidate>) : null;
  }, [queryToUse.data, enablePagination]);
  
  const { data: rankingChanges = [], isLoading: rankingLoading } = useRankingChanges(projectId);
  const deleteCandidateMutation = useDeleteCandidate();
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
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

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedCandidates(new Set(candidates.map(c => c.id)));
    } else {
      setSelectedCandidates(new Set());
    }
  }, [candidates]);

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

  const isAllSelected = candidates.length > 0 && selectedCandidates.size === candidates.length;
  const isIndeterminate = selectedCandidates.size > 0 && selectedCandidates.size < candidates.length;

  const sortedCandidates = [...candidates].sort((a, b) => {
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
        {candidates.length > 0 && (
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
        {enablePagination && paginationInfo && paginationInfo.totalPages > 1 && (
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