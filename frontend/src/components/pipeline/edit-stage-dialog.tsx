"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useUpdatePipelineStage, useDeletePipelineStage } from "@/hooks/mutations";
import { PipelineStage } from "@/lib/api-client";
import { Edit, Palette, Trash2 } from "lucide-react";

interface EditStageDialogProps {
  stage: PipelineStage | null;
  isOpen: boolean;
  onClose: () => void;
}

const STAGE_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export function EditStageDialog({ stage, isOpen, onClose }: EditStageDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(STAGE_COLORS[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateStageMutation = useUpdatePipelineStage();
  const deleteStageMutation = useDeletePipelineStage();

  useEffect(() => {
    if (stage) {
      setName(stage.name);
      setDescription(stage.description || "");
      setSelectedColor(stage.color || STAGE_COLORS[0]);
    }
  }, [stage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stage || !name.trim()) return;

    try {
      await updateStageMutation.mutateAsync({
        stageId: stage.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
        },
      });

      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!stage) return;

    try {
      await deleteStageMutation.mutateAsync(stage.id);
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    if (!updateStageMutation.isPending && !deleteStageMutation.isPending) {
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  if (!stage) return null;

  const isLoading = updateStageMutation.isPending || deleteStageMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier l'étape
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de cette étape du pipeline.
          </DialogDescription>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="font-medium text-destructive mb-2">
                Confirmer la suppression
              </h4>
              <p className="text-sm text-muted-foreground">
                Êtes-vous sûr de vouloir supprimer l'étape "{stage.name}" ?
                Cette action ne peut pas être annulée.
              </p>
              {stage.isDefault && (
                <p className="text-sm text-destructive mt-2">
                  ⚠️ Cette étape fait partie du pipeline par défaut.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading || stage.isDefault}
                className="gap-2"
              >
                {deleteStageMutation.isPending && <LoadingSpinner size="sm" />}
                Supprimer
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'étape *</Label>
              <Input
                id="name"
                placeholder="Ex: Entretien final"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Décrivez cette étape du processus..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Couleur
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {STAGE_COLORS.map((color) => (
                  <motion.button
                    key={color}
                    type="button"
                    className="relative w-8 h-8 rounded-full border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    disabled={isLoading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {selectedColor === color && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-white"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2">
              {!stage.isDefault && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                  className="gap-2 mr-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || isLoading}
                className="gap-2"
              >
                {updateStageMutation.isPending && <LoadingSpinner size="sm" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}