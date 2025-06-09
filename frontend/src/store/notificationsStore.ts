import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';

// 🚨 Tipo para errores de API
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

// 🎯 Tipos para el store de notificaciones
interface Notification {
  id: string;
  userId: string;
  type: 'document_uploaded' | 'user_created' | 'document_archived' | 'system' | 'reminder' | 'warning';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones opcionales
  document?: {
    id: string;
    fileName: string;
    workspace: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface NotificationFilters {
  type?: Notification['type'];
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface NotificationsState {
  // 📊 Estado
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // 🔍 Filtros y paginación
  filters: NotificationFilters;
  pagination: PaginationInfo;
  sortBy: 'createdAt' | 'readAt' | 'type';
  sortOrder: 'asc' | 'desc';
  
  // 🔔 Configuración de notificaciones
  settings: {
    showDesktopNotifications: boolean;
    soundEnabled: boolean;
    emailNotifications: boolean;
    types: {
      document_uploaded: boolean;
      user_created: boolean;
      document_archived: boolean;
      system: boolean;
      reminder: boolean;
      warning: boolean;
    };
  };
  
  // 🚀 Acciones
  // Obtener notificaciones
  fetchNotifications: (filters?: NotificationFilters, page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  
  // Marcar como leído/no leído
  markAsRead: (id: string) => Promise<{ success: boolean; error?: string }>;
  markAsUnread: (id: string) => Promise<{ success: boolean; error?: string }>;
  markAllAsRead: () => Promise<{ success: boolean; error?: string }>;
  
  // Eliminar notificaciones
  deleteNotification: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteAllRead: () => Promise<{ success: boolean; error?: string }>;
  deleteAll: () => Promise<{ success: boolean; error?: string }>;
  
  // Configuración
  updateSettings: (settings: Partial<NotificationsState['settings']>) => Promise<{ success: boolean; error?: string }>;
  
  // Notificaciones en tiempo real
  addNotification: (notification: Notification) => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  
  // Filtros y orden
  setFilters: (filters: Partial<NotificationFilters>) => void;
  clearFilters: () => void;
  setSorting: (sortBy: NotificationsState['sortBy'], sortOrder: NotificationsState['sortOrder']) => void;
  setPage: (page: number) => void;
  
  // Utils
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
}

// 🎨 Estado inicial
const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const,
  
  settings: {
    showDesktopNotifications: true,
    soundEnabled: true,
    emailNotifications: true,
    types: {
      document_uploaded: true,
      user_created: true,
      document_archived: true,
      system: true,
      reminder: true,
      warning: true,
    },
  },
};

// ✨ Store de notificaciones
export const useNotificationsStore = create<NotificationsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 🔔 Obtener notificaciones
      fetchNotifications: async (filters = {}, page = 1) => {
        set({ isLoading: true, error: null });
        
        try {
          const currentFilters = { ...get().filters, ...filters };
          const { sortBy, sortOrder, pagination } = get();
          
          const response = await axios.get('/api/notifications', {
            params: {
              ...currentFilters,
              page,
              limit: pagination.limit,
              sortBy,
              sortOrder,
            },
          });

          const { notifications, pagination: newPagination } = response.data.data;
          
          set({
            notifications,
            pagination: newPagination,
            filters: currentFilters,
            isLoading: false,
          });
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al obtener notificaciones';
          set({
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      fetchUnreadCount: async () => {
        try {
          const response = await axios.get('/api/notifications/unread-count');
          const { count } = response.data.data;
          
          set({ unreadCount: count });
        } catch (error) {
          console.error('Error al obtener contador de no leídas:', error);
        }
      },

      // ✅ Marcar como leído
      markAsRead: async (id: string) => {
        try {
          await axios.patch(`/api/notifications/${id}/read`);
          
          set((state) => ({
            notifications: state.notifications.map(notification =>
              notification.id === id
                ? { ...notification, isRead: true, readAt: new Date().toISOString() }
                : notification
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al marcar como leído';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // ❌ Marcar como no leído
      markAsUnread: async (id: string) => {
        try {
          await axios.patch(`/api/notifications/${id}/unread`);
          
          set((state) => ({
            notifications: state.notifications.map(notification =>
              notification.id === id
                ? { ...notification, isRead: false, readAt: undefined }
                : notification
            ),
            unreadCount: state.unreadCount + 1,
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al marcar como no leído';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // ✅ Marcar todas como leídas
      markAllAsRead: async () => {
        try {
          await axios.patch('/api/notifications/mark-all-read');
          
          set((state) => ({
            notifications: state.notifications.map(notification => ({
              ...notification,
              isRead: true,
              readAt: notification.readAt || new Date().toISOString(),
            })),
            unreadCount: 0,
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al marcar todas como leídas';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // 🗑️ Eliminar notificación
      deleteNotification: async (id: string) => {
        try {
          await axios.delete(`/api/notifications/${id}`);
          
          set((state) => {
            const deletedNotification = state.notifications.find(n => n.id === id);
            const wasUnread = deletedNotification && !deletedNotification.isRead;
            
            return {
              notifications: state.notifications.filter(n => n.id !== id),
              unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
            };
          });

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al eliminar notificación';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // 🗑️ Eliminar todas las leídas
      deleteAllRead: async () => {
        try {
          await axios.delete('/api/notifications/read');
          
          set((state) => ({
            notifications: state.notifications.filter(n => !n.isRead),
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al eliminar notificaciones leídas';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // 🗑️ Eliminar todas
      deleteAll: async () => {
        try {
          await axios.delete('/api/notifications');
          
          set({
            notifications: [],
            unreadCount: 0,
          });

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al eliminar todas las notificaciones';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // ⚙️ Actualizar configuración
      updateSettings: async (newSettings: Partial<NotificationsState['settings']>) => {
        try {
          await axios.put('/api/notifications/settings', newSettings);
          
          set((state) => ({
            settings: {
              ...state.settings,
              ...newSettings,
            },
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al actualizar configuración';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // 🔔 Agregar notificación en tiempo real
      addNotification: (notification: Notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: !notification.isRead ? state.unreadCount + 1 : state.unreadCount,
        }));

        // Mostrar notificación de escritorio si está habilitada
        const { settings } = get();
        if (settings.showDesktopNotifications && !notification.isRead) {
          showDesktopNotification(notification);
        }

        // Reproducir sonido si está habilitado
        if (settings.soundEnabled && !notification.isRead) {
          playNotificationSound();
        }
      },

      // 🍞 Mostrar toast
      showToast: (title: string, message: string, type = 'info') => {
        // Esta función se integrará con sonner u otro sistema de toast
        console.log(`Toast [${type}]: ${title} - ${message}`);
      },

      // 🔍 Filtros y orden
      setFilters: (newFilters: Partial<NotificationFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
        
        // Recargar notificaciones con nuevos filtros
        get().fetchNotifications();
      },

      clearFilters: () => {
        set({ filters: {} });
        get().fetchNotifications();
      },

      setSorting: (sortBy: NotificationsState['sortBy'], sortOrder: NotificationsState['sortOrder']) => {
        set({ sortBy, sortOrder });
        get().fetchNotifications();
      },

      setPage: (page: number) => {
        get().fetchNotifications(undefined, page);
      },

      // 🛠️ Utils
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      resetStore: () => set(initialState),
    }),
    {
      name: 'NotificationsStore',
    }
  )
);

// 🎯 Selectores para optimizar renders
export const notificationsSelectors = {
  notifications: (state: NotificationsState) => state.notifications,
  unreadCount: (state: NotificationsState) => state.unreadCount,
  isLoading: (state: NotificationsState) => state.isLoading,
  error: (state: NotificationsState) => state.error,
  filters: (state: NotificationsState) => state.filters,
  pagination: (state: NotificationsState) => state.pagination,
  settings: (state: NotificationsState) => state.settings,
  unreadNotifications: (state: NotificationsState) => state.notifications.filter(n => !n.isRead),
  readNotifications: (state: NotificationsState) => state.notifications.filter(n => n.isRead),
  hasUnread: (state: NotificationsState) => state.unreadCount > 0,
  notificationsByType: (state: NotificationsState, type: Notification['type']) => 
    state.notifications.filter(n => n.type === type),
};

// 🎨 Constantes y utilidades
export const NOTIFICATION_TYPES = [
  { value: 'document_uploaded', label: 'Documento subido', icon: '📄', color: 'blue' },
  { value: 'user_created', label: 'Usuario creado', icon: '👤', color: 'green' },
  { value: 'document_archived', label: 'Documento archivado', icon: '🗃️', color: 'yellow' },
  { value: 'system', label: 'Sistema', icon: '⚙️', color: 'gray' },
  { value: 'reminder', label: 'Recordatorio', icon: '⏰', color: 'purple' },
  { value: 'warning', label: 'Advertencia', icon: '⚠️', color: 'orange' },
] as const;

// 🔔 Función para mostrar notificación de escritorio
const showDesktopNotification = (notification: Notification) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notif = new Notification(notification.title, {
      body: notification.message,
      icon: '/vite.svg', // Puedes cambiar esto por el icono de LisaDocs
      tag: notification.id,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    // Auto-cerrar después de 5 segundos
    setTimeout(() => notif.close(), 5000);
  }
};

// 🔊 Función para reproducir sonido de notificación
const playNotificationSound = () => {
  try {
    // Crear audio element con un sonido de notificación
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzie2+/PdyYEKH3L7+GAREANTL7Q6NNmEQT8/f7/9IH5/x8A/P/6/vj/5gAAAwAF');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Silenciar errores si no se puede reproducir
    });
  } catch {
    // Silenciar errores de audio
  }
};

// 🔔 Función para solicitar permisos de notificación
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};
