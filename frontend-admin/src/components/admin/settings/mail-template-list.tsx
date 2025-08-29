'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Mail, 
  Edit3, 
  Trash2, 
  Copy, 
  Eye, 
  Star,
  Filter,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface MailTemplate {
  id: string;
  type: string;
  name: string;
  description?: string;
  subject: string;
  html_content: string;
  text_content?: string;
  status: 'active' | 'draft' | 'archived';
  is_default: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface TemplateType {
  type: string;
  label: string;
  description: string;
}

interface MailTemplateListProps {
  onEdit: (template: MailTemplate) => void;
  onAdd: () => void;
}

export default function MailTemplateList({ onEdit, onAdd }: MailTemplateListProps) {
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [templateTypes, setTemplateTypes] = useState<TemplateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadTemplates();
    loadTemplateTypes();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/mail-templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateTypes = async () => {
    try {
      const response = await apiClient.get('/mail-templates/types');
      setTemplateTypes(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des types:', error);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || template.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || template.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSetAsDefault = async (templateId: string) => {
    try {
      await apiClient.post(`/mail-templates/${templateId}/set-default`);
      toast.success('Template défini comme défaut');
      loadTemplates();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la définition comme défaut');
    }
  };

  const handleDuplicate = async (templateId: string, name: string) => {
    try {
      await apiClient.post(`/mail-templates/${templateId}/duplicate`, {
        name: `${name} (Copie)`
      });
      toast.success('Template dupliqué');
      loadTemplates();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la duplication');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;
    
    try {
      await apiClient.delete(`/mail-templates/${templateId}`);
      toast.success('Template supprimé');
      loadTemplates();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Actif</Badge>;
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'archived':
        return <Badge variant="outline">Archivé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const typeData = templateTypes.find(t => t.type === type);
    return typeData?.label || type;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
        <div className="h-32 bg-muted animate-pulse rounded"></div>
        <div className="h-32 bg-muted animate-pulse rounded"></div>
        <div className="h-32 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Templates de Mail</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les templates d'emails de votre plateforme
          </p>
        </div>
        <Button onClick={onAdd} className="bg-gradient-to-r from-admin-light to-admin-dark">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Template
        </Button>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {templateTypes.map((type) => (
              <SelectItem key={type.type} value={type.type}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="archived">Archivé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des templates */}
      <div className="grid gap-4">
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Aucun template trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
                  ? 'Aucun template ne correspond à vos critères de recherche'
                  : 'Commencez par créer votre premier template d\'email'
                }
              </p>
              {(!searchQuery && selectedType === 'all' && selectedStatus === 'all') && (
                <Button onClick={onAdd} className="bg-gradient-to-r from-admin-light to-admin-dark">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-admin-light to-admin-dark rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.is_default && (
                          <Badge variant="outline" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Par défaut
                          </Badge>
                        )}
                        {getStatusBadge(template.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{getTypeLabel(template.type)}</span>
                        <span>Version {template.version}</span>
                        <span>Modifié le {new Date(template.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(template)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDuplicate(template.id, template.name)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {!template.is_default && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSetAsDefault(template.id)}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    {!template.is_default && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sujet :</p>
                    <p className="text-sm">{template.subject}</p>
                  </div>
                  {template.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description :</p>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Statistiques */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {templates.filter(t => t.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Actifs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {templates.filter(t => t.status === 'draft').length}
                </p>
                <p className="text-sm text-muted-foreground">Brouillons</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {templates.filter(t => t.is_default).length}
                </p>
                <p className="text-sm text-muted-foreground">Par défaut</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}