import { useState, useEffect } from 'react';

/**
 * 🎯 Tipos de autenticación
 */
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaces: string[];
  avatar?: string;
  isActive?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// 🔑 Mock data para el usuario (en producción vendría del backend)
const mockUser: User = {
  id: 'current-user',
  name: 'Jonathan Rodriguez',
  email: 'itsjhonalex@gmail.com',
  role: 'administrador',
  workspaces: ['presidencia', 'cam', 'ampp', 'intendencia', 'comisiones_cf'],
  avatar: undefined,
  isActive: true
};

/**
 * 🔐 Hook de autenticación
 * 
 * Gestiona el estado de autenticación del usuario y proporciona
 * utilidades para verificar roles y permisos.
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  // 🔄 Simular carga inicial del usuario
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Simular delay de carga
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // En producción: verificar token y obtener datos del usuario
        const token = localStorage.getItem('auth_token');
        
        console.log('🔍 Debug loadUser:', {
          token,
          mockUser
        });
        
        if (token) {
          // Mock: siempre carga el usuario de ejemplo
          console.log('✅ Token encontrado, cargando usuario mock');
          setAuthState({
            user: mockUser,
            isLoading: false,
            isAuthenticated: true,
            error: null
          });
        } else {
          console.log('❌ No hay token, estableciendo token automáticamente para desarrollo');
          // Para desarrollo: establecer token automáticamente
          localStorage.setItem('auth_token', 'mock_token_12345');
          setAuthState({
            user: mockUser,
            isLoading: false,
            isAuthenticated: true,
            error: null
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null
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
    const result = authState.user ? authState.user.workspaces.includes(workspace) : false;
    console.log('🔍 Debug hasWorkspaceAccess:', {
      workspace,
      userWorkspaces: authState.user?.workspaces,
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

  // 📝 Función de login (mock)
  const login = async (email: string, password: string, redirectTo?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Simular llamada al API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock: validación simple
      if (!email || !password) {
        const error = 'Email y contraseña son requeridos';
        setAuthState(prev => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }
      
      if (password.length < 6) {
        const error = 'La contraseña debe tener al menos 6 caracteres';
        setAuthState(prev => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }
      
      // Mock: cualquier email válido es aceptado
      localStorage.setItem('auth_token', 'mock_token_12345');
      
      // En producción: usar redirectTo para redirigir después del login
      if (redirectTo) {
        console.log('Redirect to:', redirectTo);
      }
      
      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = 'Error interno del servidor';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  };

  // 🧹 Limpiar errores
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  // 🚪 Función de logout
  const logout = () => {
    localStorage.removeItem('auth_token');
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null
    });
  };

  // 🔄 Actualizar datos del usuario
  const updateUser = (userData: Partial<User>) => {
    if (authState.user) {
      setAuthState(prev => ({
        ...prev,
        user: { ...prev.user!, ...userData }
      }));
    }
  };

  return {
    // Estado
    user: authState.user,
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
