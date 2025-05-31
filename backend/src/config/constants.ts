// 🎯 Constantes del sistema LisaDocs

// 📂 Configuraciones de archivos
export const FILE_LIMITS = {
  MAX_SIZE_MB: 50,
  MAX_SIZE_BYTES: 50 * 1024 * 1024,
  ALLOWED_MIME_TYPES: [
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Imágenes
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    // Comprimidos
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ],
  ALLOWED_EXTENSIONS: [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.csv', '.jpg', '.jpeg', '.png', '.gif', '.webp', 
    '.bmp', '.zip', '.rar', '.7z'
  ]
} as const

// 👥 Configuraciones de usuarios y roles
export const USER_ROLES = {
  ADMINISTRADOR: 'administrador',
  PRESIDENTE: 'presidente',
  VICEPRESIDENTE: 'vicepresidente',
  SECRETARIO_CAM: 'secretario_cam',
  SECRETARIO_AMPP: 'secretario_ampp',
  SECRETARIO_CF: 'secretario_cf',
  INTENDENTE: 'intendente',
  CF_MEMBER: 'cf_member'
} as const

// 🏢 Configuraciones de espacios de trabajo
export const WORKSPACES = {
  CAM: 'cam',
  AMPP: 'ampp',
  PRESIDENCIA: 'presidencia',
  INTENDENCIA: 'intendencia',
  COMISIONES_CF: 'comisiones_cf'
} as const

// 📄 Estados de documentos - DEBE COINCIDIR CON PRISMA SCHEMA
export const DOCUMENT_STATUS = {
  DRAFT: 'draft',
  STORED: 'stored',
  ARCHIVED: 'archived'
} as const

// 🔔 Tipos de notificaciones
export const NOTIFICATION_TYPES = {
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_ARCHIVED: 'document_archived',
  SYSTEM_MESSAGE: 'system_message',
  WARNING: 'warning'
} as const

// 🗄️ Configuraciones de MinIO/Storage
export const STORAGE_CONFIG = {
  BUCKETS: {
    CAM: 'lisadocs-cam',
    AMPP: 'lisadocs-ampp',
    PRESIDENCIA: 'lisadocs-presidencia',
    INTENDENCIA: 'lisadocs-intendencia',
    COMISIONES_CF: 'lisadocs-comisiones-cf'
  },
  DEFAULT_EXPIRY_SECONDS: 3600, // 1 hora
  MAX_EXPIRY_SECONDS: 86400 // 24 horas
} as const

// 📊 Configuraciones de API
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_CACHE_TTL: 300, // 5 minutos
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    MAX_REQUESTS: 1000
  }
} as const

// 🔐 Configuraciones de seguridad
export const SECURITY_CONFIG = {
  JWT: {
    DEFAULT_EXPIRES_IN: '24h',
    REFRESH_EXPIRES_IN: '7d',
    MIN_SECRET_LENGTH: 32
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    BCRYPT_ROUNDS: 12
  },
  SESSION: {
    MAX_ACTIVE_SESSIONS: 5,
    INACTIVITY_TIMEOUT_HOURS: 8
  }
} as const

// 📋 Configuraciones de validación - SINCRONIZADAS CON DB CONSTRAINTS
export const VALIDATION_CONFIG = {
  DOCUMENT: {
    TITLE_MIN_LENGTH: 3,          // Coincide con CHECK constraint en DB
    TITLE_MAX_LENGTH: 500,        // Coincide con VARCHAR(500) en DB
    DESCRIPTION_MAX_LENGTH: 2000,
    MAX_TAGS: 10,
    TAG_MAX_LENGTH: 50
  },
  USER: {
    NAME_MIN_LENGTH: 2,           // Coincide con CHECK constraint en DB
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255         // Coincide con VARCHAR(255) en DB
  },
  FILE: {
    HASH_LENGTH: 64,              // SHA-256 = 64 caracteres hex
    MAX_SIZE_BYTES: 50 * 1024 * 1024  // 50MB
  }
} as const

// 🌍 Configuraciones de localización
export const LOCALE_CONFIG = {
  DEFAULT_TIMEZONE: 'America/Santiago',
  DEFAULT_LANGUAGE: 'es',
  DATE_FORMAT: 'DD/MM/YYYY',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm:ss'
} as const

// 📧 Configuraciones de notificaciones
export const NOTIFICATION_CONFIG = {
  DEFAULT_EXPIRY_DAYS: 30,
  MAX_NOTIFICATIONS_PER_USER: 1000,
  BATCH_SIZE: 50
} as const

// 🎨 Configuraciones de la aplicación
export const APP_CONFIG = {
  NAME: 'LisaDocs',
  VERSION: '1.0.0',
  DESCRIPTION: 'Sistema de Gestión Documental',
  CONTACT_EMAIL: 'soporte@lisadocs.com',
  DOCUMENTATION_URL: '/docs',
  REPOSITORY_URL: 'https://github.com/itsjhonalex/lisadocs'
} as const

// 🏷️ Etiquetas predefinidas del sistema
export const SYSTEM_TAGS = {
  URGENT: 'urgente',
  CONFIDENTIAL: 'confidencial',
  PUBLIC: 'publico',
  INTERNAL: 'interno',
  ARCHIVE: 'archivo',
  DRAFT: 'borrador',
  FINAL: 'final',
  REVISION: 'revision'
} as const

// 🔄 Estados de tareas/actividades
export const ACTIVITY_TYPES = {
  DOCUMENT_CREATED: 'document_created',
  DOCUMENT_UPDATED: 'document_updated',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
  DOCUMENT_SHARED: 'document_shared',
  DOCUMENT_DELETED: 'document_deleted',
  STATUS_CHANGED: 'status_changed',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  PERMISSION_GRANTED: 'permission_granted',
  PERMISSION_REVOKED: 'permission_revoked'
} as const

// 🎯 Exportar todas las constantes como un objeto principal
export const CONSTANTS = {
  FILE_LIMITS,
  USER_ROLES,
  WORKSPACES,
  DOCUMENT_STATUS,
  NOTIFICATION_TYPES,
  STORAGE_CONFIG,
  API_CONFIG,
  SECURITY_CONFIG,
  VALIDATION_CONFIG,
  LOCALE_CONFIG,
  NOTIFICATION_CONFIG,
  APP_CONFIG,
  SYSTEM_TAGS,
  ACTIVITY_TYPES
} as const

export default CONSTANTS
