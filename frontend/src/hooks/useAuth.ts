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
  preferences?: {
    theme: string;
  };
  permissions?: {
    canView: string[];
    canDownload: string[];
    canArchive: string[];
    canManage: string[];
  };
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
const API_BASE_URL = 'http://localhost:8081/api'; // Ajusta según tu configuración

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

  // 🔄 Cargar perfil completo desde el backend
  const loadUserProfile = async (accessToken: string) => {
    try {
      console.log('🔄 Cargando perfil desde backend...');
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 Response status:', response.status);

      if (!response.ok) {
        console.error('❌ Response not ok:', response.status, response.statusText);
        throw new Error('Error al obtener perfil del usuario');
      }

      const data = await response.json();
      console.log('🔍 Raw response data:', data);
      
      if (data.success && data.data) {
        console.log('✅ Perfil cargado desde backend:', data.data);
        console.log('🔍 Permissions structure:', data.data.permissions);
        return data.data; // Este incluye permisos completos
      } else {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
      throw error;
    }
  };

  // 🔄 Cargar usuario desde token almacenado
  useEffect(() => {
    const loadUser = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        console.log('🔍 Debug loadUser:', {
          hasAccessToken: !!accessToken
        });
        
        if (accessToken) {
          try {
            // 🎯 Cargar perfil completo desde backend (incluye permisos)
            const user = await loadUserProfile(accessToken);
            
            const tokens = {
              accessToken,
              refreshToken: localStorage.getItem('refreshToken') || '',
              expiresIn: localStorage.getItem('expiresIn') || '24h'
            };
            
            // Actualizar localStorage con datos completos
            localStorage.setItem('userData', JSON.stringify(user));
            
            console.log('✅ Usuario cargado con permisos:', user);
            
            setAuthState({
              user,
              tokens,
              isLoading: false,
              isAuthenticated: true,
              error: null
            });
          } catch (profileError) {
            console.error('❌ Error cargando perfil:', profileError);
            // Token inválido o expirado, limpiar datos
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
          console.log('❌ No hay token almacenado');
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

  // 🔍 Verificar si el usuario tiene acceso a un workspace usando permisos del backend
  const hasWorkspaceAccess = (workspace: string): boolean => {
    console.log('🔍 hasWorkspaceAccess called:', { workspace, user: authState.user });
    
    if (!authState.user) {
      console.log('❌ hasWorkspaceAccess: No user');
      return false;
    }
    
    console.log('🔍 Debug hasWorkspaceAccess:', {
      workspace,
      userRole: authState.user.role,
      permissions: authState.user.permissions,
      userWorkspace: authState.user.workspace
    });
    
    // Los administradores tienen acceso total
    if (authState.user.role === 'administrador') {
      console.log('✅ hasWorkspaceAccess: Admin access granted to workspace:', workspace);
      return true;
    }
    
    // Verificar permisos específicos del backend
    if (authState.user.permissions?.canView) {
      const hasAccess = authState.user.permissions.canView.includes(workspace);
      console.log('🔍 hasWorkspaceAccess permission check result:', {
        workspace,
        canViewWorkspaces: authState.user.permissions.canView,
        hasAccess
      });
      if (hasAccess) return true;
    }
    
    // Fallback: verificar workspace principal
    const fallbackAccess = authState.user.workspace === workspace;
    console.log('🔍 hasWorkspaceAccess fallback workspace check:', {
      userWorkspace: authState.user.workspace,
      targetWorkspace: workspace,
      fallbackAccess
    });
    return fallbackAccess;
  };

  // 🔍 Verificar si el usuario tiene uno de varios roles
  const hasAnyRole = (roles: string[]): boolean => {
    const result = authState.user ? roles.includes(authState.user.role) : false;
    console.log('🔍 Debug hasAnyRole:', {
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

  // 🛡️ Verificar permisos específicos usando datos del backend
  const hasPermission = (action: 'view' | 'download' | 'archive' | 'manage', workspace?: string): boolean => {
    console.log('🔍 hasPermission called:', { action, workspace, user: authState.user });
    
    if (!authState.user) {
      console.log('❌ hasPermission: No user');
      return false;
    }

    // Administradores tienen todos los permisos
    if (authState.user.role === 'administrador') {
      console.log('✅ hasPermission: Admin access granted');
      return true;
    }

    // Verificar permisos específicos del backend
    if (!authState.user.permissions) {
      console.log('❌ hasPermission: No permissions object');
      return false;
    }

    const permissionKey = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof authState.user.permissions;
    const allowedWorkspaces = authState.user.permissions[permissionKey];

    console.log('🔍 hasPermission details:', {
      action,
      workspace,
      permissionKey,
      allowedWorkspaces,
      permissionsObject: authState.user.permissions
    });

    if (!allowedWorkspaces || !Array.isArray(allowedWorkspaces)) {
      console.log('❌ hasPermission: Invalid allowedWorkspaces');
      return false;
    }

    // Si no se especifica workspace, verificar si tiene al menos un permiso
    if (!workspace) {
      const result = allowedWorkspaces.length > 0;
      console.log('🔍 hasPermission (no workspace):', result);
      return result;
    }

    // Verificar workspace específico
    const result = allowedWorkspaces.includes(workspace);
    console.log('🔍 hasPermission result:', result);
    return result;
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
        
        // Guardar tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('expiresIn', tokens.expiresIn);
        
        try {
          // 🎯 Cargar perfil completo con permisos
          const fullUser = await loadUserProfile(tokens.accessToken);
          
          localStorage.setItem('userData', JSON.stringify(fullUser));
          
          console.log('✅ Login exitoso con permisos:', fullUser);
          
          setAuthState({
            user: fullUser,
            tokens,
            isLoading: false,
            isAuthenticated: true,
            error: null
          });
          
          return { success: true };
        } catch (profileError) {
          // Si falla la carga del perfil, usar datos básicos del login
          localStorage.setItem('userData', JSON.stringify(user));
          
          setAuthState({
            user,
            tokens,
            isLoading: false,
            isAuthenticated: true,
            error: null
          });
          
          return { success: true };
        }
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
