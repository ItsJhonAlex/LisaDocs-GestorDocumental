import { useState } from 'react';
import { 
  Download, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Edit, 
  Eye, 
  MoreHorizontal,
  Share,
  Copy,
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// TODO: Descomentar cuando esté disponible el componente
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from '@/components/ui/alert-dialog';

import { DocumentStatus } from './DocumentStatus';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// 🎯 Tipos para el documento y acciones
interface Document {
  id: string;
  title: string;
  status: DocumentStatus;
  fileUrl: string;
  fileName: string;
  createdBy: string;
  workspace: string;
}

interface DocumentActionsProps {
  document: Document;
  onDownload?: (documentId: string) => void;
  onArchive?: (documentId: string) => void;
  onRestore?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  onEdit?: (documentId: string) => void;
  onView?: (documentId: string) => void;
  onShare?: (documentId: string) => void;
  className?: string;
  variant?: 'dropdown' | 'inline';
}

/**
 * 🎯 Componente de acciones para documentos
 * 
 * Proporciona todas las acciones posibles según permisos del usuario
 * y estado del documento
 */
export function DocumentActions({
  document,
  onDownload,
  onArchive,
  onRestore,
  onDelete,
  onEdit,
  onView,
  onShare,
  className,
  variant = 'dropdown'
}: DocumentActionsProps) {
  const { user, hasRole, hasAnyRole } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🔐 Verificar permisos del usuario
  const isOwner = user?.id === document.createdBy;
  const canArchiveOthers = hasAnyRole(['administrador', 'presidente']) || 
    (hasAnyRole(['secretario_cam', 'secretario_ampp', 'secretario_cf']) && 
     user?.workspaces?.includes(document.workspace));
  const canDelete = isOwner || hasRole('administrador');
  const canEdit = isOwner && document.status === 'draft';
  const canArchive = (isOwner || canArchiveOthers) && document.status === 'stored';
  const canRestore = (isOwner || canArchiveOthers) && document.status === 'archived';

  // 🎯 Manejar acciones con loading
  const handleAction = async (action: () => void | Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  // 📥 Acción de descarga
  const handleDownload = () => {
    if (onDownload) {
      handleAction(() => onDownload(document.id));
    } else {
      // Descarga directa del archivo usando window.document
      const link = window.document.createElement('a');
      link.href = document.fileUrl;
      link.download = document.fileName;
      link.click();
    }
  };

  // 🗑️ Acción de eliminación
  const handleDelete = () => {
    if (onDelete) {
      handleAction(() => onDelete(document.id));
    }
    setShowDeleteDialog(false);
  };

  // 📋 Copiar enlace
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/documents/${document.id}`);
      // TODO: Mostrar toast de éxito
    } catch {
      // TODO: Mostrar toast de error
    }
  };

  // 🎨 Renderizado inline (botones individuales)
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* 👁️ Ver documento */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView?.(document.id)}
          className="h-8"
        >
          <Eye className="w-4 h-4 mr-1" />
          Ver
        </Button>

        {/* 📥 Descargar */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isLoading}
          className="h-8"
        >
          <Download className="w-4 h-4 mr-1" />
          Descargar
        </Button>

        {/* ✏️ Editar (solo borradores del propietario) */}
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(document.id)}
            className="h-8"
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
        )}

        {/* 📦 Archivar */}
        {canArchive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(() => onArchive?.(document.id))}
            disabled={isLoading}
            className="h-8"
          >
            <Archive className="w-4 h-4 mr-1" />
            Archivar
          </Button>
        )}

        {/* 🔄 Restaurar */}
        {canRestore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(() => onRestore?.(document.id))}
            disabled={isLoading}
            className="h-8"
          >
            <ArchiveRestore className="w-4 h-4 mr-1" />
            Restaurar
          </Button>
        )}
      </div>
    );
  }

  // 🎨 Renderizado dropdown (menú desplegable)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className={cn('h-8 w-8 p-0', className)}
            disabled={isLoading}
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="sr-only">Acciones del documento</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-48">
          {/* 👁️ Ver documento */}
          <DropdownMenuItem onClick={() => onView?.(document.id)}>
            <Eye className="w-4 h-4 mr-2" />
            Ver documento
          </DropdownMenuItem>

          {/* 📥 Descargar */}
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </DropdownMenuItem>

          {/* 📋 Copiar enlace */}
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar enlace
          </DropdownMenuItem>

          {/* 🔗 Abrir en nueva pestaña */}
          <DropdownMenuItem onClick={() => window.open(document.fileUrl, '_blank')}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir en nueva pestaña
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* ✏️ Editar (solo borradores del propietario) */}
          {canEdit && (
            <DropdownMenuItem onClick={() => onEdit?.(document.id)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar documento
            </DropdownMenuItem>
          )}

          {/* 🔗 Compartir */}
          {onShare && (
            <DropdownMenuItem onClick={() => onShare(document.id)}>
              <Share className="w-4 h-4 mr-2" />
              Compartir
            </DropdownMenuItem>
          )}

          {/* 📦 Archivar */}
          {canArchive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onArchive?.(document.id)}>
                <Archive className="w-4 h-4 mr-2" />
                Archivar documento
              </DropdownMenuItem>
            </>
          )}

          {/* 🔄 Restaurar */}
          {canRestore && (
            <DropdownMenuItem onClick={() => onRestore?.(document.id)}>
              <ArchiveRestore className="w-4 h-4 mr-2" />
              Restaurar documento
            </DropdownMenuItem>
          )}

          {/* 🗑️ Eliminar */}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar documento
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 🚨 Dialog de confirmación de eliminación - Temporal */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">¿Eliminar documento?</h3>
            <div className="space-y-2 mb-6">
              <p>
                Estás a punto de eliminar el documento <strong>"{document.title}"</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Esta acción no se puede deshacer. El documento será eliminado permanentemente.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * 🎯 Acciones rápidas para tarjetas de documento
 */
interface QuickActionsProps {
  document: Document;
  onDownload?: (documentId: string) => void;
  onView?: (documentId: string) => void;
  className?: string;
}

export function DocumentQuickActions({ 
  document, 
  onDownload, 
  onView, 
  className 
}: QuickActionsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onView?.(document.id)}
        className="h-7 w-7 p-0"
        title="Ver documento"
      >
        <Eye className="w-3.5 h-3.5" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDownload?.(document.id)}
        className="h-7 w-7 p-0"
        title="Descargar documento"
      >
        <Download className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
