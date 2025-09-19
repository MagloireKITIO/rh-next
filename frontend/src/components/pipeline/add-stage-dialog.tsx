"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAddPipelineStage } from "@/hooks/mutations";
import { Plus, Palette } from "lucide-react";

interface AddStageDialogProps {
  pipelineId: string;
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

export function AddStageDialog({ pipelineId, isOpen, onClose }: AddStageDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(STAGE_COLORS[0]);

  const addStageMutation = useAddPipelineStage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      await addStageMutation.mutateAsync({
        pipelineId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
        },
      });

      // Reset form
      setName("");
      setDescription("");
      setSelectedColor(STAGE_COLORS[0]);
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    if (!addStageMutation.isPending) {
      setName("");
      setDescription("");
      setSelectedColor(STAGE_COLORS[0]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter une étape
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle étape pour organiser vos candidats dans le pipeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'étape *</Label>
            <Input
              id="name"
              placeholder="Ex: Entretien final"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={addStageMutation.isPending}
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
              disabled={addStageMutation.isPending}
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
                  disabled={addStageMutation.isPending}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addStageMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || addStageMutation.isPending}
              className="gap-2"
            >
              {addStageMutation.isPending && <LoadingSpinner size="sm" />}
              Ajouter l'étape
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}