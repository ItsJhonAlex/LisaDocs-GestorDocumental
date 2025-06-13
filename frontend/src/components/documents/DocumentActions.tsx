import { useState } from 'react';
import { 
  Download, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Edit, 
  Eye, 
  MoreHorizontal,
  Copy,
  ExternalLink,
  Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { DocumentStatus } from './DocumentStatus';
import { DocumentDeleteDialog } from './DocumentDeleteDialog';
import { DocumentStatusChanger } from './DocumentStatusChanger';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteDocument } from '@/hooks/useDeleteDocument';
import { useDocumentStatus } from '@/hooks/useDocumentStatus';
import { cn } from '@/lib/utils';
import type { DocumentStatus as DocumentStatusType } from '@/hooks/useBackendDocuments';
import { downloadDocumentWithCorrectName } from '@/utils/documentUtils';

// 🎯 Tipos para el documento y acciones
interface Document {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  status: DocumentStatusType;
  fileUrl: string;
  createdBy: string;
  workspace: string;
}

interface DocumentActionsProps {
  document: Document;
  onDownload?: (documentId: string) => void;
  onArchive?: (documentId: string) => void;
  onRestore?: (documentId: string) => void;
  onEdit?: (documentId: string) => void;
  onView?: (documentId: string) => void;

  onDeleteSuccess?: (documentId: string) => void;
  onDeleteError?: (error: string) => void;
  onStatusChange?: (documentId: string, newStatus: string) => void;
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
  onEdit,
  onView,

  onDeleteSuccess,
  onDeleteError,
  onStatusChange,
  className,
  variant = 'dropdown'
}: DocumentActionsProps) {
  const { user, hasRole, hasAnyRole } = useAuth();
  const { isDeletingDocument, canDeleteDocument } = useDeleteDocument();
  const documentStatusHook = useDocumentStatus({
    onSuccess: (documentId, newStatus) => {
      console.log('✅ Status changed successfully:', { documentId, newStatus });
      onStatusChange?.(documentId, newStatus);
    },
    onError: (error) => {
      console.error('❌ Status change error:', error);
      // TODO: Mostrar toast de error
    }
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🔐 Verificar permisos del usuario
  const isOwner = user?.id === document.createdBy;
  const canArchiveOthers = hasAnyRole(['administrador', 'presidente']) || 
    (hasAnyRole(['secretario_cam', 'secretario_ampp', 'secretario_cf']) && 
     user?.workspace === document.workspace);
  const canDelete = canDeleteDocument({
    createdBy: document.createdBy,
    status: document.status,
    workspace: document.workspace
  });
  const canEdit = isOwner && document.status === 'draft';
  const canArchive = (isOwner || canArchiveOthers) && document.status === 'stored';
  const canRestore = (isOwner || canArchiveOthers) && document.status === 'archived';

  const isDeleting = isDeletingDocument(document.id);

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
  const handleDownload = async () => {
    if (onDownload) {
      handleAction(() => onDownload(document.id));
    } else {
      // Descarga directa del archivo con nombre correcto del backend
      try {
        await downloadDocumentWithCorrectName(document.fileUrl, document.fileName);
      } catch (error) {
        console.error('❌ Error downloading document:', error);
        // TODO: Mostrar toast de error al usuario
      }
    }
  };

  // 🗑️ Abrir diálogo de eliminación
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  // ✅ Manejar éxito de eliminación
  const handleDeleteSuccess = (documentId: string) => {
    console.log('✅ Document deleted successfully:', documentId);
    onDeleteSuccess?.(documentId);
    setShowDeleteDialog(false);
  };

  // ❌ Manejar error de eliminación
  const handleDeleteError = (error: string) => {
    console.error('❌ Delete error:', error);
    onDeleteError?.(error);
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
      <>
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

          {/* 🗑️ Eliminar */}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="h-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
          )}
        </div>

        {/* 🗑️ Diálogo de eliminación */}
        <DocumentDeleteDialog
          document={document}
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onSuccess={handleDeleteSuccess}
          onError={handleDeleteError}
        />
      </>
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
            disabled={isLoading || isDeleting}
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
          <DropdownMenuItem onClick={async () => {
            try {
              const { openDocumentInNewTab } = await import('@/utils/documentUtils');
              await openDocumentInNewTab(document.id, document.fileName);
            } catch (error) {
              console.error('❌ Error opening document in new tab:', error);
              // TODO: Mostrar toast de error
            }
          }}>
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

          {/* 🔄 Cambiar estado */}
          {user && documentStatusHook.canChangeStatus(document, user.id, user.role).canChange && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Cambiar estado
              </DropdownMenuItem>
            </>
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
                onClick={handleDeleteClick}
                className="text-destructive focus:text-destructive"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Eliminando...' : 'Eliminar documento'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 🗑️ Diálogo de eliminación */}
      <DocumentDeleteDialog
        document={document}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onSuccess={handleDeleteSuccess}
        onError={handleDeleteError}
      />

      {/* 🔄 Diálogo de cambio de estado */}
      <DocumentStatusChanger
        document={document as any}
        onStatusChange={async (documentId, newStatus, reason) => {
          await documentStatusHook.changeDocumentStatus(documentId, newStatus, reason);
          setShowStatusDialog(false);
        }}
        isOpen={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        hideButton={true}
      />
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
