// 🎯 Exports centralizados de todos los stores de Zustand
export * from './authStore';
export * from './uiStore';
export * from './documentsStore';
export * from './usersStore';
export * from './notificationsStore';

// 🎨 Re-exports de selectores para fácil importación
export { authSelectors } from './authStore';
export { uiSelectors } from './uiStore';
export { documentsSelectors } from './documentsStore';
export { usersSelectors } from './usersStore';
export { notificationsSelectors } from './notificationsStore';

// 🚀 Hook combinado para acceder a todos los stores
import { useAuthStore } from './authStore';
import { useUIStore } from './uiStore';
import { useDocumentsStore } from './documentsStore';
import { useUsersStore } from './usersStore';
import { useNotificationsStore } from './notificationsStore';

/**
 * Hook que proporciona acceso a todos los stores principales
 * Útil para componentes que necesitan acceder a múltiples stores
 * 
 * @example
 * ```tsx
 * const { auth, ui, documents, users, notifications } = useStores();
 * 
 * // Acceder a estado
 * const isAuthenticated = auth.isAuthenticated;
 * const sidebarOpen = ui.sidebarOpen;
 * const documents = documents.documents;
 * 
 * // Ejecutar acciones
 * auth.login(email, password);
 * ui.toggleSidebar();
 * documents.fetchDocuments();
 * ```
 */
export const useStores = () => ({
  auth: useAuthStore(),
  ui: useUIStore(),
  documents: useDocumentsStore(),
  users: useUsersStore(),
  notifications: useNotificationsStore(),
});

// 🎯 Tipos combinados para TypeScript
export type AppState = {
  auth: ReturnType<typeof useAuthStore>;
  ui: ReturnType<typeof useUIStore>;
  documents: ReturnType<typeof useDocumentsStore>;
  users: ReturnType<typeof useUsersStore>;
  notifications: ReturnType<typeof useNotificationsStore>;
};

// 🔧 Funciones de utilidad para los stores

/**
 * Resetea todos los stores a su estado inicial
 * Útil para logout completo o reinicio de la aplicación
 */
export const resetAllStores = () => {
  useAuthStore.getState().resetStore();
  useUIStore.getState().resetUI();
  useDocumentsStore.getState().resetStore();
  useUsersStore.getState().resetStore();
  useNotificationsStore.getState().resetStore();
};

/**
 * Limpia todos los errores de los stores
 * Útil para limpiar errores después de mostrarlos al usuario
 */
export const clearAllErrors = () => {
  useAuthStore.getState().clearError();
  useUIStore.getState().clearError();
  useDocumentsStore.getState().clearError();
  useUsersStore.getState().clearError();
  useNotificationsStore.getState().clearError();
};

/**
 * Obtiene el estado de loading combinado de todos los stores
 * Útil para mostrar un loading global
 */
export const getGlobalLoadingState = () => {
  const authLoading = useAuthStore.getState().isLoading;
  const documentsLoading = useDocumentsStore.getState().isLoading;
  const usersLoading = useUsersStore.getState().isLoading;
  const notificationsLoading = useNotificationsStore.getState().isLoading;
  const uiLoading = useUIStore.getState().isLoading;

  return authLoading || documentsLoading || usersLoading || notificationsLoading || uiLoading;
};

/**
 * Hook para obtener todos los errores actuales
 * Útil para mostrar un resumen de errores
 */
export const useGlobalErrors = () => {
  const authError = useAuthStore(state => state.error);
  const documentsError = useDocumentsStore(state => state.error);
  const usersError = useUsersStore(state => state.error);
  const notificationsError = useNotificationsStore(state => state.error);
  const uiError = useUIStore(state => state.error);

  const errors = [
    authError && { type: 'auth', message: authError },
    documentsError && { type: 'documents', message: documentsError },
    usersError && { type: 'users', message: usersError },
    notificationsError && { type: 'notifications', message: notificationsError },
    uiError && { type: 'ui', message: uiError },
  ].filter(Boolean);

  return {
    errors,
    hasErrors: errors.length > 0,
    errorCount: errors.length,
  };
};

/**
 * Hook para obtener el estado global de loading
 * Útil para mostrar spinners o overlays de carga
 */
export const useGlobalLoading = () => {
  const authLoading = useAuthStore(state => state.isLoading);
  const documentsLoading = useDocumentsStore(state => state.isLoading);
  const documentsUploading = useDocumentsStore(state => state.isUploading);
  const usersLoading = useUsersStore(state => state.isLoading);
  const notificationsLoading = useNotificationsStore(state => state.isLoading);
  const uiLoading = useUIStore(state => state.isLoading);

  const isLoading = authLoading || documentsLoading || usersLoading || notificationsLoading || uiLoading;
  const isUploading = documentsUploading;

  return {
    isLoading,
    isUploading,
    isActive: isLoading || isUploading,
    loadingStates: {
      auth: authLoading,
      documents: documentsLoading,
      uploading: documentsUploading,
      users: usersLoading,
      notifications: notificationsLoading,
      ui: uiLoading,
    },
  };
};

// 🎭 Constantes útiles exportadas
export const STORE_NAMES = {
  AUTH: 'lisadocs-auth-storage',
  UI: 'lisadocs-ui-storage',
} as const;

export const DEVTOOLS_NAMES = {
  AUTH: 'AuthStore',
  UI: 'UIStore',
  DOCUMENTS: 'DocumentsStore',
  USERS: 'UsersStore',
  NOTIFICATIONS: 'NotificationsStore',
} as const;
