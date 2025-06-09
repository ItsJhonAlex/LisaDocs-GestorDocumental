import { Badge } from '@/components/ui/badge';
import { FileEdit, Archive, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// 🎯 Tipos de estado según el schema de la BD
export type DocumentStatus = 'draft' | 'stored' | 'archived';

interface DocumentStatusProps {
  status: DocumentStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 🏷️ Componente para mostrar el estado de un documento
 * 
 * Estados del ciclo de vida:
 * - draft: 📝 Borrador en proceso de creación
 * - stored: 📁 Documento almacenado oficialmente
 * - archived: 📦 Documento archivado
 */
export function DocumentStatus({ 
  status, 
  className, 
  showIcon = true, 
  size = 'md' 
}: DocumentStatusProps) {
  
  // 🎨 Configuración de estilos por estado
  const statusConfig = {
    draft: {
      label: 'Borrador',
      variant: 'secondary' as const,
      icon: FileEdit,
      description: 'Documento en proceso de creación'
    },
    stored: {
      label: 'Almacenado',
      variant: 'default' as const,
      icon: CheckCircle,
      description: 'Documento guardado oficialmente'
    },
    archived: {
      label: 'Archivado',
      variant: 'outline' as const,
      icon: Archive,
      description: 'Documento archivado'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // 📏 Tamaños de iconos
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1.5',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'lg' && 'text-sm px-3 py-1',
        className
      )}
      title={config.description}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
    </Badge>
  );
}

/**
 * 📊 Componente para mostrar estadísticas de estados
 */
interface DocumentStatusStatsProps {
  stats: {
    draft: number;
    stored: number;
    archived: number;
  };
  className?: string;
}

export function DocumentStatusStats({ stats, className }: DocumentStatusStatsProps) {
  const total = stats.draft + stats.stored + stats.archived;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex items-center gap-2">
        <DocumentStatus status="draft" size="sm" />
        <span className="text-sm text-muted-foreground">
          {stats.draft} ({total > 0 ? Math.round((stats.draft / total) * 100) : 0}%)
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <DocumentStatus status="stored" size="sm" />
        <span className="text-sm text-muted-foreground">
          {stats.stored} ({total > 0 ? Math.round((stats.stored / total) * 100) : 0}%)
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <DocumentStatus status="archived" size="sm" />
        <span className="text-sm text-muted-foreground">
          {stats.archived} ({total > 0 ? Math.round((stats.archived / total) * 100) : 0}%)
        </span>
      </div>
    </div>
  );
}
