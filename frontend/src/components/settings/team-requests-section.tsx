"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck } from "lucide-react";
import { TeamRequestsModal } from "@/components/modals/team-requests-modal";

export function TeamRequestsSection() {
  const [teamRequestsModalOpen, setTeamRequestsModalOpen] = useState(false);

  return (
    <>
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

      <TeamRequestsModal 
        open={teamRequestsModalOpen} 
        onOpenChange={setTeamRequestsModalOpen} 
      />
    </>
  );
}