# 📚 LisaDocs Backend - Documentación Completa API

## 🎯 Índice

- [Arquitectura General](#-arquitectura-general)
- [Configuración y Setup](#-configuración-y-setup)
- [Autenticación](#-autenticación)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Modelos de Datos](#-modelos-de-datos)
- [Middleware](#-middleware)
- [Servicios](#-servicios)
- [Guía de Conexión Frontend](#-guía-de-conexión-frontend)

---

## 🏗️ Arquitectura General

### Stack Tecnológico

- **Framework**: Fastify (Node.js)
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT con Refresh Tokens
- **Almacenamiento**: MinIO (S3-compatible)
- **Validación**: Zod schemas
- **Logging**: Pino

### Estructura del Proyecto

```
backend/
├── src/
│   ├── config/         # Configuraciones
│   ├── middleware/     # Middlewares de autenticación, validación, etc.
│   ├── routes/         # Endpoints organizados por módulos
│   ├── services/       # Lógica de negocio
│   ├── schemas/        # Esquemas de validación Zod
│   ├── types/          # Definiciones TypeScript
│   ├── utils/          # Utilidades (JWT, passwords, etc.)
│   ├── app.ts          # Configuración de la aplicación
│   └── server.ts       # Punto de entrada del servidor
├── prisma/             # Schema y migraciones de base de datos
└── uploads/            # Archivos subidos (desarrollo)
```

---

## ⚙️ Configuración y Setup

### Variables de Entorno (.env)

```env
# Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/lisadocs"

# JWT
JWT_SECRET="tu-clave-super-secreta-de-al-menos-32-caracteres"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Server
PORT=3001
HOST="0.0.0.0"
NODE_ENV="development"

# Security
BCRYPT_ROUNDS=12

# CORS
FRONTEND_URL="http://localhost:5173"
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"

# File Upload
MAX_FILE_SIZE_MB=50
ALLOWED_FILE_TYPES="pdf,doc,docx,xls,xlsx,txt,jpg,png,gif"

# MinIO/Storage
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="tu_access_key"
MINIO_SECRET_KEY="tu_secret_key"
MINIO_BUCKET_NAME="lisadocs-documents"
MINIO_USE_SSL="false"

# Logging
LOG_LEVEL="info"
```

### Configuración del Servidor

El servidor se configura en `src/server.ts` con:

- CORS habilitado para frontend
- Rate limiting
- Helmet para seguridad
- Logging estructurado
- Manejo de errores global

---

## 🔐 Autenticación

### Sistema de Autenticación JWT

- **Access Token**: 24 horas de duración
- **Refresh Token**: 7 días de duración
- **Blacklist**: Tokens revocados se almacenan en memoria

### Headers Requeridos

```javascript
{
  "Authorization": "Bearer your-jwt-token",
  "Content-Type": "application/json"
}
```

### Respuesta de Autenticación

```javascript
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "fullName": "Usuario Ejemplo",
      "role": "administrador",
      "workspace": "presidencia",
      "isActive": true,
      "lastLoginAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "24h"
    }
  }
}
```

---

## 🌐 Endpoints de la API

### Base URL

```
http://localhost:3001/api/v1
```

## 🔐 Autenticación

### POST /auth/login

**Descripción**: Iniciar sesión
**Body**:

```javascript
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### POST /auth/register

**Descripción**: Registrar nuevo usuario (solo admin)
**Headers**: Authorization requerida
**Body**:

```javascript
{
  "fullName": "Nuevo Usuario",
  "email": "nuevo@example.com",
  "password": "securePassword123",
  "role": "presidente",
  "workspace": "presidencia"
}
```

### POST /auth/refresh

**Descripción**: Renovar token
**Body**:

```javascript
{
  "refreshToken": "your-refresh-token"
}
```

### POST /auth/logout

**Descripción**: Cerrar sesión
**Headers**: Authorization requerida

### GET /auth/profile

**Descripción**: Obtener perfil del usuario autenticado
**Headers**: Authorization requerida

## 👥 Usuarios

### GET /users

**Descripción**: Listar usuarios
**Headers**: Authorization requerida
**Query Parameters**:

```javascript
{
  "limit": 20,
  "offset": 0,
  "role": "administrador",
  "workspace": "presidencia",
  "search": "nombre",
  "isActive": true
}
```

### POST /users

**Descripción**: Crear usuario
**Headers**: Authorization requerida (solo admin)
**Body**:

```javascript
{
  "fullName": "Usuario Nuevo",
  "email": "usuario@example.com",
  "password": "securePass123",
  "role": "presidente",
  "workspace": "presidencia"
}
```

### PUT /users/:id

**Descripción**: Actualizar usuario
**Headers**: Authorization requerida
**Body**:

```javascript
{
  "fullName": "Nombre Actualizado",
  "role": "vicepresidente",
  "isActive": true
}
```

### GET /users/:id/permissions

**Descripción**: Obtener permisos de usuario
**Headers**: Authorization requerida

## 📄 Documentos

### GET /documents

**Descripción**: Listar documentos
**Headers**: Authorization requerida
**Query Parameters**:

```javascript
{
  "limit": 20,
  "offset": 0,
  "workspace": "presidencia",
  "status": "stored",
  "search": "título",
  "tags": ["urgente", "confidencial"],
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31"
}
```

### POST /documents/upload

**Descripción**: Subir documento
**Headers**: Authorization requerida + multipart/form-data
**Body** (FormData):

```javascript
{
  "title": "Título del documento",
  "description": "Descripción opcional",
  "workspace": "presidencia",
  "tags": ["tag1", "tag2"],
  "file": File // Archivo a subir
}
```

### GET /documents/:id

**Descripción**: Obtener documento por ID
**Headers**: Authorization requerida

### GET /documents/:id/download

**Descripción**: Descargar archivo del documento
**Headers**: Authorization requerida

### PUT /documents/:id/status

**Descripción**: Cambiar estado del documento
**Headers**: Authorization requerida
**Body**:

```javascript
{
  "status": "archived",
  "reason": "Documento archivado por política"
}
```

### DELETE /documents/:id

**Descripción**: Eliminar documento
**Headers**: Authorization requerida (solo propietario o admin)

## 🔔 Notificaciones

### GET /notifications

**Descripción**: Obtener notificaciones del usuario
**Headers**: Authorization requerida
**Query Parameters**:

```javascript
{
  "limit": 20,
  "offset": 0,
  "isRead": false,
  "type": "info",
  "priority": "high"
}
```

### POST /notifications

**Descripción**: Crear notificación (solo admin)
**Headers**: Authorization requerida
**Body**:

```javascript
{
  "title": "Título de la notificación",
  "content": "Contenido de la notificación",
  "type": "info",
  "priority": "normal",
  "recipients": {
    "type": "role",
    "roles": ["presidente", "vicepresidente"]
  }
}
```

### PUT /notifications/:id/read

**Descripción**: Marcar notificación como leída
**Headers**: Authorization requerida

## 🏢 Workspaces

### GET /workspaces

**Descripción**: Obtener workspaces disponibles
**Headers**: Authorization requerida

### GET /workspaces/:workspace

**Descripción**: Obtener detalles de workspace específico
**Headers**: Authorization requerida

### GET /workspaces/:workspace/documents

**Descripción**: Documentos específicos del workspace
**Headers**: Authorization requerizada

### GET /workspaces/:workspace/stats

**Descripción**: Estadísticas del workspace
**Headers**: Authorization requerida

## 👑 Admin

### GET /admin/dashboard

**Descripción**: Dashboard administrativo
**Headers**: Authorization requerida (solo admin)

### GET /admin/audit/logs

**Descripción**: Logs de auditoría
**Headers**: Authorization requerida (solo admin)

### GET /admin/system-info

**Descripción**: Información del sistema
**Headers**: Authorization requerida (solo admin)

---

## 📊 Modelos de Datos

### Usuario

```typescript
interface User {
  id: string
  email: string
  fullName: string
  role: 'administrador' | 'presidente' | 'vicepresidente' | 'secretario_cam' | 'secretario_ampp' | 'secretario_cf' | 'intendente' | 'cf_member'
  workspace: 'presidencia' | 'intendencia' | 'cam' | 'ampp' | 'comisiones_cf'
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

### Documento

```typescript
interface Document {
  id: string
  title: string
  description?: string
  fileName: string
  fileSize: number
  mimeType: string
  fileHash: string
  status: 'draft' | 'stored' | 'archived'
  workspace: WorkspaceType
  tags: string[]
  metadata: Record<string, any>
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

### Notificación

```typescript
interface Notification {
  id: string
  title: string
  content: string
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  isRead: boolean
  readAt?: Date
  createdAt: Date
  expiresAt?: Date
}
```

---

## 🛡️ Middleware

### Autenticación (`authenticate`)

- Verifica JWT token
- Carga datos del usuario
- Valida permisos de workspace

### Validación (`validate`)

- Esquemas Zod para validar request body/query/params
- Sanitización automática de datos
- Manejo de errores de validación

### Rate Limiting

- Límite por IP y por usuario autenticado
- Configuración flexible por endpoint

### Error Handling

- Manejo centralizado de errores
- Logging estructurado
- Respuestas consistentes

---

## 🔧 Servicios

### AuthService

- Login/logout/refresh tokens
- Verificación de permisos
- Gestión de sesiones

### UserService

- CRUD de usuarios
- Validación de roles/workspaces
- Estadísticas de usuarios

### DocumentService

- Gestión de documentos
- Upload/download de archivos
- Control de versiones y estados

### FileService

- Integración con MinIO
- Gestión de buckets por workspace
- Generación de URLs firmadas

### NotificationService

- Envío de notificaciones
- Templates y personalización
- Gestión de destinatarios

---

## 🚀 Guía de Conexión Frontend

### 1. Configuración Base

```javascript
// config/api.js
const API_BASE_URL = 'http://localhost:3001/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### 2. Interceptor de Autenticación

```javascript
// Agregar token a requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Manejar respuestas y renovar tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, intentar renovar
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })
          const { accessToken } = response.data.data.tokens
          localStorage.setItem('accessToken', accessToken)
          // Reintentar request original
          error.config.headers.Authorization = `Bearer ${accessToken}`
          return api.request(error.config)
        } catch (refreshError) {
          // Refresh falló, redirectar a login
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)
```

### 3. Servicio de Autenticación

```javascript
// services/authService.js
export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    const { user, tokens } = response.data.data
    
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    
    return user
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken')
    await api.post('/auth/logout', { refreshToken })
    localStorage.clear()
  },

  async getProfile() {
    const response = await api.get('/auth/profile')
    return response.data.data
  }
}
```

### 4. Servicio de Documentos

```javascript
// services/documentService.js
export const documentService = {
  async getDocuments(filters = {}) {
    const params = new URLSearchParams(filters)
    const response = await api.get(`/documents?${params}`)
    return response.data.data
  },

  async uploadDocument(formData) {
    const response = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data
  },

  async downloadDocument(documentId) {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    })
    return response.data
  }
}
```

### 5. Context de Autenticación (React)

```javascript
// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          const profile = await authService.getProfile()
          setUser(profile)
        } catch (error) {
          localStorage.clear()
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    const userData = await authService.login(email, password)
    setUser(userData)
    return userData
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### 6. Manejo de Errores Globalizado

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'Error inesperado del servidor'
}

// Hook para manejar errores
export const useApiError = () => {
  const [error, setError] = useState(null)
  
  const clearError = () => setError(null)
  
  const handleError = (error) => {
    const message = handleApiError(error)
    setError(message)
  }
  
  return { error, handleError, clearError }
}
```

### 7. Estados de Carga y UI

```javascript
// hooks/useApi.js
import { useState } from 'react'

export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = async (apiCall) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiCall()
      return result
    } catch (err) {
      setError(handleApiError(err))
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, execute }
}
```

---

## ✨ Ejemplos de Uso Completos

### Login Component

```javascript
// components/Login.jsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApiError } from '../utils/errorHandler'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { error, handleError, clearError } = useApiError()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    clearError()
    
    try {
      await login(email, password)
      // Redirect o mostrar éxito
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required 
      />
      <input 
        type="password"
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        required 
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
      </button>
    </form>
  )
}
```

### Document Upload Component

```javascript
// components/DocumentUpload.jsx
import { useState } from 'react'
import { documentService } from '../services/documentService'

const DocumentUpload = ({ workspace, onSuccess }) => {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !title) return

    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('description', description)
    formData.append('workspace', workspace)
    
    try {
      const document = await documentService.uploadDocument(formData)
      onSuccess(document)
      // Reset form
      setFile(null)
      setTitle('')
      setDescription('')
    } catch (error) {
      console.error('Error uploading:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Título del documento"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png,.gif"
        required
      />
      <button type="submit" disabled={uploading || !file || !title}>
        {uploading ? 'Subiendo...' : 'Subir Documento'}
      </button>
    </form>
  )
}
```

---

## 🔧 Configuración Recomendada del Frontend

### 1. Variables de Entorno (.env)

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_MAX_FILE_SIZE=52428800
VITE_ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,txt,jpg,png,gif
```

### 2. Estructura Recomendada

```
frontend/src/
├── api/              # Servicios de API
├── components/       # Componentes reutilizables
├── contexts/         # Contexts de React
├── hooks/            # Custom hooks
├── pages/            # Páginas/Vistas
├── utils/            # Utilidades
├── types/            # Tipos TypeScript
└── config/           # Configuraciones
```

---

## 🚨 Códigos de Error Comunes

### Autenticación

- `401`: Token inválido o expirado
- `403`: Permisos insuficientes
- `USER_NOT_FOUND`: Usuario no existe
- `INVALID_CREDENTIALS`: Credenciales incorrectas

### Validación

- `400`: Datos de entrada inválidos
- `VALIDATION_ERROR`: Error de esquema Zod

### Documentos

- `FILE_TOO_LARGE`: Archivo excede límite de tamaño
- `INVALID_FILE_TYPE`: Tipo de archivo no permitido
- `DOCUMENT_NOT_FOUND`: Documento no existe

### Workspace

- `WORKSPACE_ACCESS_DENIED`: Sin acceso al workspace
- `INVALID_WORKSPACE`: Workspace no válido

---

¡Y eso es todo! 🎉 ¡Tienes una documentación súper completa para conectar tu frontend de manera exitosa! 💪

¿Necesitas que profundice en alguna sección específica o tienes alguna pregunta sobre la implementación? ¡Estoy aquí para ayudarte! 🚀✨
