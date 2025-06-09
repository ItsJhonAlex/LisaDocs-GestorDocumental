// 🎯 Tipos para el sistema de documentos LisaDocs
// Sincronizados con el backend Prisma schema

// 📋 Enums del backend
export type DocumentStatus = 'draft' | 'stored' | 'archived';

export type WorkspaceType = 
  | 'cam' 
  | 'ampp' 
  | 'presidencia' 
  | 'intendencia' 
  | 'comisiones_cf';

export type UserRole = 
  | 'administrador'
  | 'presidente' 
  | 'vicepresidente'
  | 'secretario_cam'
  | 'secretario_ampp'
  | 'secretario_cf'
  | 'intendente'
  | 'cf_member';

// 👤 Usuario simplificado para documentos
export interface DocumentUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

// 📄 Documento principal
export interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  fileHash?: string;
  status: DocumentStatus;
  workspace: WorkspaceType;
  tags: string[];
  metadata: Record<string, any>;
  createdBy: string;
  createdByUser: DocumentUser;
  storedAt?: string;
  archivedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 📤 Datos para crear documento
export interface CreateDocumentData {
  title: string;
  description?: string;
  workspace: WorkspaceType;
  tags?: string[];
  metadata?: Record<string, any>;
}

// ✏️ Datos para actualizar documento
export interface UpdateDocumentData {
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// 🔍 Filtros para documentos
export interface DocumentFilters {
  workspace?: WorkspaceType;
  status?: DocumentStatus;
  createdBy?: string;
  search?: string;
  tags?: string[];
  dateFrom?: string; // ISO string
  dateTo?: string;   // ISO string
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'title' | 'fileSize';
  orderDirection?: 'asc' | 'desc';
}

// 📊 Paginación
export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// 📋 Respuesta de lista de documentos
export interface DocumentsResponse {
  documents: Document[];
  pagination: PaginationInfo;
}

// 📊 Estadísticas de documentos
export interface DocumentStats {
  total: number;
  byStatus: Record<DocumentStatus, number>;
  byWorkspace: Record<WorkspaceType, number>;
  totalSize: string; // Formato humano (ej: "150.5 MB")
}

// 📤 Archivo para subir
export interface UploadFile {
  file: File;
  title: string;
  description?: string;
  workspace: WorkspaceType;
  tags?: string[];
}

// 📤 Resultado de subida
export interface UploadResult {
  document: Document;
  success: boolean;
  message?: string;
}

// 📥 Información de descarga
export interface DownloadInfo {
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
}

// 🔄 Actividad de documento
export interface DocumentActivity {
  id: string;
  documentId: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: Pick<DocumentUser, 'id' | 'fullName'>;
}

// ⚠️ Errores específicos de documentos
export interface DocumentError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

// 🔐 Permisos de documento
export interface DocumentPermissions {
  canView: boolean;
  canDownload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canShare: boolean;
  canManage: boolean;
}

// 📝 Estados de validación para forms
export interface ValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

// 🔄 Estados de carga
export interface LoadingState {
  documents: boolean;
  uploading: boolean;
  downloading: boolean;
  updating: boolean;
  deleting: boolean;
}

// 🎯 Respuestas de API estándar
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
  code?: string;
}

// 📊 Opciones de visualización
export interface ViewOptions {
  layout: 'grid' | 'list' | 'compact';
  showPreview: boolean;
  showMetadata: boolean;
  groupBy?: 'status' | 'workspace' | 'date' | 'type';
  sortBy: keyof Document;
  sortOrder: 'asc' | 'desc';
}

// 🔍 Configuración de búsqueda
export interface SearchConfig {
  query: string;
  fields: Array<keyof Document>;
  caseSensitive: boolean;
  exactMatch: boolean;
  fuzzy: boolean;
}

// 📁 Información de workspace para documentos
export interface WorkspaceInfo {
  type: WorkspaceType;
  name: string;
  description: string;
  icon: string;
  canAccess: boolean;
  documentCount: number;
  lastActivity?: string;
}

// 🏷️ Tag predefinido del sistema
export interface SystemTag {
  id: string;
  name: string;
  color: string;
  description: string;
  workspace?: WorkspaceType;
  isSystem: boolean;
}

// 📤 Progreso de subida
export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  estimatedTime?: number; // segundos restantes
  uploadSpeed?: number;   // bytes por segundo
}

// 🎯 Configuración del cliente de documentos
export interface DocumentClientConfig {
  apiBaseUrl: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  chunkedUpload: boolean;
  chunkSize: number;
  maxConcurrentUploads: number;
  defaultTimeout: number;
}
