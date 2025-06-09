import { useState, useCallback } from 'react';
import { 
  Search, 
  X, 
  SlidersHorizontal,
  Building,
  Archive,
  CheckCircle,
  FileEdit,
  Crown,
  Briefcase,
  Scale,
  ShieldCheck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { DocumentStatus } from './DocumentStatus';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// 🎯 Tipos para filtros
export interface DocumentFilters {
  search?: string;
  status?: DocumentStatus[];
  workspace?: string[];
  fileType?: string[];
  createdBy?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  tags?: string[];
  sortBy?: 'created_at' | 'title' | 'file_size' | 'stored_at';
  sortOrder?: 'asc' | 'desc';
}

interface DocumentFiltersProps {
  filters: DocumentFilters;
  onFiltersChange: (filters: DocumentFilters) => void;
  availableUsers?: Array<{ id: string; name: string }>;
  availableTags?: string[];
  className?: string;
  showAdvanced?: boolean;
}

/**
 * 🔍 Componente de filtros para documentos
 * 
 * Permite buscar y filtrar documentos por múltiples criterios
 */
export function DocumentFilters({
  filters,
  onFiltersChange,
  availableUsers = [],
  className,
  showAdvanced = true
}: DocumentFiltersProps) {
  const { user, hasRole, hasAnyRole } = useAuth();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 🎯 Workspaces disponibles según el rol del usuario
  const getAvailableWorkspaces = () => {
    const allWorkspaces = [
      { value: 'presidencia', label: 'Presidencia', icon: Crown },
      { value: 'cam', label: 'CAM', icon: Briefcase },
      { value: 'ampp', label: 'AMPP', icon: ShieldCheck },
      { value: 'intendencia', label: 'Intendencia', icon: Building },
      { value: 'comisiones_cf', label: 'Comisiones CF', icon: Scale }
    ];

    // Los administradores pueden ver todos los workspaces
    if (hasRole('administrador')) {
      return allWorkspaces;
    }

    // Otros usuarios ven según sus permisos
    return allWorkspaces.filter(workspace => {
      if (user?.workspaces?.includes(workspace.value)) return true;
      
      // Presidentes y vicepresidentes pueden ver la mayoría
      if (hasAnyRole(['presidente', 'vicepresidente'])) {
        return workspace.value !== 'intendencia' || hasRole('presidente');
      }

      return false;
    });
  };

  // 📝 Tipos de archivo comunes
  const fileTypes = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'doc', label: 'Word', icon: '📝' },
    { value: 'xls', label: 'Excel', icon: '📊' },
    { value: 'image', label: 'Imágenes', icon: '🖼️' },
    { value: 'txt', label: 'Texto', icon: '📋' }
  ];

  // 🎯 Estados disponibles
  const statuses: Array<{ value: DocumentStatus; label: string; icon: LucideIcon }> = [
    { value: 'draft', label: 'Borradores', icon: FileEdit },
    { value: 'stored', label: 'Almacenados', icon: CheckCircle },
    { value: 'archived', label: 'Archivados', icon: Archive }
  ];

  // 📊 Opciones de ordenamiento
  const sortOptions = [
    { value: 'created_at', label: 'Fecha de creación' },
    { value: 'title', label: 'Título' },
    { value: 'file_size', label: 'Tamaño' },
    { value: 'stored_at', label: 'Fecha de almacenamiento' }
  ];

  // 🔄 Actualizar filtros
  const updateFilter = useCallback((key: keyof DocumentFilters, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  // 🗑️ Limpiar filtro específico
  const clearFilter = useCallback((key: keyof DocumentFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // 🧹 Limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    onFiltersChange({ sortBy: 'created_at', sortOrder: 'desc' });
  }, [onFiltersChange]);

  // 🔢 Contar filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status?.length) count++;
    if (filters.workspace?.length) count++;
    if (filters.fileType?.length) count++;
    if (filters.createdBy?.length) count++;
    if (filters.dateRange) count++;
    if (filters.tags?.length) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={cn('space-y-4', className)}>
      {/* 🔍 Búsqueda principal */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 📝 Campo de búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos por título, descripción o nombre de archivo..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearFilter('search')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* 🎯 Ordenamiento rápido */}
        <Select
          value={`${filters.sortBy || 'created_at'}-${filters.sortOrder || 'desc'}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
            updateFilter('sortBy', sortBy);
            updateFilter('sortOrder', sortOrder);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <div key={option.value}>
                <SelectItem value={`${option.value}-desc`}>
                  {option.label} (Desc)
                </SelectItem>
                <SelectItem value={`${option.value}-asc`}>
                  {option.label} (Asc)
                </SelectItem>
              </div>
            ))}
          </SelectContent>
        </Select>

        {/* 🎛️ Filtros avanzados */}
        {showAdvanced && (
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn(
                'relative',
                activeFiltersCount > 0 && 'border-primary'
              )}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* 📊 Panel de filtros avanzados */}
            {showAdvancedFilters && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-popover border rounded-md shadow-md p-4 z-50">
                <div className="space-y-4">
                  {/* 📊 Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros Avanzados</h4>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-muted-foreground"
                      >
                        Limpiar todo
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* 🏷️ Estado del documento */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Estado</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {statuses.map((status) => {
                        const Icon = status.icon;
                        const isSelected = filters.status?.includes(status.value);
                        return (
                          <Button
                            key={status.value}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const currentStatus = filters.status || [];
                              const newStatus = isSelected
                                ? currentStatus.filter(s => s !== status.value)
                                : [...currentStatus, status.value];
                              updateFilter('status', newStatus.length ? newStatus : undefined);
                            }}
                            className="justify-start"
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {status.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 🏢 Workspace */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Espacio de Trabajo</Label>
                    <div className="grid grid-cols-1 gap-1">
                      {getAvailableWorkspaces().map((workspace) => {
                        const Icon = workspace.icon;
                        const isSelected = filters.workspace?.includes(workspace.value);
                        return (
                          <Button
                            key={workspace.value}
                            variant={isSelected ? "default" : "ghost"}
                            size="sm"
                            onClick={() => {
                              const currentWorkspaces = filters.workspace || [];
                              const newWorkspaces = isSelected
                                ? currentWorkspaces.filter(w => w !== workspace.value)
                                : [...currentWorkspaces, workspace.value];
                              updateFilter('workspace', newWorkspaces.length ? newWorkspaces : undefined);
                            }}
                            className="justify-start h-8"
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {workspace.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 📁 Tipo de archivo */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Archivo</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {fileTypes.map((type) => {
                        const isSelected = filters.fileType?.includes(type.value);
                        return (
                          <Button
                            key={type.value}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const currentTypes = filters.fileType || [];
                              const newTypes = isSelected
                                ? currentTypes.filter(t => t !== type.value)
                                : [...currentTypes, type.value];
                              updateFilter('fileType', newTypes.length ? newTypes : undefined);
                            }}
                            className="justify-start"
                          >
                            <span className="mr-2">{type.icon}</span>
                            {type.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 👤 Creado por (solo para administradores) */}
                  {hasAnyRole(['administrador', 'presidente']) && availableUsers.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Creado por</Label>
                      <Select
                        value={filters.createdBy?.[0] || ''}
                        onValueChange={(value) => 
                          updateFilter('createdBy', value ? [value] : undefined)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos los usuarios</SelectItem>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🏷️ Filtros activos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              <Search className="w-3 h-3" />
              "{filters.search}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('search')}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {filters.status?.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              <DocumentStatus status={status} showIcon={false} size="sm" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newStatus = filters.status?.filter(s => s !== status);
                  updateFilter('status', newStatus?.length ? newStatus : undefined);
                }}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}

          {filters.workspace?.map((workspace) => {
            const workspaceData = getAvailableWorkspaces().find(w => w.value === workspace);
            return (
              <Badge key={workspace} variant="secondary" className="gap-1">
                <Building className="w-3 h-3" />
                {workspaceData?.label || workspace}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newWorkspaces = filters.workspace?.filter(w => w !== workspace);
                    updateFilter('workspace', newWorkspaces?.length ? newWorkspaces : undefined);
                  }}
                  className="h-4 w-4 p-0 ml-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground"
          >
            Limpiar todos
          </Button>
        </div>
      )}
    </div>
  );
}
