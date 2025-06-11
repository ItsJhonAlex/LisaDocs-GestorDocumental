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

// 📝 Tipos de Documentos según models.md
export const DOCUMENT_TYPES = {
  NOTA_INFORMATIVA: 'nota_informativa',
  ACTA: 'acta', 
  CERTIFICACION: 'certificacion',
  INFORME: 'informe',
  RESOLUCION: 'resolucion',
  DECRETO: 'decreto',
  DICTAMEN: 'dictamen',
  PROPUESTA: 'propuesta',
  MEMORIA: 'memoria',
  COMUNICADO: 'comunicado'
} as const;

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];

// 📋 Metadatos de tipos de documentos
export interface DocumentTypeMetadata {
  label: string;
  description: string;
  icon: string;
  color: string;
  retentionMonths: number; // Tiempo antes de archivado automático
  workspaces: WorkspaceType[]; // Workspaces donde aplica
  requiredFields?: string[]; // Campos obligatorios adicionales
}

// 🎯 Configuración de tipos de documentos
export const DOCUMENT_TYPE_CONFIG: Record<DocumentType, DocumentTypeMetadata> = {
  [DOCUMENT_TYPES.NOTA_INFORMATIVA]: {
    label: 'Nota Informativa',
    description: 'Comunicaciones breves con información relevante',
    icon: '📝',
    color: 'blue',
    retentionMonths: 12,
    workspaces: ['presidencia', 'cam', 'ampp', 'intendencia', 'comisiones_cf']
  },
  [DOCUMENT_TYPES.ACTA]: {
    label: 'Acta',
    description: 'Documentos que registran reuniones y acuerdos oficiales',
    icon: '📊',
    color: 'green',
    retentionMonths: 24,
    workspaces: ['cam', 'ampp', 'comisiones_cf'],
    requiredFields: ['participantes', 'acuerdos']
  },
  [DOCUMENT_TYPES.CERTIFICACION]: {
    label: 'Certificación',
    description: 'Documentos que validan o certifican situaciones específicas',
    icon: '🏆',
    color: 'amber',
    retentionMonths: 60,
    workspaces: ['presidencia', 'intendencia']
  },
  [DOCUMENT_TYPES.INFORME]: {
    label: 'Informe',
    description: 'Documentos detallados con análisis y conclusiones',
    icon: '📋',
    color: 'purple',
    retentionMonths: 18,
    workspaces: ['presidencia', 'cam', 'ampp', 'intendencia', 'comisiones_cf']
  },
  [DOCUMENT_TYPES.RESOLUCION]: {
    label: 'Resolución',
    description: 'Decisiones oficiales y resoluciones administrativas',
    icon: '⚖️',
    color: 'red',
    retentionMonths: 36,
    workspaces: ['presidencia', 'cam', 'ampp']
  },
  [DOCUMENT_TYPES.DECRETO]: {
    label: 'Decreto',
    description: 'Decretos y disposiciones oficiales',
    icon: '📜',
    color: 'indigo',
    retentionMonths: 60,
    workspaces: ['presidencia']
  },
  [DOCUMENT_TYPES.DICTAMEN]: {
    label: 'Dictamen',
    description: 'Opiniones técnicas y dictámenes especializados',
    icon: '🔍',
    color: 'teal',
    retentionMonths: 24,
    workspaces: ['comisiones_cf', 'intendencia']
  },
  [DOCUMENT_TYPES.PROPUESTA]: {
    label: 'Propuesta',
    description: 'Propuestas y proyectos para consideración',
    icon: '💡',
    color: 'orange',
    retentionMonths: 12,
    workspaces: ['cam', 'ampp', 'comisiones_cf']
  },
  [DOCUMENT_TYPES.MEMORIA]: {
    label: 'Memoria',
    description: 'Memorias anuales y documentos de gestión',
    icon: '📚',
    color: 'gray',
    retentionMonths: 72,
    workspaces: ['presidencia', 'intendencia', 'comisiones_cf']
  },
  [DOCUMENT_TYPES.COMUNICADO]: {
    label: 'Comunicado',
    description: 'Comunicados oficiales y públicos',
    icon: '📢',
    color: 'cyan',
    retentionMonths: 6,
    workspaces: ['presidencia']
  }
};

// 🎯 Funciones de utilidad para tipos de documentos
export const getDocumentTypeConfig = (type: DocumentType): DocumentTypeMetadata => {
  return DOCUMENT_TYPE_CONFIG[type];
};

export const getDocumentTypesForWorkspace = (workspace: WorkspaceType): DocumentType[] => {
  return Object.entries(DOCUMENT_TYPE_CONFIG)
    .filter(([_, config]) => config.workspaces.includes(workspace))
    .map(([type]) => type as DocumentType);
};

export const getDocumentTypeFromTags = (tags: string[]): DocumentType | null => {
  const documentTypes = Object.values(DOCUMENT_TYPES);
  const foundType = tags.find(tag => documentTypes.includes(tag as DocumentType));
  return foundType as DocumentType || null;
};

export const createDocumentTags = (
  type: DocumentType, 
  additionalTags: string[] = []
): string[] => {
  return [type, ...additionalTags].filter(Boolean);
};

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
  tags: string[]; // Incluye el tipo de documento + tags adicionales
  metadata: Record<string, any>;
  createdBy: string;
  createdByUser: DocumentUser;
  storedAt?: string;
  archivedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // 🆕 Propiedades derivadas de tags
  documentType?: DocumentType; // Se calcula desde tags
  additionalTags?: string[]; // Tags que no son tipo de documento
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
  search?: string;
  status?: DocumentStatus[];
  workspace?: WorkspaceType[];
  documentType?: DocumentType[]; // 🆕 Filtro por tipo
  fileType?: string[];
  createdBy?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  tags?: string[];
  sortBy?: 'created_at' | 'title' | 'file_size' | 'stored_at';
  sortOrder?: 'asc' | 'desc';
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
  documentType: DocumentType; // 🆕 Obligatorio seleccionar tipo
  workspace: WorkspaceType;
  tags: string[];
  metadata?: Record<string, any>;
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
