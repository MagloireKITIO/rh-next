"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjects } from "@/hooks/queries";
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  Users,
  Video,
  Phone,
  MapPin,
  RotateCcw,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InterviewFilters {
  status?: string;
  type?: string;
  projectId?: string;
  dateRange?: { start: Date; end: Date };
  search?: string;
}

interface InterviewsFiltersProps {
  filters: InterviewFilters;
  onFiltersChange: (filters: InterviewFilters) => void;
  onSyncCalendar?: () => void;
  syncStatus?: 'connected' | 'disconnected' | 'syncing';
}

const statusOptions = [
  { value: 'scheduled', label: 'Programmé', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'En cours', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Terminé', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800' },
  { value: 'rescheduled', label: 'Reporté', color: 'bg-yellow-100 text-yellow-800' },
];

const typeOptions = [
  { value: 'video_call', label: 'Visioconférence', icon: Video },
  { value: 'phone', label: 'Téléphone', icon: Phone },
  { value: 'in_person', label: 'En présentiel', icon: MapPin },
];

export function InterviewsFilters({
  filters,
  onFiltersChange,
  onSyncCalendar,
  syncStatus = 'disconnected'
}: InterviewsFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { data: projects = [] } = useProjects();

  const updateFilter = (key: keyof InterviewFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof InterviewFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.keys(filters).length;

  const syncStatusConfig = {
    connected: {
      icon: RotateCcw,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      label: 'Synchronisé'
    },
    disconnected: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      label: 'Non synchronisé'
    },
    syncing: {
      icon: RotateCcw,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      label: 'Synchronisation...'
    }
  };

  const currentSyncConfig = syncStatusConfig[syncStatus];
  const SyncIcon = currentSyncConfig.icon;

  return (
    <div className="space-y-4">
      {/* Barre de filtres principale */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtres:</span>
        </div>

        {/* Recherche */}
        <Input
          placeholder="Rechercher un entretien..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-64"
        />

        {/* Statut */}
        <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", status.color.replace('text-', 'bg-').replace('-800', '-500'))} />
                  {status.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type */}
        <Select value={filters.type || ''} onValueChange={(value) => updateFilter('type', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((type) => {
              const Icon = type.icon;
              return (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-3 w-3" />
                    {type.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Projet */}
        <Select value={filters.projectId || ''} onValueChange={(value) => updateFilter('projectId', value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Projet" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Plage de dates */}
        <DropdownMenu open={showDatePicker} onOpenChange={setShowDatePicker}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {filters.dateRange
                ? `${format(filters.dateRange.start, 'dd/MM')} - ${format(filters.dateRange.end, 'dd/MM')}`
                : 'Période'
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-4" align="start">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startDate" className="text-xs">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.dateRange?.start ? format(filters.dateRange.start, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const startDate = new Date(e.target.value);
                      updateFilter('dateRange', {
                        start: startDate,
                        end: filters.dateRange?.end || startDate
                      });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.dateRange?.end ? format(filters.dateRange.end, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const endDate = new Date(e.target.value);
                      updateFilter('dateRange', {
                        start: filters.dateRange?.start || endDate,
                        end: endDate
                      });
                    }}
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setShowDatePicker(false)}
                className="w-full"
              >
                Appliquer
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Actions */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-2">
            <X className="h-3 w-3" />
            Effacer ({activeFiltersCount})
          </Button>
        )}

        {/* Séparateur */}
        <div className="h-6 w-px bg-border" />

        {/* Google Calendar Sync */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs",
            currentSyncConfig.bgColor
          )}>
            <SyncIcon className={cn(
              "h-3 w-3",
              currentSyncConfig.color,
              syncStatus === 'syncing' && "animate-spin"
            )} />
            <span className={currentSyncConfig.color}>
              {currentSyncConfig.label}
            </span>
          </div>

          {onSyncCalendar && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSyncCalendar}
              disabled={syncStatus === 'syncing'}
              className="gap-2"
            >
              <RotateCcw className={cn(
                "h-3 w-3",
                syncStatus === 'syncing' && "animate-spin"
              )} />
              Synchroniser
            </Button>
          )}
        </div>
      </div>

      {/* Filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtres actifs:</span>

          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Statut: {statusOptions.find(s => s.value === filters.status)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => clearFilter('status')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              Type: {typeOptions.find(t => t.value === filters.type)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => clearFilter('type')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.projectId && (
            <Badge variant="secondary" className="gap-1">
              Projet: {projects.find(p => p.id === filters.projectId)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => clearFilter('projectId')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              {format(filters.dateRange.start, 'dd/MM/yyyy')} - {format(filters.dateRange.end, 'dd/MM/yyyy')}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => clearFilter('dateRange')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              "{filters.search}"
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => clearFilter('search')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}