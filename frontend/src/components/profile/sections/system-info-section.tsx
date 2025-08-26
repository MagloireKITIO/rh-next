"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface SystemInfoSectionProps {
  user: any;
}

export function SystemInfoSection({ user }: SystemInfoSectionProps) {
  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div>
        <h4 className="font-medium mb-4">Informations du compte</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Identifiant utilisateur</Label>
            <p className="text-sm text-muted-foreground font-mono">{user?.id}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Entreprise</Label>
            <p className="text-sm text-muted-foreground">{user?.company?.name || "Non définie"}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Rôle</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">
                {user?.role === 'admin' ? 'Administrateur' :
                 user?.role === 'hr' ? 'RH' : 'Utilisateur'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div>
        <h4 className="font-medium mb-4">Informations système</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Version de la plateforme</Label>
            <p className="text-sm text-muted-foreground">v1.0.0</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Statut backend</Label>
            <Badge variant="default">Connecté</Badge>
          </div>
          <div>
            <Label className="text-sm font-medium">Base de données</Label>
            <p className="text-sm text-muted-foreground">PostgreSQL (Supabase)</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Fournisseur IA</Label>
            <p className="text-sm text-muted-foreground">Together AI (DeepSeek)</p>
          </div>
        </div>
      </div>

      {/* Help & Documentation */}
      <div>
        <h4 className="font-medium mb-4">Aide & Documentation</h4>
        <div className="space-y-4">
          <div>
            <h5 className="font-medium mb-2">Premiers pas</h5>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Créez votre premier projet de recrutement</li>
              <li>• Téléchargez des fichiers CV pour analyse</li>
              <li>• Consultez les scores et classements générés par l'IA</li>
              <li>• Exportez vos résultats</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}