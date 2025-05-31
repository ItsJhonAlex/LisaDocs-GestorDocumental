import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { resetAllStores } from '@/store';

/**
 * Hook personalizado para manejar la autenticación
 * Proporciona funcionalidades adicionales como navegación automática,
 * verificación de tokens y utilidades de autenticación
 */
export const useAuth = () => {
  const navigate = useNavigate();
  
  // 🎯 Selectores del store de auth - usando la forma correcta de Zustand
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const tokens = useAuthStore((state) => state.tokens);
  
  // 🚀 Acciones del store - extraídas individualmente para estabilidad
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const refreshTokens = useAuthStore((state) => state.refreshTokens);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const updatePreferences = useAuthStore((state) => state.updatePreferences);
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);
  const clearError = useAuthStore((state) => state.clearError);

  // 📊 Derivar valores de user de forma estable con useMemo
  const userRole = useMemo(() => user?.role, [user?.role]);
  const userWorkspaces = useMemo(() => user?.workspaces || [], [user?.workspaces]);
  const userPreferences = useMemo(() => user?.preferences, [user?.preferences]);

  // 🔐 Login con navegación automática - MEMOIZADO
  const loginWithRedirect = useCallback(async (email: string, password: string, redirectTo?: string) => {
    const result = await login(email, password);
    
    if (result.success) {
      navigate(redirectTo || '/dashboard');
    }
    
    return result;
  }, [login, navigate]);

  // 🚪 Logout con limpieza completa - MEMOIZADO
  const logoutWithRedirect = useCallback(async (redirectTo?: string) => {
    await logout();
    resetAllStores();
    navigate(redirectTo || '/login');
  }, [logout, navigate]);

  // 🎯 Utilidades de autorización - MEMOIZADAS
  const hasRole = useCallback((role: string | string[]) => {
    if (!userRole) return false;
    
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    
    return userRole === role;
  }, [userRole]);

  const hasWorkspace = useCallback((workspace: string | string[]) => {
    if (!userWorkspaces || userWorkspaces.length === 0) return false;
    
    if (Array.isArray(workspace)) {
      return workspace.some(w => userWorkspaces.includes(w));
    }
    
    return userWorkspaces.includes(workspace);
  }, [userWorkspaces]);

  const isAdmin = useCallback(() => hasRole('administrador'), [hasRole]);
  
  const canAccessWorkspace = useCallback((workspace: string) => {
    return isAdmin() || hasWorkspace(workspace);
  }, [isAdmin, hasWorkspace]);

  const canManageUsers = useCallback(() => {
    return hasRole(['administrador', 'presidente']);
  }, [hasRole]);

  const canUploadDocuments = useCallback(() => {
    return isAuthenticated; // Todos los usuarios autenticados pueden subir documentos
  }, [isAuthenticated]);

  const canDeleteDocuments = useCallback(() => {
    return hasRole(['administrador', 'presidente', 'vicepresidente']);
  }, [hasRole]);

  // 📊 Estado del usuario - MEMOIZADO
  const userInfo = useMemo(() => ({
    id: user?.id,
    name: user?.name,
    email: user?.email,
    role: userRole,
    workspaces: userWorkspaces,
    isActive: user?.isActive,
    lastLogin: user?.lastLoginAt,
    preferences: userPreferences,
  }), [user, userRole, userWorkspaces, userPreferences]);

  // 🎨 Preferencias con helpers - MEMOIZADAS
  const themePreference = userPreferences?.theme || 'system';
  const languagePreference = userPreferences?.language || 'es';
  const notificationsEnabled = userPreferences?.notifications ?? true;

  const updateTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    return updatePreferences({ theme });
  }, [updatePreferences]);

  const updateLanguage = useCallback((language: 'es' | 'en') => {
    return updatePreferences({ language });
  }, [updatePreferences]);

  const toggleNotifications = useCallback(() => {
    return updatePreferences({ notifications: !notificationsEnabled });
  }, [updatePreferences, notificationsEnabled]);

  const updateDashboardPreferences = useCallback((dashboardPrefs: Partial<{
    showStats: boolean;
    showRecentDocuments: boolean;
    showNotifications: boolean;
  }>) => {
    if (!userPreferences) {
      return { success: false, error: 'No hay preferencias de usuario disponibles' };
    }

    const currentDashboard = userPreferences.dashboard || {
      showStats: true,
      showRecentDocuments: true,
      showNotifications: true,
    };

    return updatePreferences({
      dashboard: {
        ...currentDashboard,
        ...dashboardPrefs,
      },
    });
  }, [userPreferences, updatePreferences]);

  // 🔒 Guards para componentes - MEMOIZADOS
  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  }, [isAuthenticated, navigate]);

  const requireRole = useCallback((requiredRole: string | string[]) => {
    if (!requireAuth()) return false;
    
    if (!hasRole(requiredRole)) {
      navigate('/unauthorized');
      return false;
    }
    return true;
  }, [requireAuth, hasRole, navigate]);

  const requireWorkspace = useCallback((requiredWorkspace: string | string[]) => {
    if (!requireAuth()) return false;
    
    if (!hasWorkspace(requiredWorkspace)) {
      navigate('/unauthorized');
      return false;
    }
    return true;
  }, [requireAuth, hasWorkspace, navigate]);

  return {
    // 📊 Estado
    user: userInfo,
    isAuthenticated,
    isLoading,
    error,
    tokens,
    
    // 🚀 Acciones principales
    login: loginWithRedirect,
    logout: logoutWithRedirect,
    updateProfile,
    refreshTokens,
    
    // 🎨 Preferencias
    preferences: {
      theme: themePreference,
      language: languagePreference,
      notifications: notificationsEnabled,
      dashboard: userPreferences?.dashboard,
    },
    updateTheme,
    updateLanguage,
    toggleNotifications,
    updateDashboardPreferences,
    updatePreferences,
    
    // 🎯 Autorización
    hasRole,
    hasWorkspace,
    isAdmin,
    canAccessWorkspace,
    canManageUsers,
    canUploadDocuments,
    canDeleteDocuments,
    
    // 🔒 Guards
    requireAuth,
    requireRole,
    requireWorkspace,
    
    // 🛠️ Utilidades
    setUser,
    setTokens,
    setLoading,
    setError,
    clearError,
  };
};

/**
 * 🎯 Hook simplificado para verificar permisos específicos
 */
export const usePermissions = () => {
  const { hasRole, hasWorkspace, isAdmin } = useAuth();
  
  return {
    hasRole,
    hasWorkspace,
    isAdmin,
    canManageUsers: hasRole(['administrador', 'presidente']),
    canUploadDocuments: true, // Todos los usuarios autenticados
    canDeleteDocuments: hasRole(['administrador', 'presidente', 'vicepresidente']),
  };
};

/**
 * 👤 Hook simplificado para obtener información del usuario actual
 */
export const useCurrentUser = () => {
  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.user?.role);
  const userWorkspaces = useAuthStore((state) => state.user?.workspaces || []);
  const userPreferences = useAuthStore((state) => state.user?.preferences);
  
  return {
    user,
    role: userRole,
    workspaces: userWorkspaces,
    preferences: userPreferences,
    isActive: user?.isActive,
    lastLogin: user?.lastLoginAt,
  };
};
