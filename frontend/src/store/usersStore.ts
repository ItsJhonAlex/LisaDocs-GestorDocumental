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

// 🎯 Tipos para el store de usuarios
interface User {
  id: string;
  email: string;
  name: string;
  role: 'administrador' | 'presidente' | 'vicepresidente' | 'secretario_cam' | 'secretario_ampp' | 'secretario_cf' | 'intendente' | 'cf_member';
  workspaces: string[];
  isActive: boolean;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'es' | 'en';
    notifications: boolean;
    dashboard: {
      showStats: boolean;
      showRecentDocuments: boolean;
      showNotifications: boolean;
    };
  };
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserFilters {
  role?: User['role'];
  workspace?: string;
  isActive?: boolean;
  search?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface CreateUserData {
  email: string;
  name: string;
  role: User['role'];
  workspaces: string[];
  password: string;
}

interface UpdateUserData {
  name?: string;
  role?: User['role'];
  workspaces?: string[];
  isActive?: boolean;
  preferences?: Partial<User['preferences']>;
}

interface UsersState {
  // 📊 Estado
  users: User[];
  selectedUsers: string[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  
  // 🔍 Filtros y paginación
  filters: UserFilters;
  pagination: PaginationInfo;
  sortBy: 'name' | 'email' | 'role' | 'createdAt' | 'lastLoginAt';
  sortOrder: 'asc' | 'desc';
  
  // 📊 Estadísticas
  stats: {
    totalUsers: number;
    activeUsers: number;
    byRole: Record<string, number>;
    byWorkspace: Record<string, number>;
    recentLogins: User[];
  };
  
  // 🚀 Acciones
  // Obtener usuarios
  fetchUsers: (filters?: UserFilters, page?: number) => Promise<void>;
  fetchUserById: (id: string) => Promise<User | null>;
  fetchUserStats: () => Promise<void>;
  
  // CRUD de usuarios
  createUser: (data: CreateUserData) => Promise<{ success: boolean; error?: string; user?: User }>;
  updateUser: (id: string, data: UpdateUserData) => Promise<{ success: boolean; error?: string; user?: User }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Acciones de usuario
  activateUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  deactivateUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (id: string) => Promise<{ success: boolean; error?: string; newPassword?: string }>;
  
  // Acciones múltiples
  activateUsers: (ids: string[]) => Promise<{ success: boolean; results: Array<{ id: string; success: boolean; error?: string }> }>;
  deactivateUsers: (ids: string[]) => Promise<{ success: boolean; results: Array<{ id: string; success: boolean; error?: string }> }>;
  deleteUsers: (ids: string[]) => Promise<{ success: boolean; results: Array<{ id: string; success: boolean; error?: string }> }>;
  
  // Selección
  selectUser: (id: string) => void;
  selectMultipleUsers: (ids: string[]) => void;
  unselectUser: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Filtros y orden
  setFilters: (filters: Partial<UserFilters>) => void;
  clearFilters: () => void;
  setSorting: (sortBy: UsersState['sortBy'], sortOrder: UsersState['sortOrder']) => void;
  setPage: (page: number) => void;
  
  // Utils
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
}

// 🎨 Estado inicial
const initialState = {
  users: [],
  selectedUsers: [],
  currentUser: null,
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
  
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    byRole: {},
    byWorkspace: {},
    recentLogins: [],
  },
};

// ✨ Store de usuarios
export const useUsersStore = create<UsersState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 👥 Obtener usuarios
      fetchUsers: async (filters = {}, page = 1) => {
        set({ isLoading: true, error: null });
        
        try {
          const currentFilters = { ...get().filters, ...filters };
          const { sortBy, sortOrder, pagination } = get();
          
          const response = await axios.get('/api/users', {
            params: {
              ...currentFilters,
              page,
              limit: pagination.limit,
              sortBy,
              sortOrder,
            },
          });

          const { users, pagination: newPagination } = response.data.data;
          
          set({
            users,
            pagination: newPagination,
            filters: currentFilters,
            isLoading: false,
          });
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al obtener usuarios';
          set({
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      fetchUserById: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await axios.get(`/api/users/${id}`);
          const user = response.data.data;
          
          set({
            currentUser: user,
            isLoading: false,
          });
          
          return user;
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al obtener usuario';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return null;
        }
      },

      fetchUserStats: async () => {
        try {
          const response = await axios.get('/api/users/stats');
          const stats = response.data.data;
          
          set({ stats });
        } catch (error) {
          console.error('Error al obtener estadísticas de usuarios:', error);
        }
      },

      // ➕ Crear usuario
      createUser: async (data: CreateUserData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await axios.post('/api/auth/register', data);
          const user = response.data.data.user;
          
          // Agregar usuario a la lista
          set((state) => ({
            users: [user, ...state.users],
            isLoading: false,
          }));

          return { success: true, user };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al crear usuario';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },

      // ✏️ Actualizar usuario
      updateUser: async (id: string, data: UpdateUserData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await axios.put(`/api/users/${id}`, data);
          const updatedUser = response.data.data;
          
          set((state) => ({
            users: state.users.map(user =>
              user.id === id ? updatedUser : user
            ),
            currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
            isLoading: false,
          }));

          return { success: true, user: updatedUser };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al actualizar usuario';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },

      // 🗑️ Eliminar usuario
      deleteUser: async (id: string) => {
        try {
          await axios.delete(`/api/users/${id}`);
          
          set((state) => ({
            users: state.users.filter(user => user.id !== id),
            selectedUsers: state.selectedUsers.filter(selectedId => selectedId !== id),
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al eliminar usuario';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // ✅ Activar usuario
      activateUser: async (id: string) => {
        try {
          const response = await axios.patch(`/api/users/${id}/activate`);
          const updatedUser = response.data.data;
          
          set((state) => ({
            users: state.users.map(user =>
              user.id === id ? updatedUser : user
            ),
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al activar usuario';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // ❌ Desactivar usuario
      deactivateUser: async (id: string) => {
        try {
          const response = await axios.patch(`/api/users/${id}/deactivate`);
          const updatedUser = response.data.data;
          
          set((state) => ({
            users: state.users.map(user =>
              user.id === id ? updatedUser : user
            ),
          }));

          return { success: true };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al desactivar usuario';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // 🔑 Restablecer contraseña
      resetUserPassword: async (id: string) => {
        try {
          const response = await axios.post(`/api/users/${id}/reset-password`);
          const { newPassword } = response.data.data;

          return { success: true, newPassword };
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || 'Error al restablecer contraseña';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // 📋 Acciones múltiples
      activateUsers: async (ids: string[]) => {
        const results = [];
        
        for (const id of ids) {
          const result = await get().activateUser(id);
          results.push({ id, ...result });
        }
        
        const successCount = results.filter(r => r.success).length;
        
        return {
          success: successCount > 0,
          results,
        };
      },

      deactivateUsers: async (ids: string[]) => {
        const results = [];
        
        for (const id of ids) {
          const result = await get().deactivateUser(id);
          results.push({ id, ...result });
        }
        
        const successCount = results.filter(r => r.success).length;
        
        return {
          success: successCount > 0,
          results,
        };
      },

      deleteUsers: async (ids: string[]) => {
        const results = [];
        
        for (const id of ids) {
          const result = await get().deleteUser(id);
          results.push({ id, ...result });
        }
        
        const successCount = results.filter(r => r.success).length;
        
        return {
          success: successCount > 0,
          results,
        };
      },

      // ✅ Selección
      selectUser: (id: string) => {
        set((state) => ({
          selectedUsers: state.selectedUsers.includes(id)
            ? state.selectedUsers
            : [...state.selectedUsers, id],
        }));
      },

      selectMultipleUsers: (ids: string[]) => {
        set({ selectedUsers: ids });
      },

      unselectUser: (id: string) => {
        set((state) => ({
          selectedUsers: state.selectedUsers.filter(selectedId => selectedId !== id),
        }));
      },

      clearSelection: () => set({ selectedUsers: [] }),

      selectAll: () => {
        const { users } = get();
        set({ selectedUsers: users.map(user => user.id) });
      },

      // 🔍 Filtros y orden
      setFilters: (newFilters: Partial<UserFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
        
        // Recargar usuarios con nuevos filtros
        get().fetchUsers();
      },

      clearFilters: () => {
        set({ filters: {} });
        get().fetchUsers();
      },

      setSorting: (sortBy: UsersState['sortBy'], sortOrder: UsersState['sortOrder']) => {
        set({ sortBy, sortOrder });
        get().fetchUsers();
      },

      setPage: (page: number) => {
        get().fetchUsers(undefined, page);
      },

      // 🛠️ Utils
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      resetStore: () => set(initialState),
    }),
    {
      name: 'UsersStore',
    }
  )
);

// 🎯 Selectores para optimizar renders
export const usersSelectors = {
  users: (state: UsersState) => state.users,
  selectedUsers: (state: UsersState) => state.selectedUsers,
  currentUser: (state: UsersState) => state.currentUser,
  isLoading: (state: UsersState) => state.isLoading,
  error: (state: UsersState) => state.error,
  filters: (state: UsersState) => state.filters,
  pagination: (state: UsersState) => state.pagination,
  stats: (state: UsersState) => state.stats,
  hasSelection: (state: UsersState) => state.selectedUsers.length > 0,
  selectionCount: (state: UsersState) => state.selectedUsers.length,
  activeUsers: (state: UsersState) => state.users.filter(user => user.isActive),
  inactiveUsers: (state: UsersState) => state.users.filter(user => !user.isActive),
  usersByRole: (state: UsersState, role: User['role']) => state.users.filter(user => user.role === role),
};

// 🎨 Constantes útiles
export const USER_ROLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'presidente', label: 'Presidente' },
  { value: 'vicepresidente', label: 'Vicepresidente' },
  { value: 'secretario_cam', label: 'Secretario CAM' },
  { value: 'secretario_ampp', label: 'Secretario AMPP' },
  { value: 'secretario_cf', label: 'Secretario CF' },
  { value: 'intendente', label: 'Intendente' },
  { value: 'cf_member', label: 'Miembro CF' },
] as const;

export const WORKSPACES = [
  { value: 'presidencia', label: 'Presidencia' },
  { value: 'intendencia', label: 'Intendencia' },
  { value: 'cam', label: 'CAM' },
  { value: 'ampp', label: 'AMPP' },
  { value: 'comisiones_cf', label: 'Comisiones CF' },
] as const;
