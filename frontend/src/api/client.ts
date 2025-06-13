import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 🌐 Configuración del cliente API para LisaDocs
// Puerto 8081 confirmado según backend/.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

/**
 * 🔗 Cliente API configurado para LisaDocs
 * 
 * Características:
 * - Interceptor automático de tokens JWT
 * - Manejo de errores centralizado
 * - Configuración base para el backend
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * 🔧 Configurar interceptors para requests y responses
   */
  private setupInterceptors() {
    // 📤 Request interceptor - Agregar token automáticamente
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 📥 Response interceptor - Manejar errores y refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // 🔄 Manejo de token expirado
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const { accessToken } = response.data;
              localStorage.setItem('accessToken', accessToken);

              // Reintentar la request original
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // ❌ Refresh falló, limpiar tokens y redirigir al login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * 📥 GET request
   */
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  /**
   * 📤 POST request
   */
  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  /**
   * ✏️ PUT request
   */
  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  /**
   * 🔄 PATCH request
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  /**
   * 🗑️ DELETE request
   */
  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  /**
   * 🔧 Obtener instancia base de axios para casos especiales
   */
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// 🌟 Exportar instancia única del cliente
export const apiClient = new ApiClient();

// 🏷️ Tipos para errores de API
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

// 🏷️ Response wrapper común
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

// 🏷️ Tipos para manejo de errores HTTP
export interface HttpErrorResponse {
  response?: {
    status: number;
    data: {
      message?: string;
      error?: string;
      details?: unknown;
    };
  };
  message: string;
} 