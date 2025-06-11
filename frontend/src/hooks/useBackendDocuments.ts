import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

// 🎯 Tipos del backend
export type WorkspaceType = 'cam' | 'ampp' | 'presidencia' | 'intendencia' | 'comisiones_cf';
export type DocumentStatus = 'draft' | 'stored' | 'archived';

export interface BackendDocument {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  workspace: WorkspaceType;
  status: DocumentStatus;
  tags: string[];
  createdAt: string;
  createdByUser: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export interface BackendDocumentFilters {
  workspace?: WorkspaceType;
  status?: DocumentStatus;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface BackendDocumentResponse {
  documents: BackendDocument[];
  total: number;
  hasMore: boolean;
}

export const useBackendDocuments = (initialFilters: BackendDocumentFilters = {}) => {
  const [documents, setDocuments] = useState<BackendDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { user } = useAuth();

  // 📄 Obtener documentos del backend
  const fetchDocuments = async (filters: BackendDocumentFilters = {}): Promise<BackendDocumentResponse> => {
    const params = new URLSearchParams();
    
    // Agregar filtros a los parámetros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`/api/documents?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || 'Error al cargar documentos');
    }

    const result = await response.json();
    return result.data;
  };

  // 🔄 Cargar documentos
  const loadDocuments = async (filters: BackendDocumentFilters = initialFilters) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchDocuments(filters);
      setDocuments(result.documents);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  // ➕ Cargar más documentos (paginación)
  const loadMore = async (filters: BackendDocumentFilters = {}) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newFilters = {
        ...initialFilters,
        ...filters,
        offset: documents.length
      };
      
      const result = await fetchDocuments(newFilters);
      setDocuments(prev => [...prev, ...result.documents]);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar más documentos');
    } finally {
      setLoading(false);
    }
  };

  // 📥 Descargar documento
  const downloadDocument = async (id: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar documento');
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al descargar documento');
    }
  };

  // 🔄 Cambiar estado de documento
  const changeStatus = async (id: string, status: DocumentStatus, reason?: string) => {
    try {
      const response = await fetch(`/api/documents/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cambiar estado');
      }

      const result = await response.json();
      const updatedDocument = result.data;

      // Actualizar documento en la lista local
      setDocuments(prev => 
        prev.map(doc => doc.id === id ? updatedDocument : doc)
      );

      return updatedDocument;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  // 🗑️ Eliminar documento
  const deleteDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al eliminar documento');
      }

      // Remover documento de la lista local
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar documento');
    }
  };

  // 📊 Obtener estadísticas
  const getStats = async (workspace?: WorkspaceType) => {
    try {
      const params = workspace ? `?workspace=${workspace}` : '';
      const response = await fetch(`/api/documents/stats${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    }
  };

  // 🔍 Buscar documentos
  const searchDocuments = async (query: string, filters: BackendDocumentFilters = {}) => {
    return fetchDocuments({ ...filters, search: query });
  };

  // ➕ Agregar documentos a la lista (después del upload)
  const addDocuments = (newDocuments: BackendDocument[]) => {
    setDocuments(prev => [...newDocuments, ...prev]);
    setTotal(prev => prev + newDocuments.length);
  };

  // 🔄 Refrescar lista
  const refresh = () => {
    loadDocuments(initialFilters);
  };

  // Cargar documentos iniciales
  useEffect(() => {
    if (user) {
      loadDocuments(initialFilters);
    }
  }, [user]);

  return {
    // Estado
    documents,
    loading,
    error,
    total,
    hasMore,

    // Acciones
    loadDocuments,
    loadMore,
    downloadDocument,
    changeStatus,
    deleteDocument,
    getStats,
    searchDocuments,
    addDocuments,
    refresh
  };
}; 