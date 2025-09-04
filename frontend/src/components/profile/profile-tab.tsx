"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Camera, 
  Save,
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/api-client";

interface ProfileTabProps {
  user: any;
}

export function ProfileTab({ user }: ProfileTabProps) {
  const { updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'hr': return 'secondary'; 
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'hr': return 'RH';
      default: return 'Utilisateur';
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("L'email est requis");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
      });
      
      toast.success("Profil mis à jour avec succès !");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      toast.error("Mot de passe actuel requis");
      return;
    }

    if (!passwordForm.newPassword) {
      toast.error("Nouveau mot de passe requis");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setIsSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success("Mot de passe modifié avec succès !");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors du changement de mot de passe");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux. Maximum 5MB autorisé.");
      return;
    }

    // Validate file type
    if (!file.type.match(/\/(jpg|jpeg|png|gif)$/)) {
      toast.error("Format de fichier non supporté. Utilisez JPG, PNG ou GIF.");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      await authApi.uploadAvatar(formData);
      toast.success("Avatar mis à jour avec succès !");
      
      // Refresh user profile to get new avatar
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'upload de l'avatar");
    } finally {
      setIsSaving(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt("Pour confirmer la suppression de votre compte, veuillez entrer votre mot de passe :");
    
    if (!password) {
      return;
    }

    const reason = prompt("Optionnel: Pouvez-vous nous dire pourquoi vous supprimez votre compte ?");

    if (!confirm("⚠️ ATTENTION: Cette action est IRRÉVERSIBLE. Toutes vos données (projets, candidats, analyses) seront définitivement supprimées. Êtes-vous absolument sûr de vouloir supprimer votre compte ?")) {
      return;
    }

    try {
      await authApi.deleteAccount();
      toast.success("Compte supprimé avec succès. Au revoir !");
      
      // Clear local storage and redirect
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to landing page after a short delay
      setTimeout(() => {
        window.location.href = '/landing';
      }, 2000);
    } catch (error: any) {
      toast.error("Erreur lors de la suppression du compte");
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Gérez vos informations de profil et vos préférences de compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar_url} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-xl">
                    {getInitials(user?.name || "")}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{user?.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(user?.role)}>
                    {getRoleLabel(user?.role)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Membre depuis {new Date(user?.created_at || Date.now()).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Votre nom complet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="votre.email@entreprise.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Rôle</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{getRoleLabel(user?.role)}</span>
                  <span className="text-xs text-muted-foreground">(lecture seule)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date d'inscription</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(user?.created_at || Date.now()).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="gap-2">
                  <User className="h-4 w-4" />
                  Modifier le profil
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || "",
                        email: user?.email || "",
                      });
                    }}
                    disabled={isSaving}
                  >
                    Annuler
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Gérez vos paramètres de sécurité et votre mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isChangingPassword ? (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Mot de passe</h4>
                  <p className="text-sm text-muted-foreground">
                    Dernière modification il y a plus de 30 jours
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setIsChangingPassword(true)}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Changer le mot de passe
                </Button>
              </div>
            ) : (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Changer le mot de passe</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordForm({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                  >
                    Annuler
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mot de passe actuel</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ 
                          ...prev, 
                          currentPassword: e.target.value 
                        }))}
                        placeholder="Votre mot de passe actuel"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ 
                          ...prev, 
                          newPassword: e.target.value 
                        }))}
                        placeholder="Nouveau mot de passe (min. 6 caractères)"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ 
                          ...prev, 
                          confirmPassword: e.target.value 
                        }))}
                        placeholder="Confirmez votre nouveau mot de passe"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isSaving}
                    className="w-full gap-2"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Changement en cours...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Changer le mot de passe
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Zone dangereuse
            </CardTitle>
            <CardDescription>
              Actions irréversibles sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
              <div>
                <h4 className="font-medium text-red-600 dark:text-red-400">Supprimer mon compte</h4>
                <p className="text-sm text-muted-foreground">
                  Supprime définitivement votre compte et toutes vos données
                </p>
              </div>
              <Button 
                variant="destructive"
                onClick={handleDeleteAccount}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Supprimer le compte
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}