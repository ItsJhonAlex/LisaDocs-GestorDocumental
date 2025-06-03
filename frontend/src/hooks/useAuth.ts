import { useState, useEffect } from 'react';

/**
 * 🎯 Tipos de autenticación actualizados para el backend real
 */
interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  workspace: string;
  isActive: boolean;
  lastLoginAt?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// 🌐 URL base del API
const API_BASE_URL = 'http://localhost:8080/api'; // Ajusta según tu configuración

/**
 * 🔐 Hook de autenticación con backend real
 * 
 * Gestiona el estado de autenticación del usuario y proporciona
 * utilidades para verificar roles y permisos conectando con el backend.
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  // 🔄 Cargar usuario desde token almacenado
  useEffect(() => {
    const loadUser = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('userData');
        
        console.log('🔍 Debug loadUser:', {
          hasAccessToken: !!accessToken,
          hasUserData: !!userData
        });
        
        if (accessToken && userData) {
          try {
            const user = JSON.parse(userData);
            const tokens = {
              accessToken,
              refreshToken: localStorage.getItem('refreshToken') || '',
              expiresIn: localStorage.getItem('expiresIn') || '24h'
            };
            
            console.log('✅ Usuario cargado desde localStorage:', user);
            
            setAuthState({
              user,
              tokens,
              isLoading: false,
              isAuthenticated: true,
              error: null
            });
          } catch (parseError) {
            console.error('❌ Error parsing stored user data:', parseError);
            // Limpiar datos corruptos
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('expiresIn');
            
            setAuthState({
              user: null,
              tokens: null,
              isLoading: false,
              isAuthenticated: false,
              error: null
            });
          }
        } else {
          console.log('❌ No hay token o datos de usuario almacenados');
          setAuthState({
            user: null,
            tokens: null,
            isLoading: false,
            isAuthenticated: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setAuthState({
          user: null,
          tokens: null,
          isLoading: false,
          isAuthenticated: false,
          error: 'Error al cargar usuario'
        });
      }
    };

    loadUser();
  }, []);

  // 🔍 Verificar si el usuario tiene un rol específico
  const hasRole = (role: string): boolean => {
    if (!authState.user) return false;
    return authState.user.role === role;
  };

  // 🔍 Verificar si el usuario tiene acceso a un workspace
  const hasWorkspaceAccess = (workspace: string): boolean => {
    if (!authState.user) return false;
    
    // Los administradores tienen acceso a todos los workspaces
    if (authState.user.role === 'administrador') return true;
    
    // Para otros roles, verificar el workspace específico o el workspace principal
    const result = authState.user.workspace === workspace;
    
    console.log('🔍 Debug hasWorkspaceAccess:', {
      workspace,
      userWorkspace: authState.user?.workspace,
      userRole: authState.user?.role,
      result
    });
    
    return result;
  };

  // 🔍 Verificar si el usuario tiene uno de varios roles
  const hasAnyRole = (roles: string[]): boolean => {
    const result = authState.user ? roles.includes(authState.user.role) : false;
    console.log('🔍 Debug hasAnyRole:', {
      authStateUser: authState.user,
      roles,
      userRole: authState.user?.role,
      result
    });
    return result;
  };

  // 🔍 Verificar si es administrador
  const isAdmin = (): boolean => {
    return hasRole('administrador');
  };

  // 🔍 Verificar si puede gestionar usuarios
  const canManageUsers = (): boolean => {
    return hasAnyRole(['administrador', 'presidente']);
  };

  // 🔍 Verificar permisos específicos según rol
  const hasPermission = (permission: string): boolean => {
    if (!authState.user) return false;

    const { role } = authState.user;

    // Administradores tienen todos los permisos
    if (role === 'administrador') return true;

    // Mapeo de permisos por rol
    const rolePermissions: Record<string, string[]> = {
      presidente: [
        'view_all_documents',
        'archive_documents',
        'manage_presidencia',
        'view_cam',
        'view_ampp',
        'view_intendencia'
      ],
      vicepresidente: [
        'view_all_documents',
        'view_cam',
        'view_ampp',
        'view_intendencia',
        'manage_presidencia'
      ],
      secretario_cam: [
        'view_cam',
        'manage_cam',
        'archive_cam_documents',
        'view_presidencia'
      ],
      secretario_ampp: [
        'view_ampp',
        'manage_ampp',
        'archive_ampp_documents',
        'view_presidencia'
      ],
      secretario_cf: [
        'view_comisiones_cf',
        'manage_comisiones_cf',
        'archive_cf_documents',
        'view_presidencia'
      ],
      intendente: [
        'view_intendencia',
        'manage_intendencia',
        'archive_intendencia_documents',
        'view_presidencia'
      ],
      cf_member: [
        'view_comisiones_cf'
      ]
    };

    const userPermissions = rolePermissions[role] || [];
    return userPermissions.includes(permission);
  };

  // 📝 Función de login con backend real
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🔄 Iniciando login con backend...');
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const error = data.message || 'Error de autenticación';
        setAuthState(prev => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }

      if (data.success && data.data) {
        const { user, tokens } = data.data;
        
        // Guardar en localStorage
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('expiresIn', tokens.expiresIn);
        localStorage.setItem('userData', JSON.stringify(user));
        
        console.log('✅ Login exitoso:', user);
        
        setAuthState({
          user,
          tokens,
          isLoading: false,
          isAuthenticated: true,
          error: null
        });
        
        return { success: true };
      } else {
        const error = data.message || 'Error de autenticación';
        setAuthState(prev => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error de conexión';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  };

  // 🧹 Limpiar errores
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  // 🚪 Función de logout
  const logout = async () => {
    try {
      // Llamar al backend para logout si es necesario
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (logoutError) {
          console.warn('Error durante logout en backend:', logoutError);
        }
      }
    } catch (error) {
      console.warn('Error durante logout:', error);
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('expiresIn');
      
      setAuthState({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      });
    }
  };

  // 🔄 Actualizar datos del usuario
  const updateUser = (userData: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...userData };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));
    }
  };

  return {
    // Estado
    user: authState.user,
    tokens: authState.tokens,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    error: authState.error,
    
    // Funciones de verificación
    hasRole,
    hasWorkspaceAccess,
    hasAnyRole,
    hasPermission,
    isAdmin,
    canManageUsers,
    
    // Acciones
    login,
    logout,
    updateUser,
    clearError
  };
}

/**
 * 🎯 Hook simplificado para verificar permisos específicos
 */
export const usePermissions = () => {
  const { hasAnyRole, hasWorkspaceAccess, isAdmin } = useAuth();
  
  return {
    hasAnyRole,
    hasWorkspaceAccess,
    isAdmin,
    canManageUsers: hasAnyRole(['administrador', 'presidente']),
    canUploadDocuments: true, // Todos los usuarios autenticados
    canDeleteDocuments: hasAnyRole(['administrador', 'presidente', 'vicepresidente']),
  };
};
