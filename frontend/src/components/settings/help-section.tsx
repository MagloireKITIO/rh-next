"use client";

export function HelpSection() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">Premiers pas</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Les clés API sont gérées par votre administrateur système</li>
          <li>• Créez votre premier projet de recrutement</li>
          <li>• Téléchargez des fichiers CV pour l'analyse</li>
          <li>• Consultez les scores et classements générés par l'IA</li>
        </ul>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Contact</h4>
        <p className="text-sm text-muted-foreground">
          Pour la configuration des clés API ou l'administration système, veuillez contacter votre administrateur.
        </p>
      </div>
    </div>
  );
}