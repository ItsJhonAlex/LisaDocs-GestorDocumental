import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

import { documentService } from '@/services/documentService';
import type {
  Document,
  DocumentFilters,
  UploadFile,
  DocumentStats,
  LoadingState,
  WorkspaceType
} from '@/types/document';

interface UseDocumentsOptions extends DocumentFilters {
  autoLoad?: boolean;
  limit?: number;
  offset?: number;
}

interface DocumentResponse {
  documents: Document[];
  total: number;
  hasMore: boolean;
}

/**
 * 📄 Hook personalizado para gestión de documentos
 * 
 * Proporciona toda la funcionalidad CRUD y estado para documentos
 */
export function useDocuments(options: UseDocumentsOptions = {}) {
  const { autoLoad = false, ...initialFilters } = options;
  // 📊 Estado principal
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filters, setFilters] = useState<DocumentFilters>(initialFilters);
  const [paginationOptions, setPaginationOptions] = useState({
    limit: options.limit || 20,
    offset: options.offset || 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  // 🔄 Estados de carga
  const [loading, setLoading] = useState<LoadingState>({
    documents: false,
    uploading: false,
    downloading: false,
    updating: false,
    deleting: false
  });

  // ⚠️ Estados de error
  const [error, setError] = useState<string | null>(null);

  // 📊 Estadísticas
  const [stats, setStats] = useState<DocumentStats | null>(null);



  // 📄 Obtener documentos del backend
  const fetchDocuments = async (
    filters: DocumentFilters = {}, 
    paginationOpts?: { limit?: number; offset?: number }
  ): Promise<DocumentResponse> => {
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

    // Agregar paginación
    const { limit = 20, offset = 0 } = paginationOpts || paginationOptions;
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

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

  // 📋 ============ OPERACIONES DE LECTURA ============

  /**
   * 📊 Cargar documentos con filtros actuales
   */
  const loadDocuments = useCallback(async (
    newFilters?: DocumentFilters, 
    newPaginationOpts?: { limit?: number; offset?: number }
  ) => {
    const filtersToUse = newFilters || filters;
    const paginationToUse = newPaginationOpts || paginationOptions;
    
    setLoading(prev => ({ ...prev, documents: true }));
    setError(null);

    try {
      const result = await fetchDocuments(filtersToUse, paginationToUse);
      
      setDocuments(result.documents);
      setPagination(prev => ({
        ...prev,
        total: result.total,
        hasMore: result.hasMore
      }));
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar documentos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, documents: false }));
    }
  }, [filters, paginationOptions]);

  /**
   * 🔄 Recargar documentos (sin cambiar filtros)
   */
  const refreshDocuments = useCallback(async () => {
    await loadDocuments();
  }, [loadDocuments]);

  /**
   * 📄 Obtener un documento específico
   */
  const getDocument = useCallback(async (id: string): Promise<Document | null> => {
    try {
      const document = await documentService.getDocumentById(id);
      return document;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al obtener el documento';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * 📊 Cargar estadísticas
   */
  const loadStats = useCallback(async (workspace?: WorkspaceType) => {
    try {
      const documentStats = await documentService.getDocumentStats(workspace);
      setStats(documentStats);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      // No mostrar toast para stats, es menos crítico
    }
  }, []);

  // 📤 ============ OPERACIONES DE ESCRITURA ============

  /**
   * 📤 Subir nuevo documento
   */
  const uploadDocument = useCallback(async (uploadFile: UploadFile): Promise<Document | null> => {
    setLoading(prev => ({ ...prev, uploading: true }));

    try {
      const result = await documentService.uploadDocument(uploadFile);
      
      if (result.success) {
        toast.success(result.message || 'Documento subido correctamente');
        
        // 🔄 Actualizar lista de documentos
        await refreshDocuments();
        
        return result.document;
      } else {
        throw new Error(result.message || 'Error al subir documento');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al subir el documento';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, uploading: false }));
    }
  }, [refreshDocuments]);

  /**
   * 📤 Subir múltiples documentos
   */
  const uploadMultipleDocuments = useCallback(async (uploadFiles: UploadFile[]): Promise<Document[]> => {
    setLoading(prev => ({ ...prev, uploading: true }));
    const uploadedDocuments: Document[] = [];

    try {
      // Subir uno por uno para mejor control de errores
      for (const uploadFile of uploadFiles) {
        try {
          const result = await documentService.uploadDocument(uploadFile);
          
          if (result.success) {
            uploadedDocuments.push(result.document);
          }
        } catch (err: any) {
          toast.error(`Error subiendo ${uploadFile.file.name}: ${err.message}`);
        }
      }

      if (uploadedDocuments.length > 0) {
        toast.success(`${uploadedDocuments.length} documento(s) subido(s) correctamente`);
        await refreshDocuments();
      }

      return uploadedDocuments;
    } finally {
      setLoading(prev => ({ ...prev, uploading: false }));
    }
  }, [refreshDocuments]);

  /**
   * 🗑️ Eliminar documento
   */
  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    setLoading(prev => ({ ...prev, deleting: true }));

    try {
      await documentService.deleteDocument(id);
      
      toast.success('Documento eliminado correctamente');
      
      // 🔄 Actualizar lista removiendo el documento
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al eliminar el documento';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(prev => ({ ...prev, deleting: false }));
    }
  }, []);

  /**
   * 📦 Archivar documento
   */
  const archiveDocument = useCallback(async (id: string): Promise<boolean> => {
    setLoading(prev => ({ ...prev, updating: true }));

    try {
      const updatedDocument = await documentService.archiveDocument(id);
      
      toast.success('Documento archivado correctamente');
      
      // 🔄 Actualizar el documento en la lista
      setDocuments(prev => 
        prev.map(doc => doc.id === id ? updatedDocument : doc)
      );
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al archivar el documento';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  }, []);

  /**
   * 🔄 Restaurar documento archivado
   */
  const restoreDocument = useCallback(async (id: string): Promise<boolean> => {
    setLoading(prev => ({ ...prev, updating: true }));

    try {
      const updatedDocument = await documentService.restoreDocument(id);
      
      toast.success('Documento restaurado correctamente');
      
      // 🔄 Actualizar el documento en la lista
      setDocuments(prev => 
        prev.map(doc => doc.id === id ? updatedDocument : doc)
      );
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al restaurar el documento';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  }, []);

  /**
   * 📥 Descargar documento
   */
  const downloadDocument = useCallback(async (id: string): Promise<boolean> => {
    setLoading(prev => ({ ...prev, downloading: true }));

    try {
      const downloadInfo = await documentService.downloadDocument(id);
      
      // 🔗 Crear link temporal y hacer clic automático
      const link = document.createElement('a');
      link.href = downloadInfo.downloadUrl;
      link.download = downloadInfo.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 🧹 Limpiar URL temporal
      URL.revokeObjectURL(downloadInfo.downloadUrl);
      
      toast.success('Descarga iniciada correctamente');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al descargar el documento';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(prev => ({ ...prev, downloading: false }));
    }
  }, []);

  // 🔍 ============ FILTROS Y BÚSQUEDA ============

  /**
   * 🔍 Actualizar filtros y recargar
   */
  const updateFilters = useCallback(async (newFilters: Partial<DocumentFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    const resetPagination = { ...paginationOptions, offset: 0 }; // Reset offset
    setFilters(updatedFilters);
    setPaginationOptions(resetPagination);
    await loadDocuments(updatedFilters, resetPagination);
  }, [filters, paginationOptions, loadDocuments]);

  /**
   * 📄 Cambiar página
   */
  const changePage = useCallback(async (page: number) => {
    const offset = (page - 1) * paginationOptions.limit;
    const newPaginationOptions = { ...paginationOptions, offset };
    setPaginationOptions(newPaginationOptions);
    await loadDocuments(filters, newPaginationOptions);
  }, [filters, loadDocuments, paginationOptions]);

  /**
   * 🔍 Búsqueda rápida
   */
  const searchDocuments = useCallback(async (query: string) => {
    await updateFilters({ search: query });
  }, [updateFilters]);

  // 🎯 ============ EFECTOS ============

  /**
   * 🚀 Cargar documentos inicial si autoLoad está habilitado
   */
  useEffect(() => {
    if (autoLoad) {
      loadDocuments();
    }
  }, [autoLoad, loadDocuments]); // Solo al montar si autoLoad

  /**
   * 📊 Cargar estadísticas inicial si autoLoad está habilitado
   */
  useEffect(() => {
    if (autoLoad) {
      loadStats();
    }
  }, [autoLoad, loadStats]); // Solo al montar si autoLoad

  // 🎯 ============ RETURN ============

  const isLoading = Object.values(loading).some(Boolean);
  const currentPage = Math.floor(paginationOptions.offset / paginationOptions.limit) + 1;
  const totalPages = Math.ceil(pagination.total / paginationOptions.limit);

  return {
    // 📊 Estado
    documents,
    filters,
    pagination,
    loading,
    error,
    stats,
    
    // 📊 Valores computed
    isLoading,
    currentPage,
    totalPages,
    
    // 📋 Operaciones de lectura
    loadDocuments,
    refreshDocuments,
    getDocument,
    loadStats,
    
    // 📤 Operaciones de escritura
    uploadDocument,
    uploadMultipleDocuments,
    deleteDocument,
    archiveDocument,
    restoreDocument,
    downloadDocument,
    
    // 🔍 Filtros y búsqueda
    updateFilters,
    changePage,
    searchDocuments,
    setFilters
  };
}
