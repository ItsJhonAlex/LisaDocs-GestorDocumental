import { apiClient } from '../api/client';
import type { User, UserRole, WorkspaceType } from '../types/auth';
import type { UserActivity, ApiError, SyncResult } from '../types/api';

// 🏷️ Tipos para las respuestas de API
interface ApiPermissionsResponse {
  permissions: string[];
}

interface ApiActivityResponse {
  activities: UserActivity[];
}

interface ApiSearchResponse {
  users: User[];
}

// 🔐 Tipos para autenticación
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// 🏷️ Tipos para la gestión de usuarios
export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  workspace: WorkspaceType;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  role?: UserRole;
  workspace?: WorkspaceType;
  isActive?: boolean;
}

export interface UserFilters {
  limit?: number;
  offset?: number;
  role?: UserRole;
  workspace?: WorkspaceType;
  search?: string;
  isActive?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Record<UserRole, number>;
  usersByWorkspace: Record<WorkspaceType, number>;
  recentUsers: User[];
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 🔗 Servicio de Gestión de Usuarios
 * 
 * Maneja todas las operaciones relacionadas con usuarios:
 * - CRUD de usuarios
 * - Filtros y búsquedas
 * - Estadísticas
 * - Exportación de datos
 * - Gestión de permisos
 */
export const userService = {
  /**
   * 📋 Obtener lista de usuarios con filtros
   */
  async getUsers(filters: UserFilters = {}): Promise<UsersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar filtros a la query string
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.workspace) queryParams.append('workspace', filters.workspace);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());

      const response = await apiClient.get(`/users?${queryParams.toString()}`);
      
      // 🔥 Ajustar a la estructura real del backend
      const backendResponse = response.data as {
        success: boolean;
        data: {
          users: User[];
          pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
          };
        };
      };
      
      const backendData = backendResponse.data;
      
      return {
        users: backendData.users || [],
        total: backendData.pagination?.total || 0,
        page: Math.floor((backendData.pagination?.offset || 0) / (backendData.pagination?.limit || 10)) + 1,
        limit: backendData.pagination?.limit || 10,
        totalPages: Math.ceil((backendData.pagination?.total || 0) / (backendData.pagination?.limit || 10))
      };
    } catch (error) {
      console.error('Error loading users:', error);
      throw new Error('No se pudieron cargar los usuarios');
    }
  },

  /**
   * 👤 Obtener usuario por ID
   */
  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiClient.get(`/users/${id}`);
      const backendResponse = response.data as {
        success: boolean;
        data: User;
      };
      return backendResponse.data;
    } catch (error) {
      console.error('Error loading user:', error);
      throw new Error('No se pudo cargar el usuario');
    }
  },

  /**
   * ➕ Crear nuevo usuario
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // 🔄 Transformar datos para coincidir con backend
      const registerData = {
        email: userData.email,
        fullName: userData.fullName,
        password: userData.password,
        role: userData.role,
        workspace: userData.workspace
      };

      // 🚀 Usar endpoint de registro (auth/register)
      const response = await apiClient.post('/auth/register', registerData);
      const backendResponse = response.data as {
        success: boolean;
        data: {
          user: User;
          tokens?: AuthTokens;
        };
      };
      
      // ✅ Devolver solo el usuario (sin tokens)
      return backendResponse.data.user;
    } catch (error) {
      console.error('Error creating user:', error);
      
      const apiError = error as ApiError;
      // Manejar errores específicos del backend
      if (apiError.response?.status === 409) {
        throw new Error('El email ya está registrado en el sistema');
      } else if (apiError.response?.status === 403) {
        throw new Error('No tienes permisos para crear usuarios');
      } else if (apiError.response?.status === 400) {
        // Extraer mensaje de error detallado
        const errorData = apiError.response.data as {
          errors?: string[];
          error?: {
            details?: string;
          };
          message?: string;
        };
        if (errorData.errors && Array.isArray(errorData.errors)) {
          throw new Error(`Datos inválidos: ${errorData.errors.join(', ')}`);
        } else if (errorData.error?.details) {
          throw new Error(`Password inválido: ${errorData.error.details}`);
        } else if (errorData.message) {
          throw new Error(errorData.message);
        }
        throw new Error('Datos de entrada inválidos');
      } else if (apiError.response?.data?.message) {
        throw new Error(apiError.response.data.message);
      }
      
      throw new Error('No se pudo crear el usuario. Verifica tu conexión e inténtalo de nuevo.');
    }
  },

  /**
   * ✏️ Actualizar usuario
   */
  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    try {
      const response = await apiClient.put(`/users/${id}`, userData);
      const backendResponse = response.data as {
        success: boolean;
        data: User;
      };
      return backendResponse.data;
    } catch (error) {
      console.error('Error updating user:', error);
      
      const apiError = error as ApiError;
      // Manejar errores específicos
      if (apiError.response?.status === 404) {
        throw new Error('Usuario no encontrado');
      } else if (apiError.response?.status === 403) {
        throw new Error('No tienes permisos para editar este usuario');
      } else if (apiError.response?.status === 409) {
        throw new Error('El email ya está en uso por otro usuario');
      } else if (apiError.response?.data?.message) {
        throw new Error(apiError.response.data.message);
      }
      
      throw new Error('No se pudo actualizar el usuario');
    }
  },

  /**
   * 🗑️ Eliminar usuario
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      
      const apiError = error as ApiError;
      if (apiError.response?.status === 404) {
        throw new Error('Usuario no encontrado');
      } else if (apiError.response?.status === 403) {
        throw new Error('No tienes permisos para eliminar este usuario');
      } else if (apiError.response?.data?.message) {
        throw new Error(apiError.response.data.message);
      }
      
      throw new Error('No se pudo eliminar el usuario');
    }
  },

  /**
   * 🔄 Cambiar contraseña de usuario
   */
  async changePassword(id: string, newPassword: string): Promise<void> {
    try {
      await apiClient.patch(`/users/${id}/password`, { password: newPassword });
    } catch (error) {
      console.error('Error changing password:', error);
      
      const apiError = error as ApiError;
      if (apiError.response?.status === 404) {
        throw new Error('Usuario no encontrado');
      } else if (apiError.response?.status === 403) {
        throw new Error('No tienes permisos para cambiar la contraseña de este usuario');
      } else if (apiError.response?.data?.message) {
        throw new Error(apiError.response.data.message);
      }
      
      throw new Error('No se pudo cambiar la contraseña');
    }
  },

  /**
   * 🔐 Enviar enlace de restablecimiento de contraseña
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error) {
      console.error('Error sending password reset:', error);
      
      const apiError = error as ApiError;
      if (apiError.response?.status === 404) {
        throw new Error('No existe un usuario con ese email');
      } else if (apiError.response?.data?.message) {
        throw new Error(apiError.response.data.message);
      }
      
      throw new Error('No se pudo enviar el enlace de restablecimiento');
    }
  },

  /**
   * 📊 Obtener estadísticas de usuarios
   */
  async getStats(): Promise<UserStats> {
    try {
      const response = await apiClient.get('/users/stats');
      
      // 🔥 Ajustar a la estructura real del backend
      const backendResponse = response.data as {
        success: boolean;
        data: {
          total: number;
          active: number;
          byRole: Record<string, number>;
          byWorkspace: Record<string, number>;
          recent: number;
        };
      };
      
      const stats = backendResponse.data;
      
      return {
        totalUsers: stats.total || 0,
        activeUsers: stats.active || 0,
        inactiveUsers: (stats.total || 0) - (stats.active || 0),
        usersByRole: stats.byRole || {},
        usersByWorkspace: stats.byWorkspace || {},
        recentUsers: [] // El backend solo devuelve el número, no los usuarios
      };
    } catch (error) {
      console.error('Error loading stats:', error);
      throw new Error('No se pudieron cargar las estadísticas');
    }
  },

  /**
   * 🛡️ Obtener permisos de usuario
   */
  async getUserPermissions(id: string): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiPermissionsResponse>(`/users/${id}/permissions`);
      return response.data.permissions;
    } catch (error) {
      console.error('Error loading user permissions:', error);
      throw new Error('No se pudieron cargar los permisos del usuario');
    }
  },

  /**
   * 📥 Exportar usuarios
   */
  async exportUsers(format: 'csv' | 'excel', filters: UserFilters = {}): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      // Agregar filtros
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.workspace) queryParams.append('workspace', filters.workspace);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());

      const response = await apiClient.get<Blob>(`/users/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting users:', error);
      throw new Error('No se pudo exportar la lista de usuarios');
    }
  },

  /**
   * 📧 Reenviar email de verificación
   */
  async resendVerification(id: string): Promise<void> {
    try {
      await apiClient.post(`/users/${id}/resend-verification`);
    } catch (error) {
      console.error('Error resending verification:', error);
      
      const apiError = error as ApiError;
      if (apiError.response?.status === 404) {
        throw new Error('Usuario no encontrado');
      } else if (apiError.response?.data?.message) {
        throw new Error(apiError.response.data.message);
      }
      
      throw new Error('No se pudo reenviar el email de verificación');
    }
  },

  /**
   * 📋 Obtener historial de actividad del usuario
   */
  async getUserActivity(id: string, limit = 10): Promise<UserActivity[]> {
    try {
      const response = await apiClient.get<ApiActivityResponse>(`/users/${id}/activity?limit=${limit}`);
      return response.data.activities || [];
    } catch (error) {
      console.error('Error loading user activity:', error);
      throw new Error('No se pudo cargar el historial de actividad');
    }
  },

  /**
   * 🔍 Buscar usuarios por texto
   */
  async searchUsers(query: string, limit = 20): Promise<User[]> {
    try {
      const response = await apiClient.get<ApiSearchResponse>(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data.users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Error en la búsqueda de usuarios');
    }
  },

  /**
   * 🔄 Sincronizar usuarios con sistema externo (si aplica)
   */
  async syncUsers(): Promise<SyncResult> {
    try {
      const response = await apiClient.post<SyncResult>('/users/sync');
      return response.data;
    } catch (error) {
      console.error('Error syncing users:', error);
      
      const apiError = error as ApiError;
      if (apiError.response?.status === 403) {
        throw new Error('No tienes permisos para sincronizar usuarios');
      }
      
      throw new Error('Error al sincronizar usuarios');
    }
  }
}; 