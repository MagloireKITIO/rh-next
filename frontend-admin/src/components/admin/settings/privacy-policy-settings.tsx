'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api-client';

interface PrivacyPolicyConfig {
  enabled: boolean;
  fileUrl: string | null;
  fileName: string | null;
  hasFile: boolean;
}

export default function PrivacyPolicySettings() {
  const [config, setConfig] = useState<PrivacyPolicyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const response = await adminApi.getPrivacyPolicyConfiguration();
      setConfig(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
      toast.error('Erreur lors de la récupération de la configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont autorisés');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    setSelectedFile(file);
  };

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
    handleFileSelect(e.dataTransfer.files);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await adminApi.uploadPrivacyPolicy(formData);

      toast.success(response.data.message);
      setSelectedFile(null);
      await fetchConfig();
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const toggleEnabled = async (enabled: boolean) => {
    try {
      const response = await adminApi.enablePrivacyPolicy(enabled);

      toast.success(response.data.message);
      await fetchConfig();
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const deleteFile = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer la politique de confidentialité ?')) {
      return;
    }

    try {
      const response = await adminApi.deletePrivacyPolicy();
      toast.success(response.data.message);
      await fetchConfig();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const openFile = () => {
    if (config?.fileUrl) {
      window.open(config.fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Statut de la Politique de Confidentialité
          </CardTitle>
          <CardDescription>
            Configuration de la politique de confidentialité obligatoire pour les candidatures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="privacy-enabled">Politique de confidentialité obligatoire</Label>
              <p className="text-sm text-muted-foreground">
                {config?.enabled
                  ? 'Les candidats doivent accepter la politique de confidentialité'
                  : 'La politique de confidentialité n\'est pas requise'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              {config?.hasFile ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Fichier disponible
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Aucun fichier
                </Badge>
              )}
              <Switch
                id="privacy-enabled"
                checked={config?.enabled || false}
                onCheckedChange={toggleEnabled}
                disabled={!config?.hasFile}
              />
            </div>
          </div>

          {config?.enabled && !config?.hasFile && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Action requise</span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Vous devez télécharger un fichier PDF avant d'activer la politique de confidentialité.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current File Section */}
      {config?.hasFile && (
        <Card>
          <CardHeader>
            <CardTitle>Fichier Actuel</CardTitle>
            <CardDescription>
              Politique de confidentialité actuellement configurée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-500" />
                <div>
                  <p className="font-medium">{config.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Politique de confidentialité PDF
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={openFile}>
                  <Download className="w-4 h-4 mr-1" />
                  Voir
                </Button>
                <Button variant="outline" size="sm" onClick={deleteFile}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {config?.hasFile ? 'Remplacer' : 'Télécharger'} la Politique de Confidentialité
          </CardTitle>
          <CardDescription>
            Téléchargez un fichier PDF contenant votre politique de confidentialité (max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <FileText className="w-12 h-12 text-red-500 mx-auto" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={uploadFile} disabled={uploading}>
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {uploading ? 'Téléchargement...' : 'Télécharger'}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedFile(null)}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-lg font-medium">Glissez-déposez votre fichier PDF ici</p>
                  <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner</p>
                </div>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Button variant="outline" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Sélectionner un fichier
                  </label>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• La politique de confidentialité sera affichée aux candidats lors de leur candidature</p>
          <p>• Les candidats devront cocher une case pour accepter la politique avant de soumettre</p>
          <p>• Seuls les fichiers PDF sont acceptés (taille maximum : 10MB)</p>
          <p>• La politique peut être activée/désactivée à tout moment</p>
        </CardContent>
      </Card>
    </div>
  );
}