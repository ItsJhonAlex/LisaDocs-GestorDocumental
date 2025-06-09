import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { documentService } from '@/services/documentService';
import type {
  Document,
  DocumentsResponse,
  DocumentFilters,
  UploadFile,
  DocumentStats,
  LoadingState,
  WorkspaceType
} from '@/types/document';

interface UseDocumentsOptions extends DocumentFilters {
  autoLoad?: boolean;
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

  // 📋 ============ OPERACIONES DE LECTURA ============

  /**
   * 📊 Cargar documentos con filtros actuales
   */
  const loadDocuments = useCallback(async (newFilters?: DocumentFilters) => {
    const filtersToUse = newFilters || filters;
    
    setLoading(prev => ({ ...prev, documents: true }));
    setError(null);

    try {
      const response: DocumentsResponse = await documentService.getDocuments(filtersToUse);
      
      setDocuments(response.documents);
      setPagination(response.pagination);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar documentos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, documents: false }));
    }
  }, [filters]);

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
    const updatedFilters = { ...filters, ...newFilters, offset: 0 }; // Reset offset
    setFilters(updatedFilters);
    await loadDocuments(updatedFilters);
  }, [filters, loadDocuments]);

  /**
   * 📄 Cambiar página
   */
  const changePage = useCallback(async (page: number) => {
    const offset = (page - 1) * (filters.limit || 20);
    const newFilters = { ...filters, offset };
    setFilters(newFilters);
    await loadDocuments(newFilters);
  }, [filters, loadDocuments]);

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

  // 📊 ============ VALORES COMPUTED ============

  const isLoading = Object.values(loading).some(Boolean);
  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  const totalPages = Math.ceil(pagination.total / (filters.limit || 20));

  // 🎯 ============ RETURN ============

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
