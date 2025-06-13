import { useState } from 'react'

// 📋 Tipos para el hook
interface UseDocumentStatusOptions {
  onSuccess?: (documentId: string, newStatus: string) => void
  onError?: (error: Error) => void
}

interface ChangeStatusResponse {
  success: boolean
  message: string
  data: {
    id: string
    title: string
    status: string
    previousStatus: string
    changedAt: string
    changedBy: {
      id: string
      fullName: string
      email: string
      role: string
    }
  }
}

export function useDocumentStatus(options: UseDocumentStatusOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 🔄 Cambiar estado de documento
   */
  const changeDocumentStatus = async (
    documentId: string,
    newStatus: string,
    reason?: string
  ): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Changing document status:', {
        documentId,
        newStatus,
        reason
      })

      const response = await fetch(`/api/documents/${documentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          status: newStatus,
          ...(reason && { reason })
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || 
          errorData.message || 
          `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const result: ChangeStatusResponse = await response.json()

      console.log('✅ Document status changed successfully:', result.data)

      // 🎉 Callback de éxito
      options.onSuccess?.(documentId, newStatus)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error changing document status:', errorMessage)
      
      setError(errorMessage)
      
      // 🚨 Callback de error
      options.onError?.(err instanceof Error ? err : new Error(errorMessage))
      
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 🔍 Verificar si un usuario puede cambiar el estado de un documento
   */
  const canChangeStatus = (
    document: any,
    currentUserId: string,
    userRole: string
  ): { canChange: boolean; reason?: string } => {
    // 🔐 Administradores pueden cambiar cualquier estado
    if (userRole === 'administrador') {
      return { canChange: true }
    }

    // 👑 Presidente y vicepresidente pueden cambiar cualquier estado
    if (['presidente', 'vicepresidente'].includes(userRole)) {
      return { canChange: true }
    }

    // 👤 El creador puede cambiar el estado de sus propios documentos
    if (document.createdBy === currentUserId || document.createdByUser?.id === currentUserId) {
      return { canChange: true }
    }

    // 📝 Secretarios pueden cambiar estados en su workspace
    if (['secretario_cam', 'secretario_ampp', 'secretario_cf'].includes(userRole)) {
      // TODO: Verificar si el workspace coincide con el del usuario
      return { canChange: true }
    }

    // 🏢 Intendente puede cambiar estados en intendencia
    if (userRole === 'intendente' && document.workspace === 'intendencia') {
      return { canChange: true }
    }

    // 👥 Miembros CF pueden cambiar estados en comisiones_cf
    if (userRole === 'cf_member' && document.workspace === 'comisiones_cf') {
      return { canChange: true }
    }

    return { 
      canChange: false, 
      reason: 'No tienes permisos para cambiar el estado de este documento' 
    }
  }

  /**
   * 🎯 Obtener estados disponibles según el estado actual
   */
  const getAvailableStatuses = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case 'draft':
        return ['stored'] // Borrador puede ir a Publicado
      case 'stored':
        return ['draft', 'archived'] // Publicado puede ir a Borrador o Archivado
      case 'archived':
        return ['stored'] // Archivado puede volver a Publicado
      default:
        return ['draft', 'stored', 'archived']
    }
  }

  /**
   * 🏷️ Obtener información de un estado
   */
  const getStatusInfo = (status: string) => {
    const statusConfig = {
      draft: {
        label: 'Borrador',
        description: 'Solo visible para el creador',
        color: 'yellow',
        icon: 'FileText'
      },
      stored: {
        label: 'Publicado',
        description: 'Visible para usuarios con permisos',
        color: 'green',
        icon: 'Eye'
      },
      archived: {
        label: 'Archivado',
        description: 'Documento archivado',
        color: 'gray',
        icon: 'Archive'
      }
    }

    return statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      description: 'Estado desconocido',
      color: 'gray',
      icon: 'FileText'
    }
  }

  /**
   * 🔄 Limpiar error
   */
  const clearError = () => {
    setError(null)
  }

  return {
    // Estado
    isLoading,
    error,
    
    // Acciones
    changeDocumentStatus,
    clearError,
    
    // Utilidades
    canChangeStatus,
    getAvailableStatuses,
    getStatusInfo
  }
} 