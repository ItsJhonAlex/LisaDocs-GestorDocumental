// 🏷️ Tipos para APIs y respuestas del sistema LisaDocs

/**
 * 📋 Actividad de usuario
 */
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * ⚠️ Error de API estructurado
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
  response?: {
    status: number;
    data: {
      message?: string;
      error?: string;
      details?: unknown;
    };
  };
}

/**
 * 🔄 Resultado de sincronización
 */
export interface SyncResult {
  synced: number;
  errors: string[];
  timestamp: string;
}

/**
 * 📊 Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * ✅ Respuesta de éxito genérica
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * ❌ Respuesta de error
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

/**
 * 🎯 Response de API general
 */
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
