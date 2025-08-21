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
import { useConfiguration, useApiKeys } from "@/hooks/use-api";
import { ArrowLeft, Save, Settings, Key, Brain, Plus, Trash2, Eye, EyeOff, ToggleLeft, ToggleRight, Users, UserPlus, Shield, Crown, Mail, RefreshCcw, UserCheck } from "lucide-react";
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
  const { getAIConfiguration, setConfigurationValue } = useConfiguration();
  const { fetchApiKeys, addApiKey, toggleApiKey, deleteApiKey, getStats } = useApiKeys();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/auth/login");
    }
  }, [currentUser, loading, router]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiConfig, setAiConfig] = useState<any>(null);
  
  const [settings, setSettings] = useState({
    togetherAiKeys: "",
    defaultPrompt: ""
  });

  const [apiKeys, setApiKeys] = useState<Array<{
    id: string;
    maskedKey: string;
    isActive: boolean;
    createdAt: string;
    lastUsedAt?: string;
    requestCount: number;
    name?: string;
    provider: string;
  }>>([]);

  const [keyStats, setKeyStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    totalRequests: number;
  }>({ total: 0, active: 0, inactive: 0, totalRequests: 0 });

  const [newKeyInput, setNewKeyInput] = useState("");

  // User management states
  const [users, setUsers] = useState<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    is_invited: boolean;
    created_at: string;
  }>>([]);
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "user"
  });
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  
  // Team requests modal state
  const [teamRequestsModalOpen, setTeamRequestsModalOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // Écouter l'événement d'ouverture du modal team requests depuis les notifications
  useEffect(() => {
    const handleOpenTeamRequestsModal = () => {
      setTeamRequestsModalOpen(true);
    };

    window.addEventListener('openTeamRequestsModal', handleOpenTeamRequestsModal);
    return () => {
      window.removeEventListener('openTeamRequestsModal', handleOpenTeamRequestsModal);
    };
  }, []);

  // Séparé pour éviter les dépendances circulaires
  useEffect(() => {
    console.log('🔍 Debug permissions:', {
      currentUser: currentUser?.email,
      role: currentUser?.role,
      isUserAdmin,
      isHR,
      canViewUsers,
      canManageUsers
    });
    
    if (currentUser && canViewUsers) {
      console.log('✅ Chargement des utilisateurs autorisé');
      loadUsers();
    } else {
      console.log('❌ Chargement des utilisateurs bloqué');
    }
  }, [currentUser, canViewUsers]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const config = await getAIConfiguration();
      setAiConfig(config);
      setSettings({
        togetherAiKeys: "", // Ne pas exposer les clés pour la sécurité
        defaultPrompt: config.defaultPrompt || ""
      });

      // Charger les clés depuis le backend
      const [keys, stats] = await Promise.all([
        fetchApiKeys(),
        getStats()
      ]);
      setApiKeys(keys);
      setKeyStats(stats);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Error loading settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddApiKey = async () => {
    if (!newKeyInput.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }

    try {
      await addApiKey({ key: newKeyInput.trim() });
      setNewKeyInput("");
      await loadSettings(); // Recharger les données
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  const handleToggleKeyStatus = async (keyId: string) => {
    try {
      await toggleApiKey(keyId);
      await loadSettings(); // Recharger les données
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  const handleRemoveApiKey = async (keyId: string) => {
    try {
      await deleteApiKey(keyId);
      await loadSettings(); // Recharger les données
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sauvegarder les clés AI si fournies
      if (settings.togetherAiKeys.trim()) {
        await setConfigurationValue(
          "TOGETHER_AI_KEYS", 
          settings.togetherAiKeys.trim(),
          "Together AI API keys (comma separated)"
        );
      }

      // Sauvegarder le prompt par défaut
      if (settings.defaultPrompt.trim()) {
        await setConfigurationValue(
          "DEFAULT_AI_PROMPT",
          settings.defaultPrompt.trim(),
          "Default prompt for AI analysis of CVs"
        );
      }

      toast.success("Settings saved successfully!");
      await loadSettings(); // Recharger pour actualiser
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  // User management functions
  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/companies/current/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Error loading users");
    }
  };

  const handleInviteUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/companies/current/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(inviteForm),
      });

      if (response.ok) {
        toast.success("Invitation sent successfully!");
        setInviteDialogOpen(false);
        setInviteForm({ email: "", name: "", role: "user" });
        await loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || "Error sending invitation");
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      toast.error("Error sending invitation");
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/companies/current/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast.success("User role updated successfully!");
        await loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || "Error updating user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Error updating user role");
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const endpoint = isActive ? 'deactivate' : 'reactivate';
      const response = await fetch(`${API_BASE_URL}/api/companies/current/users/${userId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(`User ${isActive ? 'deactivated' : 'reactivated'} successfully!`);
        await loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || `Error ${isActive ? 'deactivating' : 'reactivating'} user`);
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Error updating user status");
    }
  };

  const handleResendInvitation = async (userId: string, email: string) => {
    const loadingKey = `resend_${userId}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/companies/current/users/${userId}/resend-invitation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(`Invitation renvoyée à ${email}`);
      } else {
        const error = await response.json();
        toast.error(error.message || "Erreur lors du renvoi de l'invitation");
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Erreur lors du renvoi de l'invitation");
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userName} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/companies/current/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(`${userName} supprimé avec succès`);
        await loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'hr': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'hr': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <NavBar />
      
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure your AI settings and platform preferences
            </p>
          </div>
        </motion.div>

        <div className="grid gap-6">
          {/* AI Configuration - Admin only */}
          {isUserAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Configuration
                </CardTitle>
                <CardDescription>
                  Manage your Together AI settings and analysis preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">API Keys Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={keyStats.active > 0 ? "default" : "destructive"}>
                        {keyStats.active} active keys
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Default Prompt</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={aiConfig?.hasDefaultPrompt ? "default" : "secondary"}>
                        {aiConfig?.hasDefaultPrompt ? "Configured" : "Using default"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Add New API Key */}
                <div className="space-y-4">
                  <Label>Together AI Keys Management</Label>
                  
                  {/* Add Key Input */}
                  <div className="flex gap-2">
                    <Input
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value)}
                      placeholder="Enter new API key..."
                      type="password"
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddApiKey()}
                    />
                    <Button 
                      onClick={handleAddApiKey}
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Key
                    </Button>
                  </div>

                  {/* Keys List */}
                  {apiKeys.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2"
                    >
                      <Label className="text-sm">Configured Keys ({apiKeys.length})</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {apiKeys.map((apiKey, index) => (
                          <motion.div
                            key={apiKey.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                          >
                            {/* Key Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Key className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm">
                                  {apiKey.maskedKey}
                                </span>
                                <Badge 
                                  variant={apiKey.isActive ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {apiKey.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>Added: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                                <span>Requests: {apiKey.requestCount}</span>
                                {apiKey.lastUsedAt && (
                                  <span>Last used: {new Date(apiKey.lastUsedAt).toLocaleDateString()}</span>
                                )}
                                <span>Provider: {apiKey.provider}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              {/* Toggle Active/Inactive */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleKeyStatus(apiKey.id)}
                                className="h-8 w-8 p-0"
                                title={apiKey.isActive ? "Deactivate key" : "Activate key"}
                              >
                                {apiKey.isActive ? (
                                  <ToggleRight className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>

                              {/* Remove Key */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveApiKey(apiKey.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Remove key"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Add multiple API keys for automatic rotation and better reliability. Inactive keys won't be used.
                  </p>
                </div>

                {/* Default Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="defaultPrompt">Default AI Prompt</Label>
                  <Textarea
                    id="defaultPrompt"
                    value={settings.defaultPrompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultPrompt: e.target.value }))}
                    placeholder="Enter your default AI prompt for CV analysis..."
                    rows={12}
                  />
                  <p className="text-sm text-muted-foreground">
                    This prompt will be used by default for all CV analyses unless overridden in project settings
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={loadSettings}
                    disabled={isSaving}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )}

          {/* User Management (Admin & HR can view, Admin can manage) */}
          {canViewUsers && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestion des utilisateurs
                  </CardTitle>
                  <CardDescription>
                    Invitez des membres dans votre équipe et gérez leurs rôles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Invite User Dialog */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Membres de l'équipe ({users.length})</h3>
                      <p className="text-sm text-muted-foreground">
                        Gérez les membres de votre entreprise
                      </p>
                    </div>
                    {canManageUsers && (
                      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Inviter un utilisateur
                          </Button>
                        </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Inviter un nouvel utilisateur</DialogTitle>
                          <DialogDescription>
                            Envoyez une invitation par email pour ajouter un membre à votre équipe
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="invite-email">Email</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              placeholder="utilisateur@entreprise.com"
                              value={inviteForm.email}
                              onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invite-name">Nom</Label>
                            <Input
                              id="invite-name"
                              placeholder="Nom de l'utilisateur"
                              value={inviteForm.name}
                              onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invite-role">Rôle</Label>
                            <Select
                              value={inviteForm.role}
                              onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Utilisateur</SelectItem>
                                <SelectItem value="hr">RH</SelectItem>
                                <SelectItem value="admin">Administrateur</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setInviteDialogOpen(false)}
                          >
                            Annuler
                          </Button>
                          <Button onClick={handleInviteUser}>
                            Envoyer l'invitation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    )}
                  </div>

                  {/* Users List */}
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{user.name}</span>
                                {user.is_invited && (
                                  <Badge variant="outline" className="text-xs">
                                    Invité
                                  </Badge>
                                )}
                                {!user.is_active && (
                                  <Badge variant="destructive" className="text-xs">
                                    Inactif
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Role Badge */}
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role === 'admin' ? 'Administrateur' : 
                             user.role === 'hr' ? 'RH' : 'Utilisateur'}
                          </Badge>

                          {/* Role Select - Admin only */}
                          {canManageUsers ? (
                            <Select
                              value={user.role}
                              onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole)}
                              disabled={user.id === currentUser?.id} // Cannot change own role
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Utilisateur</SelectItem>
                                <SelectItem value="hr">RH</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm text-muted-foreground px-3 py-1.5 bg-muted rounded">
                              {user.role === 'admin' ? 'Administrateur' : 
                               user.role === 'hr' ? 'RH' : 'Utilisateur'}
                            </span>
                          )}

                          {/* Management Actions - Admin only */}
                          {canManageUsers && (
                            <>
                              {/* Toggle Status */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                disabled={user.id === currentUser?.id} // Cannot deactivate self
                                className="h-8 w-8 p-0"
                              >
                                {user.is_active ? (
                                  <ToggleRight className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>

                              {/* Resend Invitation Button - only for invited users */}
                              {user.is_invited && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResendInvitation(user.id, user.email)}
                                  disabled={loadingStates[`resend_${user.id}`] || false}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Renvoyer l'invitation"
                                >
                                  <RefreshCcw className={`h-4 w-4${loadingStates[`resend_${user.id}`] ? ' animate-spin' : ''}`} />
                                </Button>
                              )}

                              {/* Delete User Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                disabled={user.id === currentUser?.id} // Cannot delete self
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Supprimer l'utilisateur"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {/* Read-only status indicator for HR */}
                          {!canManageUsers && (
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {user.is_active ? 'Actif' : 'Inactif'}
                              </span>
                              {user.is_invited && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                  Invité
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {users.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun utilisateur trouvé</p>
                        <p className="text-sm">Invitez votre premier membre d'équipe</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Team Requests Management (Admin only) */}
          {isUserAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Demandes d'équipe
                  </CardTitle>
                  <CardDescription>
                    Gérez les demandes de personnes souhaitant rejoindre votre équipe
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-medium">Demandes de rejoindre l'équipe</h4>
                      <p className="text-sm text-muted-foreground">
                        Consultez et approuvez les demandes de personnes ayant accès à vos projets partagés
                      </p>
                    </div>
                    <Button 
                      onClick={() => setTeamRequestsModalOpen(true)}
                      variant="outline"
                      className="gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      Voir les demandes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* System Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Platform Version</Label>
                    <p className="text-sm text-muted-foreground">v1.0.0</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Backend Status</Label>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Database</Label>
                    <p className="text-sm text-muted-foreground">PostgreSQL (Supabase)</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">AI Provider</Label>
                    <p className="text-sm text-muted-foreground">Together AI (DeepSeek)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Help & Documentation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Help & Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Getting Started</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Configure your Together AI API keys above</li>
                    <li>• Create your first recruitment project</li>
                    <li>• Upload CV files for analysis</li>
                    <li>• Review AI-generated scores and rankings</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">API Keys</h4>
                  <p className="text-sm text-muted-foreground">
                    You can get your Together AI API keys from your dashboard at{" "}
                    <a href="https://api.together.ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      api.together.ai
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Team Requests Modal */}
        <TeamRequestsModal 
          open={teamRequestsModalOpen} 
          onOpenChange={setTeamRequestsModalOpen} 
        />
      </div>
    </div>
  );
}