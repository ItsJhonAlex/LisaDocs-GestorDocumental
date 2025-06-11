import { 
  User, 
  Building, 
  HardDrive,
  Clock,
  Crown,
  Briefcase,
  Scale,
  ShieldCheck
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { DocumentStatus } from './DocumentStatus';
import { DocumentActions, DocumentQuickActions } from './DocumentActions';
import { DocumentTypeBadge } from './DocumentTypeSelector';
import { getDocumentTypeFromTags } from '@/types/document';
import { cn } from '@/lib/utils';

// 🎯 Tipos para el documento
interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  workspace: string;
  tags?: string[];
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  storedAt?: string;
  archivedAt?: string;
  fileUrl: string;
}

interface DocumentCardProps {
  document: Document;
  onView?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
  onArchive?: (documentId: string) => void;
  onRestore?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  onEdit?: (documentId: string) => void;
  onShare?: (documentId: string) => void;
  className?: string;
  variant?: 'card' | 'compact' | 'list';
  showActions?: boolean;
}

/**
 * 📄 Componente de tarjeta para mostrar información de documento
 */
export function DocumentCard({
  document,
  onView,
  onDownload,
  onArchive,
  onRestore,
  onDelete,
  onEdit,
  onShare,
  className,
  variant = 'card',
  showActions = true
}: DocumentCardProps) {

  // 🎨 Obtener icono del tipo de archivo
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation')) return '📽️';
    return '📁';
  };

  // 🏢 Obtener icono del workspace
  const getWorkspaceIcon = (workspace: string) => {
    const icons = {
      presidencia: Crown,
      cam: Briefcase,
      ampp: ShieldCheck,
      intendencia: Building,
      comisiones_cf: Scale
    };
    return icons[workspace as keyof typeof icons] || Building;
  };

  // 📏 Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ⏰ Formatear fecha relativa (temporal hasta instalar date-fns)
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'hace 1 día';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
    return `hace ${Math.floor(diffDays / 365)} años`;
  };

  // 🎨 Obtener fecha relevante según el estado
  const getRelevantDate = () => {
    switch (document.status) {
      case 'archived':
        return document.archivedAt ? `Archivado ${formatRelativeDate(document.archivedAt)}` : null;
      case 'stored':
        return document.storedAt ? `Almacenado ${formatRelativeDate(document.storedAt)}` : null;
      case 'draft':
      default:
        return `Creado ${formatRelativeDate(document.createdAt)}`;
    }
  };

  const WorkspaceIcon = getWorkspaceIcon(document.workspace);
  const documentType = getDocumentTypeFromTags(document.tags || []);

  // 🎨 Renderizado compacto
  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors',
        className
      )}>
        {/* 📄 Icono de archivo */}
        <div className="flex-shrink-0 text-lg">
          {getFileIcon(document.mimeType)}
        </div>

        {/* 📝 Información del documento */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium truncate">{document.title}</h4>
            {documentType && (
              <DocumentTypeBadge type={documentType} size="sm" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatFileSize(document.fileSize)}</span>
            <span>•</span>
            <span>{getRelevantDate()}</span>
          </div>
        </div>

        {/* 🏷️ Estado */}
        <DocumentStatus status={document.status} size="sm" />

        {/* ⚡ Acciones rápidas */}
        {showActions && (
          <DocumentQuickActions
            document={document}
            onView={onView}
            onDownload={onDownload}
          />
        )}
      </div>
    );
  }

  // 🎨 Renderizado en lista
  if (variant === 'list') {
    return (
      <div className={cn(
        'flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors',
        className
      )}>
        {/* 📄 Icono y tipo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-lg">
            {getFileIcon(document.mimeType)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{document.title}</h4>
              {documentType && (
                <DocumentTypeBadge type={documentType} size="sm" />
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {document.fileName}
            </p>
          </div>
        </div>

        {/* 🏢 Workspace */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
          <WorkspaceIcon className="w-4 h-4 flex-shrink-0" />
          <span className="truncate capitalize">
            {document.workspace.replace('_', ' ')}
          </span>
        </div>

        {/* 👤 Creador */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
          <User className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {document.createdByName || 'Usuario'}
          </span>
        </div>

        {/* 📏 Tamaño */}
        <div className="text-sm text-muted-foreground">
          {formatFileSize(document.fileSize)}
        </div>

        {/* ⏰ Fecha */}
        <div className="text-sm text-muted-foreground">
          {getRelevantDate()}
        </div>

        {/* 🏷️ Estado */}
        <DocumentStatus status={document.status} size="sm" />

        {/* 🎯 Acciones */}
        {showActions && (
          <DocumentActions
            document={document}
            onView={onView}
            onDownload={onDownload}
            onArchive={onArchive}
            onRestore={onRestore}
            onDelete={onDelete}
            onEdit={onEdit}
            onShare={onShare}
          />
        )}
      </div>
    );
  }

  // 🎨 Renderizado en tarjeta (por defecto)
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 📊 Header de la tarjeta */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* 📄 Icono del archivo */}
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                {getFileIcon(document.mimeType)}
              </div>

              {/* 📝 Información principal */}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base mb-1 line-clamp-2">
                  {document.title}
                </h3>
                {document.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {document.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground truncate">
                  {document.fileName}
                </p>
              </div>
            </div>

            {/* 🎯 Acciones */}
            {showActions && (
              <DocumentActions
                document={document}
                onView={onView}
                onDownload={onDownload}
                onArchive={onArchive}
                onRestore={onRestore}
                onDelete={onDelete}
                onEdit={onEdit}
                onShare={onShare}
              />
            )}
          </div>

          {/* 🏷️ Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {document.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{document.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 📊 Metadata del documento */}
          <div className="space-y-2">
            {/* 🏢 Workspace y estado */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <WorkspaceIcon className="w-4 h-4" />
                <span className="capitalize">
                  {document.workspace.replace('_', ' ')}
                </span>
              </div>
              <DocumentStatus status={document.status} size="sm" />
            </div>

            {/* 👤 Creador */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Creado por {document.createdByName || 'Usuario'}</span>
            </div>

            {/* 📏 Tamaño y fecha */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <HardDrive className="w-4 h-4" />
                <span>{formatFileSize(document.fileSize)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{getRelevantDate()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 📄 Skeleton loader para DocumentCard
 */
export function DocumentCardSkeleton({ variant = 'card' }: { variant?: 'card' | 'compact' | 'list' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border">
        <div className="w-6 h-6 bg-muted rounded animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
        <div className="w-16 h-5 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border">
        <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
        <div className="w-20 h-4 bg-muted rounded animate-pulse" />
        <div className="w-16 h-4 bg-muted rounded animate-pulse" />
        <div className="w-12 h-4 bg-muted rounded animate-pulse" />
        <div className="w-20 h-5 bg-muted rounded animate-pulse" />
        <div className="w-8 h-8 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
            <div className="flex justify-between">
              <div className="h-3 bg-muted rounded animate-pulse w-16" />
              <div className="h-3 bg-muted rounded animate-pulse w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
