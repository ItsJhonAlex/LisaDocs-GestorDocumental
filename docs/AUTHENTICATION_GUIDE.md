# 🔐 Guía de Autenticación LisaDocs

## 🎯 Resumen del Sistema de Autenticación

LisaDocs utiliza un sistema robusto de autenticación basado en **JWT (JSON Web Tokens)** con refresh tokens para mantener sesiones seguras y eficientes.

### Características Principales

- ✅ **Dual Token System**: Access Token (24h) + Refresh Token (7d)
- ✅ **Role-Based Access Control (RBAC)**: 7 roles diferentes
- ✅ **Workspace-Based Permissions**: 5 workspaces específicos
- ✅ **Token Blacklisting**: Invalidación inmediata de tokens
- ✅ **Automatic Token Refresh**: Renovación transparente
- ✅ **Session Management**: Control de sesiones activas

---

## 🔑 Roles y Workspaces

### Roles Disponibles

```typescript
type UserRole = 
  | 'administrador'      // 👑 Acceso total al sistema
  | 'presidente'         // 🏛️ Gestión ejecutiva
  | 'vicepresidente'     // 🏛️ Gestión ejecutiva secundaria
  | 'secretario_cam'     // 📋 Cámara de Comercio
  | 'secretario_ampp'    // 🏛️ Municipalidades
  | 'secretario_cf'      // ⚖️ Comisiones de Fiscalización
  | 'intendente'         // 🌍 Gestión territorial
  | 'cf_member'          // 👥 Miembro de comisiones
```

### Workspaces Disponibles

```typescript
type WorkspaceType = 
  | 'presidencia'        // 🏛️ Presidencia del Consejo
  | 'intendencia'        // 🌍 Intendencia Regional
  | 'cam'               // 🏢 Cámara de Comercio
  | 'ampp'              // 🏛️ Asociación de Municipios
  | 'comisiones_cf'     // ⚖️ Comisiones de Fiscalización
```

---

## 🚀 Implementación en Frontend

### 1. Configuración Inicial

```javascript
// config/auth.js
export const AUTH_CONFIG = {
  TOKEN_KEY: 'lisadocs_access_token',
  REFRESH_KEY: 'lisadocs_refresh_token',
  USER_KEY: 'lisadocs_user',
  API_BASE: process.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'
}

// Utilidad para manejar el storage
export const authStorage = {
  setTokens(accessToken, refreshToken) {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, accessToken)
    localStorage.setItem(AUTH_CONFIG.REFRESH_KEY, refreshToken)
  },
  
  getAccessToken() {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
  },
  
  getRefreshToken() {
    return localStorage.getItem(AUTH_CONFIG.REFRESH_KEY)
  },
  
  setUser(user) {
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user))
  },
  
  getUser() {
    const user = localStorage.getItem(AUTH_CONFIG.USER_KEY)
    return user ? JSON.parse(user) : null
  },
  
  clear() {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
    localStorage.removeItem(AUTH_CONFIG.REFRESH_KEY)
    localStorage.removeItem(AUTH_CONFIG.USER_KEY)
  }
}
```

### 2. API Client con Interceptors

```javascript
// api/client.js
import axios from 'axios'
import { AUTH_CONFIG, authStorage } from '../config/auth'

const apiClient = axios.create({
  baseURL: AUTH_CONFIG.API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor - Agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor - Manejar renovación de tokens
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = authStorage.getRefreshToken()
      if (refreshToken) {
        try {
          const response = await axios.post(`${AUTH_CONFIG.API_BASE}/auth/refresh`, {
            refreshToken
          })
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens
          
          // Actualizar tokens
          authStorage.setTokens(accessToken, newRefreshToken)
          
          // Reintentar request original
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return apiClient(originalRequest)
          
        } catch (refreshError) {
          // Refresh failed, logout user
          authStorage.clear()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token, redirect to login
        authStorage.clear()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
```

### 3. Auth Service

```javascript
// services/authService.js
import apiClient from '../api/client'
import { authStorage } from '../config/auth'

export const authService = {
  // 🔐 Login
  async login(email, password, rememberMe = false) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        rememberMe
      })

      const { user, tokens } = response.data.data
      
      // Guardar tokens y usuario
      authStorage.setTokens(tokens.accessToken, tokens.refreshToken)
      authStorage.setUser(user)
      
      return {
        success: true,
        user,
        message: response.data.message
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión')
    }
  },

  // 📝 Register (solo para admins)
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData)
      return {
        success: true,
        user: response.data.data.user,
        message: response.data.message
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al registrar usuario')
    }
  },

  // 🔄 Refresh Token
  async refreshToken() {
    const refreshToken = authStorage.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken })
      const { tokens } = response.data.data
      
      authStorage.setTokens(tokens.accessToken, tokens.refreshToken)
      return tokens
    } catch (error) {
      authStorage.clear()
      throw new Error('Token refresh failed')
    }
  },

  // 🚪 Logout
  async logout(logoutAll = false) {
    try {
      const refreshToken = authStorage.getRefreshToken()
      await apiClient.post('/auth/logout', { 
        refreshToken,
        logoutAll 
      })
    } catch (error) {
      console.warn('Logout request failed:', error.message)
    } finally {
      authStorage.clear()
    }
  },

  // 👤 Get Profile
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile')
      const user = response.data.data
      authStorage.setUser(user)
      return user
    } catch (error) {
      throw new Error('Error al obtener perfil')
    }
  },

  // 🔧 Change Password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put('/auth/profile/password', {
        currentPassword,
        newPassword,
        confirmPassword: newPassword
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al cambiar contraseña')
    }
  },

  // ✅ Verify Token
  isAuthenticated() {
    const token = authStorage.getAccessToken()
    const user = authStorage.getUser()
    return !!(token && user)
  },

  // 👤 Get Current User
  getCurrentUser() {
    return authStorage.getUser()
  }
}
```

### 4. Auth Context (React)

```javascript
// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Inicializar autenticación al cargar la app
  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userProfile = await authService.getProfile()
          setUser(userProfile)
        } catch (error) {
          console.error('Failed to get profile:', error)
          // Token inválido, limpiar storage
          authService.logout()
        }
      }
      setLoading(false)
      setInitialized(true)
    }

    initializeAuth()
  }, [])

  // 🔐 Login
  const login = async (email, password, rememberMe = false) => {
    setLoading(true)
    try {
      const result = await authService.login(email, password, rememberMe)
      setUser(result.user)
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 🚪 Logout
  const logout = async (logoutAll = false) => {
    setLoading(true)
    try {
      await authService.logout(logoutAll)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setLoading(false)
    }
  }

  // 📝 Register
  const register = async (userData) => {
    setLoading(true)
    try {
      const result = await authService.register(userData)
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 🔄 Update Profile
  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData)
      setUser(updatedUser)
      return updatedUser
    } catch (error) {
      throw error
    }
  }

  // ✅ Check Permissions
  const hasPermission = (action, workspace = null) => {
    if (!user) return false
    
    // Administrador tiene todos los permisos
    if (user.role === 'administrador') return true
    
    // Verificar permisos específicos según role y workspace
    return user.permissions?.[action]?.includes(workspace || user.workspace)
  }

  // 🔍 Check Role
  const hasRole = (roles) => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  // 🏢 Check Workspace Access
  const hasWorkspaceAccess = (workspace) => {
    if (!user) return false
    if (user.role === 'administrador') return true
    return user.workspace === workspace || user.permissions?.canView?.includes(workspace)
  }

  const value = {
    // Estado
    user,
    loading,
    initialized,
    isAuthenticated: !!user,
    
    // Acciones
    login,
    logout,
    register,
    updateProfile,
    
    // Utilidades de permisos
    hasPermission,
    hasRole,
    hasWorkspaceAccess
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### 5. Protected Route Component

```javascript
// components/ProtectedRoute.jsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ 
  children, 
  roles = [], 
  workspaces = [],
  permissions = [],
  fallback = '/login'
}) => {
  const { user, loading, initialized } = useAuth()
  const location = useLocation()

  // Mostrar loading mientras se inicializa
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Si no está autenticado, redirigir a login
  if (!user) {
    return <Navigate to={fallback} state={{ from: location }} replace />
  }

  // Verificar roles requeridos
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Verificar workspaces requeridos
  if (workspaces.length > 0) {
    const hasWorkspaceAccess = workspaces.some(workspace => 
      user.workspace === workspace || 
      user.permissions?.canView?.includes(workspace)
    )
    if (!hasWorkspaceAccess) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Verificar permisos específicos
  if (permissions.length > 0) {
    const hasPermission = permissions.some(permission => 
      user.permissions?.[permission] || user.role === 'administrador'
    )
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return children
}

export default ProtectedRoute
```

### 6. Login Component Example

```javascript
// components/Login.jsx
import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.email, formData.password, formData.rememberMe)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión - LisaDocs
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
              Recordarme
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
```

---

## 🔐 Matriz de Permisos

### Por Rol y Workspace

| Rol | Workspace | Permisos |
|-----|-----------|----------|
| **administrador** | Todos | ✅ Create, Read, Update, Delete, Archive, Manage |
| **presidente** | presidencia | ✅ Read, Update, Archive, Manage |
| **presidente** | Otros | ✅ Read |
| **vicepresidente** | presidencia | ✅ Read, Update, Archive |
| **secretario_cam** | cam | ✅ Create, Read, Update, Archive |
| **secretario_ampp** | ampp | ✅ Create, Read, Update, Archive |
| **secretario_cf** | comisiones_cf | ✅ Create, Read, Update, Archive |
| **intendente** | intendencia | ✅ Create, Read, Update, Archive, Manage |
| **cf_member** | comisiones_cf | ✅ Read, Update |

---

## 🚨 Manejo de Errores de Autenticación

```javascript
// utils/authErrors.js
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  USER_NOT_FOUND: 'Usuario no encontrado',
  USER_INACTIVE: 'Usuario inactivo',
  TOKEN_EXPIRED: 'Token expirado',
  TOKEN_INVALID: 'Token inválido',
  INSUFFICIENT_PERMISSIONS: 'Permisos insuficientes',
  WORKSPACE_ACCESS_DENIED: 'Acceso denegado al workspace',
  RATE_LIMIT_EXCEEDED: 'Demasiados intentos, intenta más tarde'
}

export const getAuthErrorMessage = (error) => {
  const errorCode = error.response?.data?.error?.code
  return AUTH_ERRORS[errorCode] || error.message || 'Error de autenticación'
}
```

---

## 🎯 Ejemplo de Uso Completo

```javascript
// App.jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './components/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import Documents from './pages/Documents'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute roles={['administrador']}>
              <AdminPanel />
            </ProtectedRoute>
          } />
          
          <Route path="/documents/:workspace" element={
            <ProtectedRoute workspaces={['presidencia', 'cam', 'ampp']}>
              <Documents />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
```

---

¡Con esta guía tienes todo lo necesario para implementar la autenticación de manera súper robusta! 🔐✨
