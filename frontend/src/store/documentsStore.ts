import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';

// 🚨 Tipo para errores de API
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

// 🎯 Tipos para el store de documentos
interface Document {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
  workspaceId: string;
  status: 'active' | 'archived' | 'deleted';
  tags?: string[];
  description?: string;
  version: number;
  checksum: string;
  uploadedAt: string;
  updatedAt: string;
  
  // Relaciones
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
  workspace?: {
    id: string;
    name: string;
  };
  activities?: DocumentActivity[];
}

interface DocumentActivity {
  id: string;
  documentId: string;
  userId: string;
  action: 'uploaded' | 'viewed' | 'downloaded' | 'archived' | 'restored' | 'deleted';
  metadata?: Record<string, unknown>;
  createdAt: string;
  
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface DocumentFilters {
  workspaceId?: string;
  status?: 'active' | 'archived' | 'deleted';
  mimeType?: string;
  uploaderId?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  search?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface DocumentsState {
  // 📊 Estado
  documents: Document[];
  selectedDocuments: string[];
  currentDocument: Document | null;
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  
  // 🔍 Filtros y paginación
  filters: DocumentFilters;
  pagination: PaginationInfo;
  sortBy: 'name' | 'uploadedAt' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
  
  // 📊 Estadísticas
  stats: {
    totalDocuments: number;
    totalSize: number;
    byWorkspace: Record<string, number>;
    byMimeType: Record<string, number>;
    recentActivity: DocumentActivity[];
  };
  
  // 🚀 Acciones
  // Obtener documentos
  fetchDocuments: (filters?: DocumentFilters, page?: number) => Promise<void>;
  fetchDocumentById: (id: string) => Promise<Document | null>;
  fetchDocumentStats: () => Promise<void>;
  
  // Subir documentos
  uploadDocument: (file: File, workspaceId: string, metadata?: { description?: string; tags?: string[] }) => Promise<{ success: boolean; error?: string; document?: Document }>;
  uploadMultipleDocuments: (files: File[], workspaceId: string) => Promise<{ success: boolean; results: Array<{ success: boolean; error?: string; document?: Document }> }>;
  
  // Acciones de documentos
  downloadDocument: (id: string) => Promise<void>;
  archiveDocument: (id: string) => Promise<{ success: boolean; error?: string }>;
  restoreDocument: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteDocument: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateDocument: (id: string, data: { description?: string; tags?: string[] }) => Promise<{ success: boolean; error?: string }>;
  
  // Acciones múltiples
  archiveDocuments: (ids: string[]) => Promise<{ success: boolean; results: Array<{ id: string; success: boolean; error?: string }> }>;
  deleteDocuments: (ids: string[]) => Promise<{ success: boolean; results: Array<{ id: string; success: boolean; error?: string }> }>;
  
  // Selección
  selectDocument: (id: string) => void;
  selectMultipleDocuments: (ids: string[]) => void;
  unselectDocument: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Filtros y orden
  setFilters: (filters: Partial<DocumentFilters>) => void;
  clearFilters: () => void;
  setSorting: (sortBy: DocumentsState['sortBy'], sortOrder: DocumentsState['sortOrder']) => void;
  setPage: (page: number) => void;
  
  // Utils
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
}

// 🎨 Estado inicial
const initialState = {
  documents: [],
  selectedDocuments: [],
  currentDocument: null,
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,
  
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  sortBy: 'uploadedAt' as const,
  sortOrder: 'desc' as const,
  
  stats: {
    totalDocuments: 0,
    totalSize: 0,
    byWorkspace: {},
    byMimeType: {},
    recentActivity: [],
  },
};

// ✨ Store de documentos
export const useDocumentsStore = create<DocumentsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 📄 Obtener documentos
      fetchDocuments: async (filters = {}, page = 1) => {
        set({ isLoading: true, error: null });
        
        try {
          const currentFilters = { ...get().filters, ...filters };
          const { sortBy, sortOrder, pagination } = get();
          
          const response = await axios.get('/api/documents', {
            params: {
              ...currentFilters,
              page,
              limit: pagination.limit,
              sortBy,
              sortOrder,
            },
          });

          const { documents, pagination: newPagination } = response.data.data;
          
          set({
            documents,
            pagination: newPagination,
            filters: currentFilters,
            isLoading: false,
          });
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al obtener documentos';
          set({
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      fetchDocumentById: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await axios.get(`/api/documents/${id}`);
          const document = response.data.data;
          
          set({
            currentDocument: document,
            isLoading: false,
          });
          
          return document;
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al obtener documento';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return null;
        }
      },

      fetchDocumentStats: async () => {
        try {
          const response = await axios.get('/api/documents/stats');
          const stats = response.data.data;
          
          set({ stats });
        } catch (error) {
          console.error('Error al obtener estadísticas:', error);
        }
      },

      // 📤 Upload de documentos
      uploadDocument: async (file: File, workspaceId: string, metadata = {}) => {
        set({ isUploading: true, uploadProgress: 0, error: null });
        
        try {
          const formData = new FormData();
          formData.append('document', file);
          formData.append('workspaceId', workspaceId);
          
          if (metadata.description) {
            formData.append('description', metadata.description);
          }
          
          if (metadata.tags) {
            formData.append('tags', JSON.stringify(metadata.tags));
          }

          const response = await axios.post('/api/documents/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                set({ uploadProgress: progress });
              }
            },
          });

          const document = response.data.data;
          
          // Agregar el documento a la lista
          set((state) => ({
            documents: [document, ...state.documents],
            isUploading: false,
            uploadProgress: 0,
          }));

          return { success: true, document };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al subir documento';
          set({
            isUploading: false,
            uploadProgress: 0,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },

      uploadMultipleDocuments: async (files: File[], workspaceId: string) => {
        const results = [];
        
        for (const file of files) {
          const result = await get().uploadDocument(file, workspaceId);
          results.push(result);
        }
        
        const successCount = results.filter(r => r.success).length;
        
        return {
          success: successCount > 0,
          results,
        };
      },

      // 📥 Descargar documento
      downloadDocument: async (id: string) => {
        try {
          const response = await axios.get(`/api/documents/${id}/download`, {
            responseType: 'blob',
          });

          // Crear URL y descargar archivo
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          
          // Obtener nombre del archivo del header
          const disposition = response.headers['content-disposition'];
          const filename = disposition?.match(/filename="(.+)"/)?.[1] || `document-${id}`;
          link.download = filename;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al descargar documento';
          set({ error: errorMessage });
        }
      },

      // 🗃️ Archivar documento
      archiveDocument: async (id: string) => {
        try {
          await axios.patch(`/api/documents/${id}/archive`);
          
          // Actualizar documento en la lista
          set((state) => ({
            documents: state.documents.map(doc =>
              doc.id === id ? { ...doc, status: 'archived' as const } : doc
            ),
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al archivar documento';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // 🔄 Restaurar documento
      restoreDocument: async (id: string) => {
        try {
          await axios.patch(`/api/documents/${id}/restore`);
          
          set((state) => ({
            documents: state.documents.map(doc =>
              doc.id === id ? { ...doc, status: 'active' as const } : doc
            ),
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al restaurar documento';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // 🗑️ Eliminar documento
      deleteDocument: async (id: string) => {
        try {
          await axios.delete(`/api/documents/${id}`);
          
          set((state) => ({
            documents: state.documents.filter(doc => doc.id !== id),
            selectedDocuments: state.selectedDocuments.filter(selectedId => selectedId !== id),
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al eliminar documento';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // ✏️ Actualizar documento
      updateDocument: async (id: string, data: { description?: string; tags?: string[] }) => {
        try {
          const response = await axios.put(`/api/documents/${id}`, data);
          const updatedDocument = response.data.data;
          
          set((state) => ({
            documents: state.documents.map(doc =>
              doc.id === id ? updatedDocument : doc
            ),
            currentDocument: state.currentDocument?.id === id ? updatedDocument : state.currentDocument,
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al actualizar documento';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // 📋 Acciones múltiples
      archiveDocuments: async (ids: string[]) => {
        const results = [];
        
        for (const id of ids) {
          const result = await get().archiveDocument(id);
          results.push({ id, ...result });
        }
        
        const successCount = results.filter(r => r.success).length;
        
        return {
          success: successCount > 0,
          results,
        };
      },

      deleteDocuments: async (ids: string[]) => {
        const results = [];
        
        for (const id of ids) {
          const result = await get().deleteDocument(id);
          results.push({ id, ...result });
        }
        
        const successCount = results.filter(r => r.success).length;
        
        return {
          success: successCount > 0,
          results,
        };
      },

      // ✅ Selección
      selectDocument: (id: string) => {
        set((state) => ({
          selectedDocuments: state.selectedDocuments.includes(id)
            ? state.selectedDocuments
            : [...state.selectedDocuments, id],
        }));
      },

      selectMultipleDocuments: (ids: string[]) => {
        set({ selectedDocuments: ids });
      },

      unselectDocument: (id: string) => {
        set((state) => ({
          selectedDocuments: state.selectedDocuments.filter(selectedId => selectedId !== id),
        }));
      },

      clearSelection: () => set({ selectedDocuments: [] }),

      selectAll: () => {
        const { documents } = get();
        set({ selectedDocuments: documents.map(doc => doc.id) });
      },

      // 🔍 Filtros y orden
      setFilters: (newFilters: Partial<DocumentFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
        
        // Recargar documentos con nuevos filtros
        get().fetchDocuments();
      },

      clearFilters: () => {
        set({ filters: {} });
        get().fetchDocuments();
      },

      setSorting: (sortBy: DocumentsState['sortBy'], sortOrder: DocumentsState['sortOrder']) => {
        set({ sortBy, sortOrder });
        get().fetchDocuments();
      },

      setPage: (page: number) => {
        get().fetchDocuments(undefined, page);
      },

      // 🛠️ Utils
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      resetStore: () => set(initialState),
    }),
    {
      name: 'DocumentsStore',
    }
  )
);

// 🎯 Selectores para optimizar renders
export const documentsSelectors = {
  documents: (state: DocumentsState) => state.documents,
  selectedDocuments: (state: DocumentsState) => state.selectedDocuments,
  currentDocument: (state: DocumentsState) => state.currentDocument,
  isLoading: (state: DocumentsState) => state.isLoading,
  isUploading: (state: DocumentsState) => state.isUploading,
  uploadProgress: (state: DocumentsState) => state.uploadProgress,
  error: (state: DocumentsState) => state.error,
  filters: (state: DocumentsState) => state.filters,
  pagination: (state: DocumentsState) => state.pagination,
  stats: (state: DocumentsState) => state.stats,
  hasSelection: (state: DocumentsState) => state.selectedDocuments.length > 0,
  selectionCount: (state: DocumentsState) => state.selectedDocuments.length,
};
