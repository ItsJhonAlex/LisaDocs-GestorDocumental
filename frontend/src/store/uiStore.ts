import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// 🎯 Estado base (solo datos, sin funciones)
interface UIBaseState {
  // 🎨 Tema y apariencia
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // 📱 Estado de la interfaz
  isLoading: boolean;
  isNavigating: boolean;
  loadingMessage: string;
  error: string | null;
  
  // 🔔 Modales y overlays
  modals: {
    confirmDialog: {
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: (() => void) | null;
      onCancel: (() => void) | null;
      type: 'info' | 'warning' | 'error' | 'success';
    };
    userForm: {
      isOpen: boolean;
      mode: 'create' | 'edit';
      userId?: string;
    };
    documentUpload: {
      isOpen: boolean;
      workspaceId?: string;
    };
  };
  
  // 🔍 Búsqueda y filtros
  searchQuery: string;
  activeFilters: Record<string, unknown>;
  
  // 📊 Vista de lista/grilla
  viewMode: 'list' | 'grid' | 'table';
  
  // 📱 Responsive
  isMobile: boolean;
  
  // 📊 Configuraciones de UI
  preferences: {
    animationsEnabled: boolean;
    compactMode: boolean;
    showTooltips: boolean;
  };
}

// 🎯 Acciones del store
interface UIActions {
  // 🗂️ Sidebar actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  
  // 🎨 Theme actions
  setTheme: (theme: UIBaseState['theme']) => void;
  
  // 📱 Responsive actions
  setIsMobile: (isMobile: boolean) => void;
  
  // 🔄 Loading actions
  setLoading: (loading: boolean, message?: string) => void;
  setNavigating: (navigating: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Modales
  openConfirmDialog: (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    type?: 'info' | 'warning' | 'error' | 'success';
  }) => void;
  closeConfirmDialog: () => void;
  
  openUserForm: (mode: 'create' | 'edit', userId?: string) => void;
  closeUserForm: () => void;
  
  openDocumentUpload: (workspaceId?: string) => void;
  closeDocumentUpload: () => void;
  
  // Búsqueda y filtros
  setSearchQuery: (query: string) => void;
  setFilter: (key: string, value: unknown) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  
  setViewMode: (mode: 'list' | 'grid' | 'table') => void;
  
  // 📊 Preferences actions
  updatePreferences: (preferences: Partial<UIBaseState['preferences']>) => void;
  
  resetUI: () => void;
}

// 🏪 Store combinado: estado + acciones
type UIStore = UIBaseState & UIActions;

// 🎨 Estado inicial (solo datos, sin funciones)
const initialState: UIBaseState = {
  theme: 'system' as const,
  sidebarOpen: true,
  sidebarCollapsed: false,
  
  isLoading: false,
  isNavigating: false,
  loadingMessage: '',
  error: null,
  
  modals: {
    confirmDialog: {
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      onCancel: null,
      type: 'info' as const,
    },
    userForm: {
      isOpen: false,
      mode: 'create' as const,
      userId: undefined,
    },
    documentUpload: {
      isOpen: false,
      workspaceId: undefined,
    },
  },
  
  searchQuery: '',
  activeFilters: {},
  viewMode: 'list' as const,
  
  isMobile: false,
  
  preferences: {
    animationsEnabled: true,
    compactMode: false,
    showTooltips: true,
  },
};

// ✨ Store de UI con persistencia selectiva
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 🎨 Tema
        setTheme: (theme) => set({ theme }),

        // 📱 Sidebar
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

        // ⏳ Loading
        setLoading: (isLoading, loadingMessage = '') => set({ isLoading, loadingMessage }),
        setNavigating: (isNavigating) => set({ isNavigating }),

        // 🔔 Modal de confirmación
        openConfirmDialog: (config) => {
          set({
            modals: {
              ...get().modals,
              confirmDialog: {
                isOpen: true,
                title: config.title,
                message: config.message,
                onConfirm: config.onConfirm,
                onCancel: config.onCancel || null,
                type: config.type || 'info',
              },
            },
          });
        },

        closeConfirmDialog: () => {
          set({
            modals: {
              ...get().modals,
              confirmDialog: {
                ...initialState.modals.confirmDialog,
              },
            },
          });
        },

        // 👤 Modal de usuario
        openUserForm: (mode, userId) => {
          set({
            modals: {
              ...get().modals,
              userForm: {
                isOpen: true,
                mode,
                userId,
              },
            },
          });
        },

        closeUserForm: () => {
          set({
            modals: {
              ...get().modals,
              userForm: {
                ...initialState.modals.userForm,
              },
            },
          });
        },

        // 📄 Modal de subida de documentos
        openDocumentUpload: (workspaceId) => {
          set({
            modals: {
              ...get().modals,
              documentUpload: {
                isOpen: true,
                workspaceId,
              },
            },
          });
        },

        closeDocumentUpload: () => {
          set({
            modals: {
              ...get().modals,
              documentUpload: {
                ...initialState.modals.documentUpload,
              },
            },
          });
        },

        // 🔍 Búsqueda y filtros
        setSearchQuery: (searchQuery) => set({ searchQuery }),
        
        setFilter: (key, value) => {
          set((state) => ({
            activeFilters: {
              ...state.activeFilters,
              [key]: value,
            },
          }));
        },

        removeFilter: (key) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [key]: _, ...rest } = get().activeFilters;
          set({ activeFilters: rest });
        },

        clearFilters: () => set({ activeFilters: {} }),

        // 📊 Vista
        setViewMode: (viewMode) => set({ viewMode }),

        // 🔄 Reset
        resetUI: () => set(initialState),

        // 🔴 Error
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // 📱 Responsive actions
        setIsMobile: (isMobile) => set({ isMobile }),

        // 📊 Preferences actions
        updatePreferences: (newPreferences) => set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        })),
      }),
      {
        name: 'lisadocs-ui-storage',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          viewMode: state.viewMode,
          isMobile: state.isMobile,
          preferences: state.preferences,
        }),
      }
    ),
    {
      name: 'UIStore',
    }
  )
);

// 🎯 Selectores para optimizar renders
export const uiSelectors = {
  theme: (state: UIBaseState) => state.theme,
  sidebarOpen: (state: UIBaseState) => state.sidebarOpen,
  sidebarCollapsed: (state: UIBaseState) => state.sidebarCollapsed,
  isLoading: (state: UIBaseState) => state.isLoading,
  loadingMessage: (state: UIBaseState) => state.loadingMessage,
  error: (state: UIBaseState) => state.error,
  modals: (state: UIBaseState) => state.modals,
  confirmDialog: (state: UIBaseState) => state.modals.confirmDialog,
  userForm: (state: UIBaseState) => state.modals.userForm,
  documentUpload: (state: UIBaseState) => state.modals.documentUpload,
  searchQuery: (state: UIBaseState) => state.searchQuery,
  activeFilters: (state: UIBaseState) => state.activeFilters,
  viewMode: (state: UIBaseState) => state.viewMode,
  isMobile: (state: UIBaseState) => state.isMobile,
  preferences: (state: UIBaseState) => state.preferences,
  isNavigating: (state: UIBaseState) => state.isNavigating,
};
