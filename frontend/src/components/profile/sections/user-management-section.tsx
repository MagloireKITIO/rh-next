"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ExternalLink, Settings, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserManagementSectionProps {
  canManage: boolean;
  canView: boolean;
}

export function UserManagementSection({ canManage, canView }: UserManagementSectionProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">
              {canManage ? "Gestion complète des utilisateurs" : "Consultation des utilisateurs"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {canManage 
                ? "Invitez, gérez et administrez les membres de votre équipe"
                : "Consultez la liste des membres de votre équipe"
              }
            </p>
          </div>
          <Button 
            onClick={() => router.push("/settings")}
            variant="outline"
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            {canManage ? "Gérer les utilisateurs" : "Voir l'équipe"}
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Vos permissions</Label>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={canManage ? "default" : "secondary"}>
              {canManage ? "Gestion complète" : "Lecture seule"}
            </Badge>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Accès équipe</Label>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">
              {canView ? "Autorisé" : "Non autorisé"}
            </Badge>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {canManage 
          ? "En tant qu'administrateur, vous pouvez inviter de nouveaux membres, modifier leurs rôles et gérer leurs accès."
          : canView
            ? "En tant que RH, vous pouvez consulter la liste des membres mais ne pouvez pas les gérer."
            : "Vous n'avez pas les permissions nécessaires pour voir l'équipe."
        }
      </p>
    </div>
  );
}