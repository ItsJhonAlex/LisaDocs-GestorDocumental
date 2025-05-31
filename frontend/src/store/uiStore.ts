import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// 🎯 Tipos para el store de UI
interface UIState {
  // 🎨 Tema y apariencia
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // 📱 Estado de la interfaz
  isLoading: boolean;
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
  
  // 🚀 Acciones
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  setLoading: (loading: boolean, message?: string) => void;
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
  
  resetUI: () => void;
}

// 🎨 Estado inicial
const initialState = {
  theme: 'system' as const,
  sidebarOpen: true,
  sidebarCollapsed: false,
  
  isLoading: false,
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
};

// ✨ Store de UI con persistencia selectiva
export const useUIStore = create<UIState>()(
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
      }),
      {
        name: 'lisadocs-ui-storage',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          viewMode: state.viewMode,
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
  theme: (state: UIState) => state.theme,
  sidebarOpen: (state: UIState) => state.sidebarOpen,
  sidebarCollapsed: (state: UIState) => state.sidebarCollapsed,
  isLoading: (state: UIState) => state.isLoading,
  loadingMessage: (state: UIState) => state.loadingMessage,
  error: (state: UIState) => state.error,
  modals: (state: UIState) => state.modals,
  confirmDialog: (state: UIState) => state.modals.confirmDialog,
  userForm: (state: UIState) => state.modals.userForm,
  documentUpload: (state: UIState) => state.modals.documentUpload,
  searchQuery: (state: UIState) => state.searchQuery,
  activeFilters: (state: UIState) => state.activeFilters,
  viewMode: (state: UIState) => state.viewMode,
};
