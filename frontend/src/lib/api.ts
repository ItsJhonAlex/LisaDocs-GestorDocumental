import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';

// 🌐 Configuración base de la API
const getApiBaseUrl = () => {
  // En desarrollo, usar el proxy de Vite (relativo)
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // En producción, usar la URL completa del backend
  return import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
};

const API_BASE_URL = getApiBaseUrl();

// ✨ Crear instancia de Axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🎯 Log de configuración en desarrollo
if (import.meta.env.DEV) {
  console.log('🚀 API Configuration:', {
    baseURL: API_BASE_URL,
    mode: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
  });
}

// 🎯 Tipos para las respuestas de la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  message: string;
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// 🚨 Tipo para errores de Axios con API
type AxiosApiError = AxiosError<ApiError>;

// 🔐 Interceptor de request para agregar tokens
api.interceptors.request.use(
  (config) => {
    // Obtener token del store de auth
    const { tokens } = useAuthStore.getState();
    
    if (tokens?.accessToken) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
    
    // Agregar timestamp a las requests para debugging
    (config as unknown as { metadata?: { startTime: Date } }).metadata = { startTime: new Date() };
    
    // Log de request en desarrollo
    if (import.meta.env.DEV) {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// 🔄 Interceptor de response para manejar errores y renovar tokens
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Log del tiempo de respuesta en desarrollo
    if (import.meta.env.DEV) {
      const metadata = (response.config as unknown as { metadata?: { startTime: Date } }).metadata;
      if (metadata) {
        const duration = new Date().getTime() - metadata.startTime.getTime();
        console.log(`✅ API ${response.config.method?.toUpperCase()} ${response.config.url}: ${duration}ms`);
      }
    }
    
    return response;
  },
  async (error: AxiosApiError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // 🔄 Renovar token si es 401 y tenemos refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const { tokens, refreshTokens, logout } = useAuthStore.getState();
      
      if (tokens?.refreshToken) {
        try {
          const success = await refreshTokens();
          
          if (success) {
            // Reintentar la request original con el nuevo token
            const newTokens = useAuthStore.getState().tokens;
            if (newTokens?.accessToken && originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
              return api(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error('Error al renovar token:', refreshError);
        }
      }
      
      // Si no se pudo renovar, hacer logout
      logout();
      window.location.href = '/login';
    }

    // 🚨 Manejo global de errores
    handleApiError(error);
    
    return Promise.reject(error);
  }
);

// 🚨 Función para manejar errores de la API
const handleApiError = (error: AxiosApiError) => {
  let errorMessage = 'Error inesperado';
  
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  // Mostrar error global solo para errores críticos
  if (error.response?.status && error.response.status >= 500) {
    // Para errores críticos, mostrar en consola ya que el UIStore no tiene setError
    console.error('Global API Error:', errorMessage);
  }
  
  // Log del error en desarrollo
  if (import.meta.env.DEV) {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });
  }
};

// 🛠️ Funciones de utilidad para la API

/**
 * Función helper para hacer requests GET
 */
export const apiGet = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.get<ApiResponse<T>>(url, config);
  return response.data.data;
};

/**
 * Función helper para hacer requests POST
 */
export const apiPost = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.post<ApiResponse<T>>(url, data, config);
  return response.data.data;
};

/**
 * Función helper para hacer requests PUT
 */
export const apiPut = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.put<ApiResponse<T>>(url, data, config);
  return response.data.data;
};

/**
 * Función helper para hacer requests PATCH
 */
export const apiPatch = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.patch<ApiResponse<T>>(url, data, config);
  return response.data.data;
};

/**
 * Función helper para hacer requests DELETE
 */
export const apiDelete = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.delete<ApiResponse<T>>(url, config);
  return response.data.data;
};

/**
 * Función helper para upload de archivos
 */
export const apiUpload = async <T = unknown>(
  url: string,
  formData: FormData,
  onUploadProgress?: (progress: number) => void,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.post<ApiResponse<T>>(url, formData, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...config?.headers,
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onUploadProgress) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(progress);
      }
    },
  });
  return response.data.data;
};

/**
 * Función helper para download de archivos
 */
export const apiDownload = async (
  url: string,
  filename?: string,
  config?: AxiosRequestConfig
): Promise<void> => {
  const response = await api.get(url, {
    ...config,
    responseType: 'blob',
  });
  
  // Crear URL para el blob
  const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = downloadUrl;
  
  // Obtener nombre del archivo del header o usar el proporcionado
  const disposition = response.headers['content-disposition'];
  const filenameFromHeader = disposition?.match(/filename="(.+)"/)?.[1];
  link.download = filename || filenameFromHeader || 'download';
  
  // Ejecutar descarga
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpiar URL
  window.URL.revokeObjectURL(downloadUrl);
};

// 🎯 Tipos específicos para los endpoints
interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaces: string[];
  isActive: boolean;
  preferences?: unknown;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse {
  user: UserData;
  tokens: AuthTokens;
}

interface DocumentData {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
  workspaceId: string;
  status: string;
  tags?: string[];
  description?: string;
  version: number;
  checksum: string;
  uploadedAt: string;
  updatedAt: string;
}

interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface StatsData {
  totalUsers?: number;
  activeUsers?: number;
  totalDocuments?: number;
  totalSize?: number;
  [key: string]: unknown;
}

// 🎯 Endpoints específicos de la API
export const authApi = {
  login: (email: string, password: string) =>
    apiPost<LoginResponse>('/auth/login', { email, password }),
  
  register: (data: Record<string, unknown>) =>
    apiPost<LoginResponse>('/auth/register', data),
  
  logout: () => apiPost<void>('/auth/logout'),
  
  refresh: (refreshToken: string) =>
    apiPost<LoginResponse>('/auth/refresh', { refreshToken }),
  
  profile: () => apiGet<UserData>('/auth/profile'),
  
  updateProfile: (data: Partial<UserData>) => apiPut<UserData>('/auth/profile', data),
};

export const usersApi = {
  getUsers: (params?: Record<string, unknown>) => 
    apiGet<PaginatedResponse<UserData>>('/users', { params }),
  
  getUserById: (id: string) => apiGet<UserData>(`/users/${id}`),
  
  createUser: (data: Partial<UserData>) => apiPost<UserData>('/users', data),
  
  updateUser: (id: string, data: Partial<UserData>) => apiPut<UserData>(`/users/${id}`, data),
  
  deleteUser: (id: string) => apiDelete<void>(`/users/${id}`),
  
  activateUser: (id: string) => apiPatch<UserData>(`/users/${id}/activate`),
  
  deactivateUser: (id: string) => apiPatch<UserData>(`/users/${id}/deactivate`),
  
  resetPassword: (id: string) => apiPost<{ newPassword: string }>(`/users/${id}/reset-password`),
  
  getStats: () => apiGet<StatsData>('/users/stats'),
};

export const documentsApi = {
  getDocuments: (params?: Record<string, unknown>) => 
    apiGet<PaginatedResponse<DocumentData>>('/documents', { params }),
  
  getDocumentById: (id: string) => apiGet<DocumentData>(`/documents/${id}`),
  
  uploadDocument: (formData: FormData, onProgress?: (progress: number) => void) =>
    apiUpload<DocumentData>('/documents/upload', formData, onProgress),
  
  updateDocument: (id: string, data: Partial<DocumentData>) => 
    apiPut<DocumentData>(`/documents/${id}`, data),
  
  archiveDocument: (id: string) => apiPatch<DocumentData>(`/documents/${id}/archive`),
  
  restoreDocument: (id: string) => apiPatch<DocumentData>(`/documents/${id}/restore`),
  
  deleteDocument: (id: string) => apiDelete<void>(`/documents/${id}`),
  
  downloadDocument: (id: string, filename?: string) =>
    apiDownload(`/documents/${id}/download`, filename),
  
  getStats: () => apiGet<StatsData>('/documents/stats'),
};

export const notificationsApi = {
  getNotifications: (params?: Record<string, unknown>) => 
    apiGet<PaginatedResponse<NotificationData>>('/notifications', { params }),
  
  getUnreadCount: () => apiGet<{ count: number }>('/notifications/unread-count'),
  
  markAsRead: (id: string) => apiPatch<NotificationData>(`/notifications/${id}/read`),
  
  markAsUnread: (id: string) => apiPatch<NotificationData>(`/notifications/${id}/unread`),
  
  markAllAsRead: () => apiPatch<void>('/notifications/mark-all-read'),
  
  deleteNotification: (id: string) => apiDelete<void>(`/notifications/${id}`),
  
  deleteAllRead: () => apiDelete<void>('/notifications/read'),
  
  deleteAll: () => apiDelete<void>('/notifications'),
  
  updateSettings: (settings: Record<string, unknown>) => 
    apiPut<Record<string, unknown>>('/notifications/settings', settings),
};

// 🔧 Configuración adicional
export const setApiBaseURL = (url: string) => {
  api.defaults.baseURL = url;
};

export const setApiTimeout = (timeout: number) => {
  api.defaults.timeout = timeout;
};

// 📊 Estado de conexión
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
};

// Por defecto, exportar la instancia de axios configurada
export default api;
