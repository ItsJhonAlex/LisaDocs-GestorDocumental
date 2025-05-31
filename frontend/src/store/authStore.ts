import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import axios from 'axios';

// 🎯 Tipos para el store de autenticación
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

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

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

interface AuthState {
  // 📊 Estado
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 🚀 Acciones
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<{ success: boolean; error?: string }>;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
}

// 🎨 Estado inicial
const initialState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// ✨ Store de autenticación con persistencia
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 🔑 Login de usuario
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await axios.post('/api/auth/login', {
              email,
              password,
            });

            const { user, tokens } = response.data.data;
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return { success: true };
          } catch (error: unknown) {
            const apiError = error as ApiError;
            const errorMessage = apiError.response?.data?.message || 'Error al iniciar sesión';
            set({
              isLoading: false,
              error: errorMessage,
            });
            return { success: false, error: errorMessage };
          }
        },

        // 🚪 Logout de usuario
        logout: async () => {
          set({ isLoading: true });
          
          try {
            const { tokens } = get();
            
            if (tokens?.accessToken) {
              await axios.post('/api/auth/logout', {}, {
                headers: {
                  Authorization: `Bearer ${tokens.accessToken}`,
                },
              });
            }
          } catch (error) {
            console.warn('Error al hacer logout en el servidor:', error);
          } finally {
            // Limpiar estado local independientemente del resultado del servidor
            set({
              ...initialState,
            });
          }
        },

        // 🔄 Renovar tokens
        refreshTokens: async () => {
          const { tokens } = get();
          
          if (!tokens?.refreshToken) {
            set({ ...initialState });
            return false;
          }

          try {
            const response = await axios.post('/api/auth/refresh', {
              refreshToken: tokens.refreshToken,
            });

            const { user, tokens: newTokens } = response.data.data;
            
            set({
              user,
              tokens: newTokens,
              isAuthenticated: true,
              error: null,
            });

            return true;
          } catch (error) {
            console.error('Error al renovar tokens:', error);
            set({ ...initialState });
            return false;
          }
        },

        // 👤 Actualizar perfil de usuario
        updateProfile: async (data: Partial<User>) => {
          const { tokens } = get();
          
          if (!tokens?.accessToken) {
            return { success: false, error: 'No autenticado' };
          }

          set({ isLoading: true, error: null });

          try {
            const response = await axios.put('/api/auth/profile', data, {
              headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
              },
            });

            const updatedUser = response.data.data;
            
            set({
              user: updatedUser,
              isLoading: false,
            });

            return { success: true };
          } catch (error: unknown) {
            const apiError = error as ApiError;
            const errorMessage = apiError.response?.data?.message || 'Error al actualizar perfil';
            set({
              isLoading: false,
              error: errorMessage,
            });
            return { success: false, error: errorMessage };
          }
        },

        // ⚙️ Actualizar preferencias
        updatePreferences: async (preferences: Partial<User['preferences']>) => {
          const { user } = get();
          
          if (!user) {
            return { success: false, error: 'No autenticado' };
          }

          const updatedPreferences = {
            ...user.preferences,
            ...preferences,
          };

          return get().updateProfile({
            preferences: updatedPreferences,
          });
        },

        // 🛠️ Setters
        setUser: (user: User) => set({ user, isAuthenticated: true }),
        setTokens: (tokens: AuthTokens) => set({ tokens }),
        setLoading: (isLoading: boolean) => set({ isLoading }),
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),
        resetStore: () => set(initialState),
      }),
      {
        name: 'lisadocs-auth-storage',
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'AuthStore',
    }
  )
);

// 🎯 Selectores para optimizar renders - MEMOIZADOS para evitar bucles infinitos
export const authSelectors = {
  user: (state: AuthState) => state.user,
  isAuthenticated: (state: AuthState) => state.isAuthenticated,
  isLoading: (state: AuthState) => state.isLoading,
  error: (state: AuthState) => state.error,
  tokens: (state: AuthState) => state.tokens,
  userRole: (state: AuthState) => state.user?.role,
  userWorkspaces: (state: AuthState) => state.user?.workspaces || [],
  userPreferences: (state: AuthState) => state.user?.preferences,
} as const;
