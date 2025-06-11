import { useState } from 'react';
import { Check, ChevronDown, HelpCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

import { 
  type DocumentType, 
  type WorkspaceType,
  DOCUMENT_TYPE_CONFIG,
  getDocumentTypesForWorkspace,
  getDocumentTypeConfig
} from '@/types/document';
import { cn } from '@/lib/utils';

interface DocumentTypeSelectorProps {
  workspace: WorkspaceType;
  value?: DocumentType;
  onValueChange: (type: DocumentType) => void;
  className?: string;
  disabled?: boolean;
  showDescription?: boolean;
  showRetentionInfo?: boolean;
}

/**
 * 📝 Selector de tipos de documento basado en el workspace
 * 
 * Muestra solo los tipos de documentos disponibles para el workspace actual
 * con información contextual sobre cada tipo
 */
export function DocumentTypeSelector({
  workspace,
  value,
  onValueChange,
  className,
  disabled = false,
  showDescription = true,
  showRetentionInfo = false
}: DocumentTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 🎯 Obtener tipos disponibles para el workspace
  const availableTypes = getDocumentTypesForWorkspace(workspace);
  const selectedConfig = value ? getDocumentTypeConfig(value) : null;

  // 🎨 Obtener color del tipo
  const getTypeColor = (type: DocumentType) => {
    const config = getDocumentTypeConfig(type);
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    };
    return colorMap[config.color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* 🏷️ Label con información */}
      <div className="flex items-center gap-2">
        <Label htmlFor="document-type" className="text-sm font-medium">
          Tipo de Documento *
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Selecciona el tipo de documento según su categoría institucional.
                Esto determinará las políticas de retención y acceso.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 🎯 Selector principal */}
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger id="document-type" className="h-12">
          <SelectValue placeholder="Selecciona el tipo de documento">
            {selectedConfig && (
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedConfig.icon}</span>
                <span className="font-medium">{selectedConfig.label}</span>
                <Badge variant="outline" className={cn('text-xs', getTypeColor(value!))}>
                  {workspace.toUpperCase()}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent className="max-w-md">
          {availableTypes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">No hay tipos de documentos disponibles</p>
              <p className="text-xs">para el workspace {workspace}</p>
            </div>
          ) : (
            availableTypes.map((type) => {
              const config = getDocumentTypeConfig(type);
              const isSelected = value === type;
              
              return (
                <SelectItem 
                  key={type} 
                  value={type}
                  className="min-h-[60px] p-3"
                >
                  <div className="flex items-start gap-3 w-full">
                    {/* 🎨 Icono */}
                    <span className="text-xl flex-shrink-0 mt-0.5">
                      {config.icon}
                    </span>
                    
                    {/* 📝 Información */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{config.label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      
                      {showDescription && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {config.description}
                        </p>
                      )}
                      
                      {showRetentionInfo && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Retención: {config.retentionMonths} meses
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>

      {/* 📋 Información del tipo seleccionado */}
      {selectedConfig && showDescription && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{selectedConfig.icon}</span>
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">{selectedConfig.label}</h4>
              <p className="text-xs text-muted-foreground mb-2">
                {selectedConfig.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={cn('text-xs', value && getTypeColor(value))}>
                  {workspace.toUpperCase()}
                </Badge>
                
                {showRetentionInfo && (
                  <Badge variant="outline" className="text-xs">
                    📅 Retención: {selectedConfig.retentionMonths} meses
                  </Badge>
                )}
                
                {selectedConfig.requiredFields && (
                  <Badge variant="outline" className="text-xs">
                    📋 Campos requeridos
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 🏷️ Badge para mostrar el tipo de documento
 */
interface DocumentTypeBadgeProps {
  type: DocumentType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function DocumentTypeBadge({ 
  type, 
  size = 'md', 
  showIcon = true, 
  className 
}: DocumentTypeBadgeProps) {
  const config = getDocumentTypeConfig(type);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const getTypeColor = () => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    };
    return colorMap[config.color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium border',
        sizeClasses[size],
        getTypeColor(),
        className
      )}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

/**
 * 📊 Lista compacta de tipos disponibles para un workspace
 */
interface DocumentTypeListProps {
  workspace: WorkspaceType;
  className?: string;
}

export function DocumentTypeList({ workspace, className }: DocumentTypeListProps) {
  const availableTypes = getDocumentTypesForWorkspace(workspace);

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="font-medium text-sm text-muted-foreground">
        Tipos disponibles en {workspace.toUpperCase()}:
      </h4>
      <div className="flex flex-wrap gap-2">
        {availableTypes.map((type) => (
          <DocumentTypeBadge key={type} type={type} size="sm" />
        ))}
      </div>
    </div>
  );
} 