'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Palette,
  Image,
  Layout,
  Settings,
  Upload,
  Download,
  Eye,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface VisualIdentitySettings {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    destructiveColor: string;
    borderRadius: string;
    fontFamily: string;
  };
  branding: {
    logoUrl: string;
    title: string;
    favicon: string;
    companyName: string;
  };
  layout: {
    showHeader: boolean;
    showFooter: boolean;
    sidebarStyle: 'collapsed' | 'expanded' | 'hidden';
  };
  pageSettings: {
    jobs: {
      header: { enabled: boolean; content: string };
      footer: { enabled: boolean; content: string };
    };
    dashboard: {
      header: { enabled: boolean; content: string };
      footer: { enabled: boolean; content: string };
    };
    candidates: {
      header: { enabled: boolean; content: string };
      footer: { enabled: boolean; content: string };
    };
  };
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

const ColorPicker = ({ label, value, onChange, description }: ColorPickerProps) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setDisplayValue(newValue);
    onChange(newValue);
  };

  // Convertir oklch en couleur CSS visible et hex
  const getPreviewColor = (colorValue: string) => {
    if (colorValue.includes('oklch')) {
      const match = colorValue.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
      if (match) {
        const [, l, c, h] = match;
        const lightness = parseFloat(l) * 100;
        const saturation = Math.min(parseFloat(c) * 100, 100);
        const hue = parseFloat(h);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      }
    }
    return colorValue;
  };

  // Convertir oklch vers hex pour le color picker
  const oklchToHex = (oklchValue: string): string => {
    if (oklchValue.includes('oklch')) {
      const match = oklchValue.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
      if (match) {
        const [, l, c, h] = match;
        // Conversion approximative oklch -> rgb -> hex
        const lightness = parseFloat(l);
        const chroma = parseFloat(c);
        const hue = parseFloat(h);

        // Conversion simplifiée (approximation)
        const hueRad = (hue * Math.PI) / 180;
        const a = chroma * Math.cos(hueRad);
        const b = chroma * Math.sin(hueRad);

        // Conversion vers RGB (approximation)
        let r = lightness + 0.3963377774 * a + 0.2158037573 * b;
        let g = lightness - 0.1055613458 * a - 0.0638541728 * b;
        let blue = lightness - 0.0894841775 * a - 1.2914855480 * b;

        // Assurer que les valeurs sont dans [0,1]
        r = Math.max(0, Math.min(1, r));
        g = Math.max(0, Math.min(1, g));
        blue = Math.max(0, Math.min(1, blue));

        // Convertir en hex
        const rHex = Math.round(r * 255).toString(16).padStart(2, '0');
        const gHex = Math.round(g * 255).toString(16).padStart(2, '0');
        const bHex = Math.round(blue * 255).toString(16).padStart(2, '0');

        return `#${rHex}${gHex}${bHex}`;
      }
    }
    return colorValue.startsWith('#') ? colorValue : '#6366f1';
  };

  // Convertir hex vers oklch
  const hexToOklch = (hexValue: string): string => {
    const hex = hexValue.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Conversion RGB vers OKLCH (approximation)
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const a = 0.5 * (r - g);
    const bb = 0.5 * (g - b);
    const c = Math.sqrt(a * a + bb * bb);
    const h = Math.atan2(bb, a) * 180 / Math.PI;

    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h >= 0 ? h.toFixed(0) : (h + 360).toFixed(0)})`;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="oklch(0.577 0.2 280)"
            className="flex-1"
          />
          <div
            className="w-12 h-10 rounded border border-border cursor-pointer flex items-center justify-center text-xs font-mono"
            style={{
              backgroundColor: getPreviewColor(displayValue),
              color: displayValue.includes('oklch') && parseFloat(displayValue.match(/oklch\(([\d.]+)/)?.[1] || '0.5') < 0.5 ? 'white' : 'black'
            }}
            title={`Aperçu: ${displayValue}`}
          >
            {displayValue.includes('oklch') ? '🎨' : ''}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">ou choisir:</Label>
          <input
            type="color"
            value={oklchToHex(displayValue)}
            onChange={(e) => handleChange(hexToOklch(e.target.value))}
            className="w-12 h-8 rounded border border-border cursor-pointer"
            title="Sélecteur de couleur"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChange('oklch(0.577 0.2 280)')}
            className="text-xs"
          >
            Reset
          </Button>
        </div>

        {/* Couleurs prédéfinies */}
        <div className="flex items-center gap-1">
          <Label className="text-sm text-muted-foreground mr-2">Prédéfinis:</Label>
          {[
            { name: 'Violet', value: 'oklch(0.577 0.2 280)' },
            { name: 'Bleu', value: 'oklch(0.577 0.2 240)' },
            { name: 'Vert', value: 'oklch(0.577 0.2 140)' },
            { name: 'Rouge', value: 'oklch(0.577 0.2 20)' },
            { name: 'Orange', value: 'oklch(0.577 0.2 50)' },
          ].map((color) => (
            <button
              key={color.name}
              onClick={() => handleChange(color.value)}
              className="w-6 h-6 rounded border border-border cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: getPreviewColor(color.value) }}
              title={`${color.name}: ${color.value}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept: string;
  maxSize: number;
  description: string;
  currentFile?: string;
  uploading?: boolean;
}

const FileUpload = ({ onFileSelect, accept, maxSize, description, currentFile, uploading }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      toast.error(`Le fichier est trop volumineux (max ${maxSize / 1024 / 1024}MB)`);
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="space-y-4">
      {currentFile && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <Image className="w-8 h-8 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Fichier actuel</p>
            <p className="text-xs text-muted-foreground">{currentFile}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open(currentFile, '_blank')}>
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Téléchargement en cours...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Glissez-déposez votre fichier ici</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            <Input
              type="file"
              accept={accept}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <Button variant="outline" size="sm" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Sélectionner un fichier
              </label>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function VisualIdentitySettings() {
  console.log('🚀 [VISUAL IDENTITY] Component initialized');

  const [activeTab, setActiveTab] = useState('theme');
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const queryClient = useQueryClient();

  // Récupérer les paramètres d'identité visuelle
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin', 'visual-identity-settings'],
    queryFn: async () => {
      console.log('🔄 [VISUAL IDENTITY] Fetching platform settings...');
      try {
        const response = await adminApi.getVisualIdentitySettings();
        console.log('✅ [VISUAL IDENTITY] Response received:', response);
        console.log('📄 [VISUAL IDENTITY] Response data:', response.data);
        return response.data as VisualIdentitySettings;
      } catch (error) {
        console.error('❌ [VISUAL IDENTITY] Error fetching settings:', error);
        console.error('❌ [VISUAL IDENTITY] Error response:', error.response);
        console.error('❌ [VISUAL IDENTITY] Error status:', error.response?.status);
        console.error('❌ [VISUAL IDENTITY] Error data:', error.response?.data);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const [formData, setFormData] = useState<VisualIdentitySettings | null>(null);

  useEffect(() => {
    console.log('🔄 [VISUAL IDENTITY] useEffect triggered with settings:', settings);
    if (settings) {
      console.log('✅ [VISUAL IDENTITY] Setting form data:', settings);
      setFormData(settings);
      setHasChanges(false);
    } else {
      console.log('⚠️ [VISUAL IDENTITY] No settings received');
    }
  }, [settings]);

  // Mutation pour sauvegarder les paramètres
  const saveMutation = useMutation({
    mutationFn: async (section: string) => {
      if (!formData) return;
      const sectionData = formData[section as keyof VisualIdentitySettings];
      return adminApi.updateVisualIdentitySection(section, sectionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'visual-identity-settings'] });
      toast.success('Paramètres sauvegardés avec succès');
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  });

  // Mutation pour l'upload de logo
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      return adminApi.uploadLogo(formDataUpload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'visual-identity-settings'] });
      toast.success(response.data.message);
      setUploadingLogo(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement');
      setUploadingLogo(false);
    }
  });

  // Mutation pour l'upload de favicon
  const uploadFaviconMutation = useMutation({
    mutationFn: async (file: File) => {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      return adminApi.uploadFavicon(formDataUpload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'visual-identity-settings'] });
      toast.success(response.data.message);
      setUploadingFavicon(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement');
      setUploadingFavicon(false);
    }
  });

  const handleInputChange = (section: string, field: string, value: any) => {
    if (!formData) return;

    setFormData({
      ...formData,
      [section]: {
        ...formData[section as keyof VisualIdentitySettings],
        [field]: value
      }
    });
    setHasChanges(true);
  };

  const handleNestedInputChange = (section: string, subsection: string, field: string, value: any) => {
    if (!formData) return;

    setFormData({
      ...formData,
      [section]: {
        ...formData[section as keyof VisualIdentitySettings],
        [subsection]: {
          ...(formData[section as keyof VisualIdentitySettings] as any)[subsection],
          [field]: value
        }
      }
    });
    setHasChanges(true);
  };

  const handleSave = (section: string) => {
    saveMutation.mutate(section);
  };

  const handleReset = () => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  };

  const handleLogoUpload = (file: File) => {
    setUploadingLogo(true);
    uploadLogoMutation.mutate(file);
  };

  const handleFaviconUpload = (file: File) => {
    setUploadingFavicon(true);
    uploadFaviconMutation.mutate(file);
  };

  if (isLoading) {
    console.log('⏳ [VISUAL IDENTITY] Loading state - fetching settings...');
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner className="w-6 h-6 mr-2" />
        Chargement des paramètres...
      </div>
    );
  }

  if (error) {
    console.error('💥 [VISUAL IDENTITY] Component error state:', error);
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des paramètres d'identité visuelle
          <br />
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer">Détails de l'erreur</summary>
            <pre className="mt-1 whitespace-pre-wrap">
              {error?.message || 'Erreur inconnue'}
              {error?.response?.data?.message && <br />}
              {error?.response?.data?.message}
            </pre>
          </details>
        </AlertDescription>
      </Alert>
    );
  }

  if (!formData) return null;

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Identité Visuelle</h3>
          <p className="text-sm text-muted-foreground">
            Personnalisez l'apparence de votre plateforme
          </p>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              <AlertCircle className="w-3 h-3 mr-1" />
              Modifications non sauvegardées
            </Badge>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Annuler
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Thème
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Mise en page
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Pages
          </TabsTrigger>
        </TabsList>

        {/* Onglet Thème */}
        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Configuration des couleurs
                  </CardTitle>
                  <CardDescription>
                    Définissez la palette de couleurs de votre plateforme
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleSave('theme')}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ColorPicker
                  label="Couleur primaire"
                  value={formData.theme.primaryColor}
                  onChange={(value) => handleInputChange('theme', 'primaryColor', value)}
                  description="Couleur principale de l'interface (boutons, liens, etc.)"
                />

                <ColorPicker
                  label="Couleur secondaire"
                  value={formData.theme.secondaryColor}
                  onChange={(value) => handleInputChange('theme', 'secondaryColor', value)}
                  description="Couleur secondaire pour les éléments de support"
                />

                <ColorPicker
                  label="Couleur d'accent"
                  value={formData.theme.accentColor}
                  onChange={(value) => handleInputChange('theme', 'accentColor', value)}
                  description="Couleur pour les éléments en surbrillance"
                />

                <ColorPicker
                  label="Couleur de danger"
                  value={formData.theme.destructiveColor}
                  onChange={(value) => handleInputChange('theme', 'destructiveColor', value)}
                  description="Couleur pour les actions destructives et erreurs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Rayon des bordures</Label>
                  <Input
                    value={formData.theme.borderRadius}
                    onChange={(e) => handleInputChange('theme', 'borderRadius', e.target.value)}
                    placeholder="0.625rem"
                  />
                  <p className="text-sm text-muted-foreground">
                    Contrôle la courbure des coins (ex: 0.5rem, 8px)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Police de caractères</Label>
                  <Input
                    value={formData.theme.fontFamily}
                    onChange={(e) => handleInputChange('theme', 'fontFamily', e.target.value)}
                    placeholder="Inter, system-ui, sans-serif"
                  />
                  <p className="text-sm text-muted-foreground">
                    Police principale de l'interface
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Branding */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Configuration du branding
                  </CardTitle>
                  <CardDescription>
                    Gérez le logo, titre et favicon de votre plateforme
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleSave('branding')}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Titre de la plateforme</Label>
                  <Input
                    value={formData.branding.title}
                    onChange={(e) => handleInputChange('branding', 'title', e.target.value)}
                    placeholder="RH Analytics Pro"
                  />
                  <p className="text-sm text-muted-foreground">
                    Affiché dans la barre de navigation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Nom de l'entreprise</Label>
                  <Input
                    value={formData.branding.companyName}
                    onChange={(e) => handleInputChange('branding', 'companyName', e.target.value)}
                    placeholder="Mon Entreprise"
                  />
                  <p className="text-sm text-muted-foreground">
                    Utilisé dans les emails et documents
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Logo</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Logo principal affiché dans la navigation
                    </p>
                  </div>
                  <FileUpload
                    onFileSelect={handleLogoUpload}
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    maxSize={5 * 1024 * 1024}
                    description="PNG, JPG, SVG ou WebP (max 5MB)"
                    currentFile={formData.branding.logoUrl}
                    uploading={uploadingLogo}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Favicon</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Icône affichée dans l'onglet du navigateur
                    </p>
                  </div>
                  <FileUpload
                    onFileSelect={handleFaviconUpload}
                    accept=".ico,.png,.svg"
                    maxSize={1 * 1024 * 1024}
                    description="ICO, PNG ou SVG (max 1MB)"
                    currentFile={formData.branding.favicon}
                    uploading={uploadingFavicon}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Mise en page */}
        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="w-5 h-5" />
                    Configuration de la mise en page
                  </CardTitle>
                  <CardDescription>
                    Contrôlez l'affichage des éléments globaux
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleSave('layout')}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Afficher l'en-tête</Label>
                    <p className="text-sm text-muted-foreground">
                      Contrôle l'affichage de la barre de navigation principale
                    </p>
                  </div>
                  <Switch
                    checked={formData.layout.showHeader}
                    onCheckedChange={(checked) => handleInputChange('layout', 'showHeader', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Afficher le pied de page</Label>
                    <p className="text-sm text-muted-foreground">
                      Contrôle l'affichage du footer global
                    </p>
                  </div>
                  <Switch
                    checked={formData.layout.showFooter}
                    onCheckedChange={(checked) => handleInputChange('layout', 'showFooter', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Style de la barre latérale</Label>
                  <select
                    value={formData.layout.sidebarStyle}
                    onChange={(e) => handleInputChange('layout', 'sidebarStyle', e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                  >
                    <option value="expanded">Étendue</option>
                    <option value="collapsed">Réduite</option>
                    <option value="hidden">Masquée</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    Contrôle l'affichage de la navigation latérale
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Pages */}
        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuration par page
                  </CardTitle>
                  <CardDescription>
                    Personnalisez l'affichage de chaque section
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleSave('pageSettings')}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(formData.pageSettings).map(([pageName, pageConfig]) => (
                <Card key={pageName} className="border-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base capitalize">{pageName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>En-tête personnalisé</Label>
                          <Switch
                            checked={pageConfig.header.enabled}
                            onCheckedChange={(checked) =>
                              handleNestedInputChange('pageSettings', pageName, 'header', {
                                ...pageConfig.header,
                                enabled: checked
                              })
                            }
                          />
                        </div>
                        {pageConfig.header.enabled && (
                          <textarea
                            value={pageConfig.header.content}
                            onChange={(e) =>
                              handleNestedInputChange('pageSettings', pageName, 'header', {
                                ...pageConfig.header,
                                content: e.target.value
                              })
                            }
                            placeholder="Contenu HTML personnalisé pour l'en-tête"
                            className="w-full p-2 border border-border rounded-md bg-background resize-none"
                            rows={3}
                          />
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Pied de page personnalisé</Label>
                          <Switch
                            checked={pageConfig.footer.enabled}
                            onCheckedChange={(checked) =>
                              handleNestedInputChange('pageSettings', pageName, 'footer', {
                                ...pageConfig.footer,
                                enabled: checked
                              })
                            }
                          />
                        </div>
                        {pageConfig.footer.enabled && (
                          <textarea
                            value={pageConfig.footer.content}
                            onChange={(e) =>
                              handleNestedInputChange('pageSettings', pageName, 'footer', {
                                ...pageConfig.footer,
                                content: e.target.value
                              })
                            }
                            placeholder="Contenu HTML personnalisé pour le pied de page"
                            className="w-full p-2 border border-border rounded-md bg-background resize-none"
                            rows={3}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}