"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Save } from "lucide-react";
import { useAIConfiguration } from "@/hooks/queries";
import { useSetConfigurationValue } from "@/hooks/mutations";
import { useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";

export function AIConfigurationSection() {
  const { data: aiConfig, isLoading: aiConfigLoading } = useAIConfiguration();
  const setConfigMutation = useSetConfigurationValue();
  const queryClient = useQueryClient();
  
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    defaultPrompt: ""
  });

  useEffect(() => {
    if (aiConfig) {
      setSettings({
        defaultPrompt: aiConfig.defaultPrompt || ""
      });
    }
  }, [aiConfig]);

  const handleReset = () => {
    queryClient.invalidateQueries({ queryKey: ['configuration'] });
    
    if (aiConfig) {
      setSettings({
        defaultPrompt: aiConfig.defaultPrompt || ""
      });
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    let saveCount = 0;
    let totalSaves = 0;
    
    if (settings.defaultPrompt.trim()) totalSaves++;
    
    const checkCompletion = () => {
      saveCount++;
      if (saveCount >= totalSaves) {
        setIsSaving(false);
        toast.success("Configuration IA sauvegardée !");
      }
    };

    if (settings.defaultPrompt.trim()) {
      setConfigMutation.mutate(
        {
          key: "DEFAULT_AI_PROMPT",
          value: settings.defaultPrompt.trim(),
          description: "Default prompt for AI analysis of CVs"
        },
        {
          onSuccess: checkCompletion,
          onError: () => {
            setIsSaving(false);
            toast.error("Erreur lors de la sauvegarde du prompt");
          }
        }
      );
    }
    
    if (totalSaves === 0) {
      setIsSaving(false);
      toast.info("Aucune modification à sauvegarder");
    }
  };

  if (aiConfigLoading) {
    return <LoadingSpinner size="md" text="Chargement de la configuration IA..." />;
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
        <div>
          <Label className="text-sm font-medium">Statut IA</Label>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default">Actif</Badge>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Prompt par défaut</Label>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={aiConfig?.hasDefaultPrompt ? "default" : "secondary"}>
              {aiConfig?.hasDefaultPrompt ? "Configuré" : "Par défaut"}
            </Badge>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Fournisseur</Label>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">Together AI</Badge>
          </div>
        </div>
      </div>

      {/* Default Prompt */}
      <div className="space-y-2">
        <Label htmlFor="defaultPrompt">Prompt IA par défaut</Label>
        <Textarea
          id="defaultPrompt"
          value={settings.defaultPrompt}
          onChange={(e) => setSettings(prev => ({ ...prev, defaultPrompt: e.target.value }))}
          placeholder="Saisissez votre prompt par défaut pour l'analyse des CV..."
          rows={12}
        />
        <p className="text-sm text-muted-foreground">
          Ce prompt sera utilisé par défaut pour toutes les analyses de CV sauf remplacement dans les paramètres de projet
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <LoadingSpinner size="sm" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Sauvegarder
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isSaving}
        >
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}