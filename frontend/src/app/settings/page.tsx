"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { NavBar } from "@/components/ui/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAIConfiguration } from "@/hooks/queries";
import { useSetConfigurationValue } from "@/hooks/mutations";
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Settings, Brain, Users, UserPlus, Shield, Crown, Mail, RefreshCcw, UserCheck } from "lucide-react";
import { TeamRequestsModal } from "@/components/modals/team-requests-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { user: currentUser, loading, isAdmin } = useAuth();
  const isUserAdmin = isAdmin(); // Appeler la fonction
  const isHR = currentUser?.role === 'hr';
  const canManageUsers = isUserAdmin; // Seuls les admins peuvent gérer les utilisateurs
  const canViewUsers = isUserAdmin || isHR; // Admins et HR peuvent voir les utilisateurs
  
  // TanStack Query hooks
  const { data: aiConfig, isLoading: aiConfigLoading } = useAIConfiguration();
  const setConfigMutation = useSetConfigurationValue();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/auth/login");
    }
  }, [currentUser, loading, router]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    aiModel: '',
    temperature: 0.7,
    maxTokens: 4000,
    customPrompt: ''
  });

  // Charger la configuration AI au début
  useEffect(() => {
    if (aiConfig?.data) {
      setSettings(prev => ({
        ...prev,
        aiModel: aiConfig.data.ai_model || 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        temperature: parseFloat(aiConfig.data.temperature) || 0.7,
        maxTokens: parseInt(aiConfig.data.max_tokens) || 4000,
        customPrompt: aiConfig.data.custom_prompt || ''
      }));
    }
  }, [aiConfig]);

  // États pour les modals
  const [isTeamRequestsModalOpen, setIsTeamRequestsModalOpen] = useState(false);

  // Sauvegarder les paramètres AI
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setConfigMutation.mutateAsync({
        key: 'ai_model',
        value: settings.aiModel
      });
      await setConfigMutation.mutateAsync({
        key: 'temperature',
        value: settings.temperature.toString()
      });
      await setConfigMutation.mutateAsync({
        key: 'max_tokens',
        value: settings.maxTokens.toString()
      });
      await setConfigMutation.mutateAsync({
        key: 'custom_prompt',
        value: settings.customPrompt
      });
      
      toast.success("Configuration sauvegardée avec succès");
      queryClient.invalidateQueries({ queryKey: ['ai-configuration'] });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error("Erreur lors de la sauvegarde de la configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || aiConfigLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configurez votre environnement de travail et gérez votre équipe
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration principale */}
          <motion.div 
            className="lg:col-span-2 space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Configuration AI */}
            <Card className="shadow-lg border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Configuration IA</CardTitle>
                    <CardDescription>
                      Configurez le modèle d'intelligence artificielle et ses paramètres
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Modèle AI */}
                  <div className="space-y-2">
                    <Label htmlFor="ai-model" className="text-sm font-medium">
                      Modèle IA
                    </Label>
                    <Select value={settings.aiModel} onValueChange={(value) => setSettings(prev => ({ ...prev, aiModel: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un modèle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo">Llama 3.1 70B Instruct Turbo</SelectItem>
                        <SelectItem value="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo">Llama 3.1 8B Instruct Turbo</SelectItem>
                        <SelectItem value="meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo">Llama 3.2 90B Vision Instruct Turbo</SelectItem>
                        <SelectItem value="meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo">Llama 3.2 11B Vision Instruct Turbo</SelectItem>
                        <SelectItem value="Qwen/Qwen2.5-72B-Instruct-Turbo">Qwen 2.5 72B Instruct Turbo</SelectItem>
                        <SelectItem value="microsoft/WizardLM-2-8x22B">WizardLM 2 8x22B</SelectItem>
                        <SelectItem value="NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO">Nous Hermes 2 Mixtral 8x7B DPO</SelectItem>
                        <SelectItem value="mistralai/Mixtral-8x7B-Instruct-v0.1">Mixtral 8x7B Instruct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Température */}
                  <div className="space-y-2">
                    <Label htmlFor="temperature" className="text-sm font-medium">
                      Température: {settings.temperature}
                    </Label>
                    <input
                      type="range"
                      id="temperature"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Conservative</span>
                      <span>Créatif</span>
                    </div>
                  </div>

                  {/* Max Tokens */}
                  <div className="space-y-2">
                    <Label htmlFor="max-tokens" className="text-sm font-medium">
                      Tokens Maximum: {settings.maxTokens}
                    </Label>
                    <input
                      type="range"
                      id="max-tokens"
                      min="1000"
                      max="8000"
                      step="100"
                      value={settings.maxTokens}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1k</span>
                      <span>8k</span>
                    </div>
                  </div>
                </div>

                {/* Prompt personnalisé */}
                <div className="space-y-2">
                  <Label htmlFor="custom-prompt" className="text-sm font-medium">
                    Prompt Personnalisé (Optionnel)
                  </Label>
                  <Textarea
                    id="custom-prompt"
                    placeholder="Ajoutez des instructions personnalisées pour l'IA..."
                    value={settings.customPrompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, customPrompt: e.target.value }))}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500">
                    Ce prompt sera ajouté aux analyses. Utilisez-le pour personnaliser le style d'évaluation.
                  </p>
                </div>

                {/* Bouton de sauvegarde */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={isSaving || setConfigMutation.isPending}
                    className="px-6"
                  >
                    {isSaving || setConfigMutation.isPending ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Message informatif pour les clés API */}
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Gestion des Clés API
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      La gestion des clés API a été déplacée vers l'interface d'administration. 
                      Contactez votre administrateur système pour la configuration des clés API.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Panneau latéral - Gestion d'équipe */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Gestion d'équipe */}
            {canViewUsers && (
              <Card className="shadow-lg border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Gestion d'Équipe</CardTitle>
                      <CardDescription className="text-sm">
                        Invitez et gérez votre équipe
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="font-medium text-sm">{currentUser?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{currentUser?.role?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    >
                      <UserCheck className="w-3 h-3 mr-1" />
                      Vous
                    </Badge>
                  </div>
                  
                  {canManageUsers && (
                    <div className="space-y-3">
                      <Button 
                        onClick={() => setIsTeamRequestsModalOpen(true)}
                        className="w-full justify-start text-sm"
                        variant="outline"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Inviter des membres
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Informations système */}
            <Card className="shadow-lg border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <CardTitle className="text-lg">Système</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Version</span>
                    <span className="font-medium">2.1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Entreprise</span>
                    <span className="font-medium">{currentUser?.company?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                      Actif
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Modal pour les demandes d'équipe */}
      {canManageUsers && (
        <TeamRequestsModal
          isOpen={isTeamRequestsModalOpen}
          onClose={() => setIsTeamRequestsModalOpen(false)}
        />
      )}
    </div>
  );
}