"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useCompanyUsers } from "@/hooks/queries/useCompanyUsers";
import { useInviteUser, useUpdateUserRole, useActivateUser, useDeactivateUser, useResendInvitation, useDeleteUser } from "@/hooks/mutations/useCompanyMutations";
import { UserPlus, Shield, Crown, RefreshCcw, ToggleLeft, ToggleRight, Trash2, Users } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

interface UserManagementSectionProps {
  canManage: boolean;
  canView: boolean;
  currentUser: any;
}

export function UserManagementSection({ canManage, canView, currentUser }: UserManagementSectionProps) {
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [usersPerPage] = useState(20);
  
  // User management hooks
  const { data: usersData, isLoading: usersLoading } = useCompanyUsers({
    page: currentUserPage,
    limit: usersPerPage,
  });
  const inviteUserMutation = useInviteUser();
  const updateUserRoleMutation = useUpdateUserRole();
  const activateUserMutation = useActivateUser();
  const deactivateUserMutation = useDeactivateUser();
  const resendInvitationMutation = useResendInvitation();
  const deleteUserMutation = useDeleteUser();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "user"
  });
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});

  const handleUserPageChange = (page: number) => {
    setCurrentUserPage(page);
  };

  const handleInviteUser = () => {
    inviteUserMutation.mutate(inviteForm, {
      onSuccess: () => {
        setInviteDialogOpen(false);
        setInviteForm({ email: "", name: "", role: "user" });
      },
    });
  };

  const handleUpdateUserRole = (userId: string, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleToggleUserStatus = (userId: string, isActive: boolean) => {
    if (isActive) {
      deactivateUserMutation.mutate(userId);
    } else {
      activateUserMutation.mutate(userId);
    }
  };

  const handleResendInvitation = (userId: string, email: string) => {
    const loadingKey = `resend_${userId}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    
    resendInvitationMutation.mutate(userId, {
      onSuccess: () => {
        toast.success(`Invitation renvoyée à ${email}`);
      },
      onSettled: () => {
        setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
      },
    });
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userName} ? Cette action est irréversible.`)) {
      return;
    }

    deleteUserMutation.mutate(userId, {
      onSuccess: () => {
        toast.success(`${userName} supprimé avec succès`);
      },
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Membres de l'équipe ({usersData?.total || 0})</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les membres de votre entreprise
          </p>
        </div>
        {canManage && (
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
        {usersLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" text="Chargement des utilisateurs..." />
          </div>
        ) : usersData?.data && usersData.data.length > 0 ? (
          usersData.data.map((user) => (
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
                {canManage ? (
                  <Select
                    value={user.role}
                    onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole)}
                    disabled={user.id === currentUser?.id}
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
                {canManage && (
                  <>
                    {/* Toggle Status */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                      disabled={user.id === currentUser?.id}
                      className="h-8 w-8 p-0"
                    >
                      {user.is_active ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>

                    {/* Resend Invitation Button */}
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
                      disabled={user.id === currentUser?.id}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer l'utilisateur"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Read-only status indicator for HR */}
                {!canManage && (
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
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun utilisateur trouvé</p>
            <p className="text-sm">Invitez votre premier membre d'équipe</p>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {(usersData?.totalPages || 0) > 1 && (
        <div className="mt-6 border-t pt-6">
          <Pagination
            currentPage={currentUserPage}
            totalPages={usersData?.totalPages || 0}
            onPageChange={handleUserPageChange}
            showInfo={true}
            totalItems={usersData?.total || 0}
            itemsPerPage={usersPerPage}
          />
        </div>
      )}
    </div>
  );
}