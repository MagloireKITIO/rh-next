"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ExternalLink, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export function AIConfigurationSection() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Configuration IA complète</h4>
            <p className="text-sm text-muted-foreground">
              Accédez aux paramètres avancés d'intelligence artificielle
            </p>
          </div>
          <Button 
            onClick={() => router.push("/settings")}
            variant="outline"
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Ouvrir les paramètres
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Statut des clés API</Label>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">Configuration requise</Badge>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Prompt par défaut</Label>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">Utilise les valeurs par défaut</Badge>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        La configuration IA complète est disponible dans la page des paramètres, 
        accessible uniquement aux administrateurs.
      </p>
    </div>
  );
}