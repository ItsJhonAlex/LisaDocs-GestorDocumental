# 🚀 Setup Completo del Frontend LisaDocs

## 🎯 Resumen del Setup

Esta guía te llevará paso a paso para configurar el frontend de LisaDocs y conectarlo exitosamente con el backend existente.

### Stack Tecnológico Recomendado

- ⚡ **React 18** + **TypeScript**
- 🎨 **Tailwind CSS** para estilos
- 🧭 **React Router** para navegación
- 📡 **Axios** para peticiones HTTP
- 🎣 **React Hook Form** para formularios
- 🔔 **React Hot Toast** para notificaciones
- 📊 **Recharts** para gráficos y estadísticas

---

## 📦 Paso 1: Creación del Proyecto

### Crear proyecto con Vite

```bash
# Crear proyecto con Vite y React + TypeScript
npm create vite@latest lisadocs-frontend -- --template react-ts

# Navegar al directorio
cd lisadocs-frontend

# Instalar dependencias base
npm install
```

### Instalar dependencias adicionales

```bash
# Dependencias principales
npm install axios react-router-dom react-hook-form @hookform/resolvers zod
npm install react-hot-toast lucide-react recharts date-fns
npm install @types/node

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Dependencias de desarrollo
npm install -D @types/react @types/react-dom
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

---

## ⚙️ Paso 2: Configuración Base

### Configurar Tailwind CSS

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'bounce-in': 'bounce-in 0.5s ease-out',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
```

### Configurar CSS global

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@layer base {
  html {
    font-family: 'Inter', sans-serif;
  }
  
  body {
    font-feature-settings: 'cv11', 'ss01';
    font-variation-settings: 'opsz' 32;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
  }
  
  .btn-danger {
    @apply bg-danger-600 text-white px-4 py-2 rounded-md hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
  }
  
  .input-field {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
  
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
  
  .badge-primary {
    @apply badge bg-primary-100 text-primary-800;
  }
  
  .badge-success {
    @apply badge bg-success-100 text-success-800;
  }
  
  .badge-warning {
    @apply badge bg-warning-100 text-warning-800;
  }
  
  .badge-danger {
    @apply badge bg-danger-100 text-danger-800;
  }
}

@layer utilities {
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: rgb(156 163 175) transparent;
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgb(156 163 175);
    border-radius: 3px;
  }
}
```

### Variables de entorno

```env
# .env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_APP_NAME=LisaDocs
VITE_APP_VERSION=1.0.0
VITE_MAX_FILE_SIZE=52428800
VITE_ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,txt,jpg,png,gif,zip,rar
```

---

## 📁 Paso 3: Estructura del Proyecto

### Estructura de directorios

```
src/
├── api/              # Configuración de API y clientes
│   ├── client.ts     # Cliente Axios configurado
│   └── endpoints.ts  # Definición de endpoints
├── components/       # Componentes reutilizables
│   ├── auth/         # Componentes de autenticación
│   ├── common/       # Componentes comunes
│   ├── documents/    # Componentes de documentos
│   ├── layout/       # Componentes de layout
│   ├── notifications/# Componentes de notificaciones
│   └── ui/           # Componentes de UI base
├── contexts/         # Contexts de React
│   ├── AuthContext.tsx
│   ├── NotificationContext.tsx
│   └── ThemeContext.tsx
├── hooks/            # Custom hooks
│   ├── useApi.ts
│   ├── useAuth.ts
│   ├── useDocuments.ts
│   └── useNotifications.ts
├── pages/            # Páginas/Vistas principales
│   ├── auth/
│   ├── dashboard/
│   ├── documents/
│   ├── admin/
│   └── settings/
├── services/         # Servicios de API
│   ├── authService.ts
│   ├── documentService.ts
│   ├── userService.ts
│   └── notificationService.ts
├── types/            # Definiciones de tipos
│   ├── auth.ts
│   ├── document.ts
│   ├── user.ts
│   └── api.ts
├── utils/            # Utilidades
│   ├── constants.ts
│   ├── formatters.ts
│   ├── validators.ts
│   └── helpers.ts
├── config/           # Configuraciones
│   ├── api.ts
│   └── constants.ts
└── App.tsx           # Componente principal
```

---

## 🔧 Paso 4: Configuración de la API

### Cliente Axios

```typescript
// src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

// Configuración base
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

class ApiClient {
  private client: AxiosInstance
  private authToken: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Agregar token si existe
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Log en desarrollo
        if (import.meta.env.DEV) {
          console.log('🚀 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
          })
        }
        
        return config
      },
      (error) => {
        console.error('❌ Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log en desarrollo
        if (import.meta.env.DEV) {
          console.log('✅ API Response:', {
            method: response.config.method?.toUpperCase(),
            url: response.config.url,
            status: response.status,
            data: response.data,
          })
        }
        
        return response
      },
      async (error) => {
        const originalRequest = error.config

        // Handle 401 - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = this.getRefreshToken()
            if (refreshToken) {
              const response = await this.refreshTokens(refreshToken)
              const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens
              
              this.setTokens(accessToken, newRefreshToken)
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
              
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            this.clearTokens()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        // Handle otros errores
        this.handleError(error)
        return Promise.reject(error)
      }
    )
  }

  private handleError(error: any) {
    const message = error.response?.data?.message || error.message || 'Error inesperado'
    
    // No mostrar toast para ciertos errores
    if (error.response?.status === 401) return
    
    toast.error(message)
    
    console.error('❌ API Error:', {
      status: error.response?.status,
      message,
      url: error.config?.url,
      method: error.config?.method,
    })
  }

  // Token management
  private getToken(): string | null {
    return localStorage.getItem('lisadocs_access_token')
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('lisadocs_refresh_token')
  }

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('lisadocs_access_token', accessToken)
    localStorage.setItem('lisadocs_refresh_token', refreshToken)
  }

  clearTokens() {
    localStorage.removeItem('lisadocs_access_token')
    localStorage.removeItem('lisadocs_refresh_token')
    localStorage.removeItem('lisadocs_user')
  }

  private async refreshTokens(refreshToken: string) {
    return axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config)
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config)
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config)
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config)
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config)
  }
}

export const apiClient = new ApiClient()
export default apiClient
```

### Endpoints centralizados

```typescript
// src/api/endpoints.ts
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/profile/password',
  },

  // Users
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    GET: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    PERMISSIONS: (id: string) => `/users/${id}/permissions`,
  },

  // Documents
  DOCUMENTS: {
    LIST: '/documents',
    UPLOAD: '/documents/upload',
    GET: (id: string) => `/documents/${id}`,
    UPDATE: (id: string) => `/documents/${id}`,
    DELETE: (id: string) => `/documents/${id}`,
    DOWNLOAD: (id: string) => `/documents/${id}/download`,
    STATUS: (id: string) => `/documents/${id}/status`,
    STATS: '/documents/stats',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    CREATE: '/notifications',
    GET: (id: string) => `/notifications/${id}`,
    READ: (id: string) => `/notifications/${id}/read`,
    ARCHIVE: (id: string) => `/notifications/${id}/archive`,
  },

  // Workspaces
  WORKSPACES: {
    LIST: '/workspaces',
    GET: (workspace: string) => `/workspaces/${workspace}`,
    DOCUMENTS: (workspace: string) => `/workspaces/${workspace}/documents`,
    STATS: (workspace: string) => `/workspaces/${workspace}/stats`,
  },

  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    AUDIT: '/admin/audit/logs',
    SYSTEM_INFO: '/admin/system-info',
  },
} as const
```

---

## 🔐 Paso 5: Configuración de Autenticación

### Tipos de autenticación

```typescript
// src/types/auth.ts
export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  workspace: WorkspaceType
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  permissions?: {
    canView: string[]
    canDownload: string[]
    canUpload: string[]
    canArchive: string[]
    canManage: string[]
  }
}

export type UserRole = 
  | 'administrador'
  | 'presidente'
  | 'vicepresidente' 
  | 'secretario_cam'
  | 'secretario_ampp'
  | 'secretario_cf'
  | 'intendente'
  | 'cf_member'

export type WorkspaceType =
  | 'presidencia'
  | 'intendencia'
  | 'cam'
  | 'ampp'
  | 'comisiones_cf'

export interface LoginData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    tokens: AuthTokens
  }
}
```

### Context de autenticación

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginData, AuthResponse } from '../types/auth'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (data: LoginData) => Promise<AuthResponse>
  logout: () => Promise<void>
  register: (userData: any) => Promise<any>
  hasRole: (roles: string | string[]) => boolean
  hasWorkspaceAccess: (workspace: string) => boolean
  hasPermission: (permission: string, workspace?: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Inicializar autenticación
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('lisadocs_access_token')
        if (token) {
          const userProfile = await authService.getProfile()
          setUser(userProfile)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        localStorage.clear()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (data: LoginData): Promise<AuthResponse> => {
    setLoading(true)
    try {
      const response = await authService.login(data)
      setUser(response.data.user)
      toast.success('¡Bienvenido a LisaDocs!')
      return response
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await authService.logout()
      setUser(null)
      toast.success('Sesión cerrada correctamente')
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: any) => {
    setLoading(true)
    try {
      const response = await authService.register(userData)
      toast.success('Usuario registrado correctamente')
      return response
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al registrar usuario'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const hasWorkspaceAccess = (workspace: string): boolean => {
    if (!user) return false
    if (user.role === 'administrador') return true
    return user.workspace === workspace || 
           user.permissions?.canView?.includes(workspace) || false
  }

  const hasPermission = (permission: string, workspace?: string): boolean => {
    if (!user) return false
    if (user.role === 'administrador') return true
    
    const targetWorkspace = workspace || user.workspace
    return user.permissions?.[permission as keyof typeof user.permissions]?.includes(targetWorkspace) || false
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    hasRole,
    hasWorkspaceAccess,
    hasPermission,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

---

## 🧩 Paso 6: Componentes Base

### Componente de Loading

```tsx
// src/components/ui/Loading.tsx
import React from 'react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text = 'Cargando...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  const LoadingSpinner = (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]}`} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {LoadingSpinner}
      </div>
    )
  }

  return LoadingSpinner
}
```

### Componente de Error

```tsx
// src/components/ui/ErrorMessage.tsx
import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  fullHeight?: boolean
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  fullHeight = false 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 p-8 ${fullHeight ? 'min-h-96' : ''}`}>
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-danger-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{message}</p>
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Intentar de nuevo
        </button>
      )}
    </div>
  )
}
```

### Layout principal

```tsx
// src/components/layout/Layout.tsx
import React, { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '../../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

---

## 🎯 Paso 7: Routing Principal

### App.tsx principal

```tsx
// src/App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

// Pages
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import DocumentsPage from './pages/documents/DocumentsPage'
import UsersPage from './pages/users/UsersPage'
import AdminPage from './pages/admin/AdminPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/documents/:workspace" element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute roles={['administrador']}>
                <UsersPage />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/*" element={
              <ProtectedRoute roles={['administrador']}>
                <AdminPage />
              </ProtectedRoute>
            } />
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
        
        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  )
}

export default App
```

---

## 📋 Paso 8: Scripts de Package.json

```json
{
  "name": "lisadocs-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "axios": "^1.3.4",
    "react-hook-form": "^7.43.5",
    "@hookform/resolvers": "^2.9.11",
    "zod": "^3.20.6",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.323.0",
    "recharts": "^2.5.0",
    "date-fns": "^2.29.3",
    "@types/node": "^18.15.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "@vitejs/plugin-react": "^3.1.0",
    "typescript": "^4.9.3",
    "vite": "^4.2.0",
    "tailwindcss": "^3.2.7",
    "postcss": "^8.4.21",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.36.0",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^2.8.7",
    "eslint-config-prettier": "^8.7.0",
    "eslint-plugin-prettier": "^4.2.1"
  }
}
```

---

## 🚀 Paso 9: Comandos de Inicio

```bash
# Instalar todas las dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview

# Linting y formateo
npm run lint
npm run format
```

---

## ✅ Paso 10: Checklist de Verificación

### Backend debe estar funcionando

- [ ] Backend ejecutándose en `http://localhost:3001`
- [ ] Base de datos PostgreSQL configurada
- [ ] MinIO configurado para archivos
- [ ] Variables de entorno del backend configuradas

### Frontend configurado

- [ ] Proyecto creado y dependencias instaladas
- [ ] Tailwind CSS configurado
- [ ] Variables de entorno del frontend configuradas
- [ ] API client configurado con interceptors
- [ ] AuthContext funcionando
- [ ] Routing básico implementado

### Pruebas de conexión

- [ ] Login funciona correctamente
- [ ] Tokens se renuevan automáticamente
- [ ] Navegación protegida funciona
- [ ] API calls llegan al backend
- [ ] Errores se manejan correctamente

---

## 🎉 ¡Listo para Desarrollar

Con este setup completo tienes:

✅ **Frontend configurado** con React + TypeScript + Tailwind
✅ **API client robusto** con manejo automático de tokens
✅ **Autenticación completa** con contexts y guards
✅ **Estructura escalable** para agregar nuevas funcionalidades
✅ **Error handling** centralizado
✅ **Routing protegido** por roles y permisos

¡Ahora puedes empezar a implementar las páginas y componentes específicos de LisaDocs! 🚀✨

¿Te ayudo con algún componente específico o tienes preguntas sobre alguna parte del setup? 💪
