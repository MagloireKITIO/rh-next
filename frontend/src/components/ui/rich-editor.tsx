"use client";

import { useRef, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { 
  User, Mail, Phone, Building, Briefcase, Calendar, BarChart3, 
  FileText, ExternalLink, Copy, Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, 
  Undo, Redo, Code, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface Variable {
  name: string;
  display: string;
  description: string;
  example: string;
  icon: React.ElementType;
  category: 'candidate' | 'company' | 'system';
}

export function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('candidate');


  const variables: Variable[] = [
    // Candidat
    { name: '{{name}}', display: 'Nom', description: 'Nom complet du candidat', example: 'Jean Dupont', icon: User, category: 'candidate' },
    { name: '{{email}}', display: 'Email', description: 'Adresse email du candidat', example: 'jean.dupont@email.com', icon: Mail, category: 'candidate' },
    { name: '{{phone}}', display: 'Téléphone', description: 'Numéro de téléphone du candidat', example: '+33 6 12 34 56 78', icon: Phone, category: 'candidate' },
    { name: '{{score}}', display: 'Score', description: 'Score d\'évaluation du candidat', example: '85/100', icon: BarChart3, category: 'candidate' },
    { name: '{{summary}}', display: 'Résumé', description: 'Résumé de l\'analyse du candidat', example: 'Excellent profil technique...', icon: FileText, category: 'candidate' },
    
    // Entreprise/Projet
    { name: '{{company_name}}', display: 'Entreprise', description: 'Nom de votre entreprise', example: 'Ma Société', icon: Building, category: 'company' },
    { name: '{{project_name}}', display: 'Poste', description: 'Nom du poste/projet', example: 'Développeur Frontend', icon: Briefcase, category: 'company' },
    
    // Système
    { name: '{{current_date}}', display: 'Date du jour', description: 'Date actuelle au format français', example: '15 décembre 2024', icon: Calendar, category: 'system' },
    { name: '{{system_name}}', display: 'Site web', description: 'URL de votre plateforme', example: 'https://monsite.com', icon: ExternalLink, category: 'system' },
  ];

  const categoryLabels = {
    candidate: { label: 'Informations Candidat', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    company: { label: 'Informations Entreprise', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    system: { label: 'Informations Système', color: 'bg-slate-50 text-slate-700 border-slate-200' }
  };

  const insertVariable = (variable: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      
      const newText = text.slice(0, start) + variable + text.slice(end);
      onChange(newText);
      
      // Repositionner le curseur après la variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
      
      toast.success(`Variable ${variable} ajoutée !`);
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast.success(`${variable} copié !`);
  };

  const getVariablesByCategory = (category: string) => {
    return variables.filter(v => v.category === category);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Éditeur - Prend 3/4 de l'espace */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Éditeur d'Email</CardTitle>
            <p className="text-sm text-muted-foreground">
              Rédigez votre email et insérez des variables depuis le panneau de droite
            </p>
          </CardHeader>
          <CardContent>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-96 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
              style={{
                lineHeight: '1.6',
                backgroundColor: 'white',
                color: '#111827',
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Variables - 1/4 de l'espace */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variables Disponibles</CardTitle>
            <p className="text-xs text-muted-foreground">
              Cliquez pour insérer dans l'éditeur
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([category, config]) => (
                    <SelectItem key={category} value={category}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Variables de la catégorie sélectionnée */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm px-2 py-1 rounded border ${categoryLabels[selectedCategory as keyof typeof categoryLabels]?.color}`}>
              {categoryLabels[selectedCategory as keyof typeof categoryLabels]?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {getVariablesByCategory(selectedCategory).map((variable) => (
              <div key={variable.name} className="border rounded p-2 hover:bg-muted/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <variable.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{variable.display}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyVariable(variable.name)}
                      className="h-6 w-6 p-0"
                      title="Copier"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertVariable(variable.name)}
                      className="h-6 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary"
                      title="Insérer"
                    >
                      +
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{variable.description}</p>
                <Badge 
                  variant="outline" 
                  className="text-xs font-mono"
                >
                  {variable.name}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Ex: {variable.example}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}