import { useState } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import { DocumentStatus } from './DocumentStatus';
import { useDeleteDocument } from '@/hooks/useDeleteDocument';
import type { DocumentStatus as DocumentStatusType } from '@/hooks/useBackendDocuments';

// 🎯 Tipos para el documento
interface Document {
  id: string;
  title: string;
  fileName: string;
  status: DocumentStatusType;
  workspace: string;
  createdBy: string;
  fileSize: number;
}

interface DocumentDeleteDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (documentId: string) => void;
  onError?: (error: string) => void;
}

/**
 * 🗑️ Diálogo de confirmación para eliminación de documentos
 * 
 * Características:
 * - Confirmación explícita con checkbox
 * - Información detallada del documento
 * - Advertencias según el estado del documento
 * - Manejo de estados de carga
 */
export function DocumentDeleteDialog({
  document,
  isOpen,
  onClose,
  onSuccess,
  onError
}: DocumentDeleteDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const { deleteDocument, isDeletingDocument, canDeleteDocument } = useDeleteDocument();

  const isDeleting = document ? isDeletingDocument(document.id) : false;

  // 📏 Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ⚠️ Obtener nivel de advertencia según el estado
  const getWarningLevel = (status: DocumentStatusType) => {
    switch (status) {
      case 'archived':
        return {
          level: 'high',
          message: 'Este documento está archivado. La eliminación afectará el historial institucional.',
          color: 'destructive'
        } as const;
      case 'stored':
        return {
          level: 'medium',
          message: 'Este documento está almacenado oficialmente. Asegúrate de que no sea necesario.',
          color: 'warning'
        } as const;
      case 'draft':
        return {
          level: 'low',
          message: 'Este es un borrador. Su eliminación no afectará documentos oficiales.',
          color: 'secondary'
        } as const;
      default:
        return {
          level: 'medium',
          message: 'La eliminación de este documento es permanente.',
          color: 'secondary'
        } as const;
    }
  };

  // 🗑️ Manejar eliminación
  const handleDelete = async () => {
    if (!document || !confirmed) return;

    try {
      const result = await deleteDocument(document.id, {
        confirm: true,
        onSuccess: (id) => {
          console.log('✅ Document deleted successfully');
          onSuccess?.(id);
          onClose();
          // Resetear estado
          setConfirmed(false);
        },
        onError: (id, error) => {
          console.error('❌ Delete error:', error);
          onError?.(error);
        }
      });

      if (!result.success && result.error) {
        onError?.(result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      onError?.(errorMessage);
    }
  };

  // 🚫 Cerrar diálogo
  const handleClose = () => {
    if (!isDeleting) {
      setConfirmed(false);
      onClose();
    }
  };

  if (!document) return null;

  const warning = getWarningLevel(document.status);
  const canDelete = canDeleteDocument({
    createdBy: document.createdBy,
    status: document.status,
    workspace: document.workspace
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>¿Eliminar documento?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* 📄 Información del documento */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm line-clamp-1">{document.title}</h4>
                <DocumentStatus status={document.status} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground">{document.fileName}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tamaño: {formatFileSize(document.fileSize)}</span>
                <Badge variant="outline" className="text-xs">
                  {document.workspace.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* ⚠️ Advertencia según el estado */}
          <div className={`p-3 rounded-lg border-l-4 ${
            warning.level === 'high' 
              ? 'bg-destructive/5 border-l-destructive' 
              : warning.level === 'medium'
              ? 'bg-amber-50 border-l-amber-500'
              : 'bg-muted/50 border-l-muted-foreground'
          }`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                warning.level === 'high' 
                  ? 'text-destructive' 
                  : warning.level === 'medium'
                  ? 'text-amber-600'
                  : 'text-muted-foreground'
              }`} />
              <p className="text-sm">{warning.message}</p>
            </div>
          </div>

          {/* 🔐 Verificación de permisos */}
          {!canDelete && (
            <div className="p-3 bg-destructive/5 border-l-4 border-l-destructive rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Sin permisos</p>
                  <p className="text-xs text-destructive/80">
                    No tienes permisos para eliminar este documento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Confirmación */}
          {canDelete && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm-delete"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked === true)}
                  disabled={isDeleting}
                />
                <label
                  htmlFor="confirm-delete"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Confirmo que quiero eliminar este documento permanentemente
                </label>
              </div>

              <p className="text-xs text-muted-foreground">
                Esta acción eliminará tanto el archivo como todos los registros asociados.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          
          {canDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!confirmed || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar documento
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 🗑️ Diálogo de confirmación para eliminación masiva
 */
interface BulkDeleteDialogProps {
  documents: Document[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (results: { deleted: number; failed: number }) => void;
  onError?: (error: string) => void;
}

export function BulkDeleteDialog({
  documents,
  isOpen,
  onClose,
  onSuccess,
  onError
}: BulkDeleteDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const { deleteDocuments, isDeleting } = useDeleteDocument();

  // 📊 Estadísticas de documentos a eliminar
  const stats = {
    total: documents.length,
    drafts: documents.filter(d => d.status === 'draft').length,
    stored: documents.filter(d => d.status === 'stored').length,
    archived: documents.filter(d => d.status === 'archived').length
  };

  // 🗑️ Manejar eliminación masiva
  const handleBulkDelete = async () => {
    if (!confirmed || documents.length === 0) return;

    try {
      const result = await deleteDocuments(
        documents.map(d => d.id), 
        {
          confirm: true,
          onSuccess: (results) => {
            console.log('✅ Bulk deletion completed:', results);
            onSuccess?.(results);
            onClose();
            setConfirmed(false);
          },
          onError: (error) => {
            console.error('❌ Bulk deletion error:', error);
            onError?.(error);
          }
        }
      );

      if (!result.success && result.error) {
        onError?.(result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      onError?.(errorMessage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>¿Eliminar {stats.total} documentos?</DialogTitle>
              <DialogDescription>
                Esta acción eliminará permanentemente todos los documentos seleccionados
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* 📊 Estadísticas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">{stats.drafts}</div>
              <div className="text-xs text-muted-foreground">Borradores</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">{stats.stored}</div>
              <div className="text-xs text-muted-foreground">Almacenados</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">{stats.archived}</div>
              <div className="text-xs text-muted-foreground">Archivados</div>
            </div>
          </div>

          {/* ⚠️ Advertencia */}
          <div className="p-3 bg-destructive/5 border-l-4 border-l-destructive rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Advertencia</p>
                <p className="text-xs text-destructive/80">
                  La eliminación masiva afectará documentos de diferentes estados y espacios de trabajo.
                  Esta operación no se puede deshacer.
                </p>
              </div>
            </div>
          </div>

          {/* ✅ Confirmación */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm-bulk-delete"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
                disabled={isDeleting}
              />
              <label
                htmlFor="confirm-bulk-delete"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirmo que quiero eliminar {stats.total} documentos permanentemente
              </label>
            </div>

            <p className="text-xs text-muted-foreground">
              Se eliminarán tanto los archivos como todos los registros asociados.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={!confirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar {stats.total} documentos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 