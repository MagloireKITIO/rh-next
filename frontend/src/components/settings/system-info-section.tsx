"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function SystemInfoSection() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Version de la plateforme</Label>
          <p className="text-sm text-muted-foreground">v1.0.0</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Statut Backend</Label>
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
  );
}