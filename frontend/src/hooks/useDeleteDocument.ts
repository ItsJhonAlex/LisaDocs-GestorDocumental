import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

// 🎯 Tipos para el resultado de eliminación
interface DeleteResult {
  success: boolean;
  error?: string;
}

// 🎯 Hook para manejar eliminación de documentos
export const useDeleteDocument = () => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // 🗑️ Eliminar documento único
  const deleteDocument = useCallback(async (
    id: string,
    { 
      confirm = false,
      onSuccess,
      onError 
    }: {
      confirm?: boolean;
      onSuccess?: (id: string) => void;
      onError?: (id: string, error: string) => void;
    } = {}
  ): Promise<DeleteResult> => {
    if (!user?.id) {
      const error = 'User not authenticated';
      onError?.(id, error);
      return { success: false, error };
    }

    // Marcar como eliminando
    setDeletingIds(prev => new Set(prev).add(id));
    setIsDeleting(true);

    try {
      // 🔗 Construir URL con confirmación si es necesario
      const url = `/api/documents/${id}${confirm ? '?confirm=true' : ''}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        // 🚨 Error específico de confirmación requerida
        if (response.status === 400 && result.details?.includes('confirmation required')) {
          const error = 'Confirmation required for deletion';
          onError?.(id, error);
          return { success: false, error };
        }

        // 🚨 Error específico de permisos
        if (response.status === 403) {
          const error = result.details || 'No tienes permisos para eliminar este documento';
          onError?.(id, error);
          return { success: false, error };
        }

        // 🚨 Error específico de documento no encontrado
        if (response.status === 404) {
          const error = 'Documento no encontrado';
          onError?.(id, error);
          return { success: false, error };
        }

        // 🚨 Error general
        const error = result.details || result.error || 'Error al eliminar documento';
        onError?.(id, error);
        return { success: false, error };
      }

      // ✅ Éxito
      console.log('✅ Document deleted successfully:', result.data);
      onSuccess?.(id);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de red al eliminar documento';
      console.error('❌ Delete document error:', error);
      onError?.(id, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      // Remover de estado de eliminando
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setIsDeleting(false);
    }
  }, [user?.id]);

  // 🗑️ Eliminar múltiples documentos (solo administradores)
  const deleteDocuments = useCallback(async (
    ids: string[],
    { 
      confirm = false,
      onProgress,
      onSuccess,
      onError 
    }: {
      confirm?: boolean;
      onProgress?: (current: number, total: number) => void;
      onSuccess?: (results: { deleted: number; failed: number; errors: Array<{ documentId: string; error: string }> }) => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<DeleteResult> => {
    if (!user?.id) {
      const error = 'User not authenticated';
      onError?.(error);
      return { success: false, error };
    }

    // 🔐 Verificar permisos de administrador para eliminación masiva
    if (user.role !== 'administrador') {
      const error = 'Solo los administradores pueden eliminar múltiples documentos';
      onError?.(error);
      return { success: false, error };
    }

    setIsDeleting(true);

    try {
      const response = await fetch('/api/documents/bulk', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentIds: ids,
          confirm: confirm
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // 🚨 Error específico de confirmación requerida
        if (response.status === 400 && result.details?.includes('confirmation required')) {
          const error = 'Confirmation required for bulk deletion';
          onError?.(error);
          return { success: false, error };
        }

        // 🚨 Error específico de permisos
        if (response.status === 403) {
          const error = result.details || 'No tienes permisos para eliminación masiva';
          onError?.(error);
          return { success: false, error };
        }

        const error = result.details || result.error || 'Error en eliminación masiva';
        onError?.(error);
        return { success: false, error };
      }

      // ✅ Éxito
      console.log('✅ Bulk deletion completed:', result.data);
      onSuccess?.(result.data);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de red en eliminación masiva';
      console.error('❌ Bulk delete error:', error);
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsDeleting(false);
    }
  }, [user?.id, user?.role]);

  // 🔍 Verificar si un documento se está eliminando
  const isDeletingDocument = useCallback((id: string) => {
    return deletingIds.has(id);
  }, [deletingIds]);

  // 🔐 Verificar permisos de eliminación
  const canDeleteDocument = useCallback((document: { 
    createdBy: string; 
    status: string; 
    workspace: string 
  }) => {
    if (!user) return false;

    // 🔐 Administradores pueden eliminar cualquier documento
    if (user.role === 'administrador') return true;

    // 📝 El creador puede eliminar sus propios borradores
    if (document.createdBy === user.id && document.status === 'draft') return true;

    // 📋 Secretarios pueden eliminar documentos de su workspace (no archivados)
    if (user.role.includes('secretario') && document.status !== 'archived') {
      // TODO: Verificar workspace específico
      return true;
    }

    // 👥 Presidente/Vicepresidente pueden eliminar documentos no archivados
    if (['presidente', 'vicepresidente'].includes(user.role) && document.status !== 'archived') {
      return true;
    }

    return false;
  }, [user]);

  return {
    // Estado
    isDeleting,
    deletingIds,
    isDeletingDocument,

    // Acciones
    deleteDocument,
    deleteDocuments,
    
    // Utilidades
    canDeleteDocument
  };
}; 