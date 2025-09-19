"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { usePipelinesByProject } from "@/hooks/queries";
import { useMoveCandidate } from "@/hooks/mutations";
import { CandidateWithPipelineStatus } from "@/lib/api-client";
import { MoveRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoveCandidatesDialogProps {
  projectId: string;
  candidates: CandidateWithPipelineStatus[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MoveCandidatesDialog({
  projectId,
  candidates,
  isOpen,
  onClose,
  onSuccess,
}: MoveCandidatesDialogProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: pipelines = [], isLoading: pipelinesLoading } = usePipelinesByProject(projectId);
  const moveCandidateMutation = useMoveCandidate();

  const mainPipeline = pipelines.length > 0 ? pipelines[0] : null;
  const stages = mainPipeline?.stages || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStageId || candidates.length === 0) return;

    try {
      // Déplacer tous les candidats sélectionnés
      for (const candidate of candidates) {
        await moveCandidateMutation.mutateAsync({
          candidateId: candidate.id,
          stageId: selectedStageId,
          notes: notes.trim() || `Déplacé en lot (${candidates.length} candidats)`,
        });
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    if (!moveCandidateMutation.isPending) {
      setSelectedStageId("");
      setNotes("");
      onClose();
    }
  };

  const selectedStage = stages.find(stage => stage.id === selectedStageId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoveRight className="h-5 w-5" />
            Déplacer les candidats
          </DialogTitle>
          <DialogDescription>
            Sélectionnez l'étape de destination pour {candidates.length} candidat{candidates.length > 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Candidats sélectionnés */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Candidats sélectionnés ({candidates.length})
            </Label>
            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-muted/30 rounded-lg">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between text-sm p-2 bg-background rounded border"
                >
                  <span className="truncate">{candidate.name}</span>
                  {candidate.email && (
                    <span className="text-xs text-muted-foreground ml-2 truncate">
                      {candidate.email}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sélection d'étape */}
          <div className="space-y-2">
            <Label>Étape de destination *</Label>
            {pipelinesLoading ? (
              <div className="flex items-center justify-center p-4">
                <LoadingSpinner size="sm" text="Chargement des étapes..." />
              </div>
            ) : stages.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                <p>Aucune étape disponible</p>
                <p className="text-xs mt-1">Le pipeline est en cours de création</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {stages
                  .sort((a, b) => a.order - b.order)
                  .map((stage) => (
                    <motion.button
                      key={stage.id}
                      type="button"
                      className={cn(
                        "relative p-3 rounded-lg border-2 transition-all text-left",
                        selectedStageId === stage.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedStageId(stage.id)}
                      disabled={moveCandidateMutation.isPending}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: stage.color || '#3b82f6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{stage.name}</h4>
                          {stage.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {stage.description}
                            </p>
                          )}
                        </div>
                        {stage.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Défaut
                          </Badge>
                        )}
                      </div>
                    </motion.button>
                  ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajouter une note pour ce déplacement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={moveCandidateMutation.isPending}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={moveCandidateMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!selectedStageId || candidates.length === 0 || moveCandidateMutation.isPending}
              className="gap-2"
            >
              {moveCandidateMutation.isPending && <LoadingSpinner size="sm" />}
              Déplacer {candidates.length} candidat{candidates.length > 1 ? 's' : ''}
              {selectedStage && (
                <>
                  {" → "}
                  <span className="font-medium">{selectedStage.name}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}