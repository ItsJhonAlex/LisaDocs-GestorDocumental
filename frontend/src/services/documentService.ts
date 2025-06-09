import { apiClient, type ApiResponse } from '@/api/client';
import type {
  Document,
  DocumentsResponse,
  DocumentFilters,
  UploadFile,
  UploadResult,
  DocumentStats,
  DownloadInfo,
  WorkspaceType
} from '@/types/document';

/**
 * 📄 Servicio de Documentos para LisaDocs
 * 
 * Conecta con los endpoints del backend FastAPI para todas las operaciones CRUD
 */
export class DocumentService {
  private readonly baseUrl = '/documents';

  /**
   * 📊 Obtener lista de documentos con filtros y paginación
   */
  async getDocuments(filters: DocumentFilters = {}): Promise<DocumentsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.workspace) params.append('workspace', filters.workspace);
      if (filters.status) params.append('status', filters.status);
      if (filters.createdBy) params.append('createdBy', filters.createdBy);
      if (filters.search) params.append('search', filters.search);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      if (filters.orderBy) params.append('orderBy', filters.orderBy);
      if (filters.orderDirection) params.append('orderDirection', filters.orderDirection);

      const response = await apiClient.get<ApiResponse<DocumentsResponse>>(
        `${this.baseUrl}?${params.toString()}`
      );

      return response.data.data;
    } catch (error) {
      console.error('❌ Error getting documents:', error);
      throw this.handleError(error, 'Error al obtener documentos');
    }
  }

  /**
   * 📄 Obtener documento específico por ID
   */
  async getDocumentById(id: string): Promise<Document> {
    try {
      const response = await apiClient.get<ApiResponse<Document>>(
        `${this.baseUrl}/${id}`
      );
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error getting document:', error);
      throw this.handleError(error, 'Error al obtener el documento');
    }
  }

  /**
   * 📤 Subir nuevo documento
   */
  async uploadDocument(uploadData: UploadFile): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('title', uploadData.title);
      formData.append('workspace', uploadData.workspace);
      
      if (uploadData.description) {
        formData.append('description', uploadData.description);
      }
      
      if (uploadData.tags?.length) {
        formData.append('tags', uploadData.tags.join(','));
      }

      const response = await apiClient.post<ApiResponse<Document>>(
        this.baseUrl,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return {
        document: response.data.data,
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw this.handleError(error, 'Error al subir el documento');
    }
  }

  /**
   * 🗑️ Eliminar documento
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      throw this.handleError(error, 'Error al eliminar el documento');
    }
  }

  /**
   * 📦 Archivar documento
   */
  async archiveDocument(id: string): Promise<Document> {
    try {
      const response = await apiClient.put<ApiResponse<Document>>(
        `${this.baseUrl}/${id}/archive`,
        { action: 'archive' }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error archiving document:', error);
      throw this.handleError(error, 'Error al archivar el documento');
    }
  }

  /**
   * 🔄 Restaurar documento archivado
   */
  async restoreDocument(id: string): Promise<Document> {
    try {
      const response = await apiClient.put<ApiResponse<Document>>(
        `${this.baseUrl}/${id}/archive`,
        { action: 'restore' }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error restoring document:', error);
      throw this.handleError(error, 'Error al restaurar el documento');
    }
  }

  /**
   * 📥 Descargar documento
   */
  async downloadDocument(id: string): Promise<DownloadInfo> {
    try {
      const response = await apiClient.get<Blob>(
        `${this.baseUrl}/${id}/download`,
        {
          responseType: 'blob',
        }
      );

      const contentDisposition = response.headers['content-disposition'] || '';
      const fileName = this.extractFileNameFromHeader(contentDisposition) || 'documento';
      const fileSize = parseInt(response.headers['content-length'] || '0');
      const mimeType = response.headers['content-type'] || 'application/octet-stream';

      const blob = new Blob([response.data], { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);

      return {
        fileName,
        fileSize,
        mimeType,
        downloadUrl
      };
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      throw this.handleError(error, 'Error al descargar el documento');
    }
  }

  /**
   * 📊 Obtener estadísticas de documentos
   */
  async getDocumentStats(workspace?: WorkspaceType): Promise<DocumentStats> {
    try {
      const params = workspace ? `?workspace=${workspace}` : '';
      const response = await apiClient.get<ApiResponse<DocumentStats>>(
        `${this.baseUrl}/stats${params}`
      );
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error getting document stats:', error);
      throw this.handleError(error, 'Error al obtener estadísticas');
    }
  }

  /**
   * 🔧 Manejar errores de manera consistente
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error.response?.data?.error) {
      return new Error(error.response.data.error);
    }
    
    if (error.response?.data?.details) {
      return new Error(error.response.data.details);
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }

  /**
   * 📝 Extraer nombre de archivo del header Content-Disposition
   */
  private extractFileNameFromHeader(contentDisposition: string): string | null {
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      return match[1].replace(/['"]/g, '');
    }
    return null;
  }
}

// 🌟 Exportar instancia única del servicio
export const documentService = new DocumentService();
export default documentService;