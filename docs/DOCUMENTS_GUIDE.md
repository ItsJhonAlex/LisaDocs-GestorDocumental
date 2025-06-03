# 📄 Guía de Gestión de Documentos - LisaDocs

## 🎯 Resumen del Sistema de Documentos

LisaDocs proporciona un sistema completo de gestión documental con upload, download, archivado y control de permisos por workspace.

### Características Principales

- ✅ **Upload Seguro**: Validación de tipos y tamaños de archivo
- ✅ **Storage con MinIO**: Almacenamiento escalable S3-compatible
- ✅ **Control de Permisos**: Acceso basado en roles y workspaces
- ✅ **Estados de Documentos**: Draft, Stored, Archived
- ✅ **Metadatos Flexibles**: Tags, categorías, búsqueda
- ✅ **Audit Trail**: Registro completo de actividades

---

## 📊 Estados de Documentos

```typescript
type DocumentStatus = 
  | 'draft'      // 📝 Borrador - En proceso de creación
  | 'stored'     // 📁 Almacenado - Disponible para uso
  | 'archived'   // 📦 Archivado - Solo lectura
```

### Transiciones de Estado Permitidas

```
draft → stored → archived
  ↓       ↓
deleted deleted
```

---

## 🔧 Configuración de Archivos

### Tipos de Archivo Permitidos

```javascript
const ALLOWED_FILE_TYPES = [
  // Documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  
  // Imágenes
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  
  // Comprimidos
  'application/zip',
  'application/x-rar-compressed'
]

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv',
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.zip', '.rar'
]
```

### Límites de Archivo

- **Tamaño máximo**: 50MB por archivo
- **Cantidad máxima**: 5 archivos por upload (bulk)

---

## 🚀 Implementación en Frontend

### 1. Servicio de Documentos

```javascript
// services/documentService.js
import apiClient from '../api/client'

export const documentService = {
  // 📄 Obtener lista de documentos
  async getDocuments(filters = {}) {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v))
        } else {
          params.append(key, value)
        }
      }
    })

    const response = await apiClient.get(`/documents?${params}`)
    return response.data.data
  },

  // 📄 Obtener documento por ID
  async getDocument(id) {
    const response = await apiClient.get(`/documents/${id}`)
    return response.data.data
  },

  // 📤 Subir documento
  async uploadDocument(formData, onProgress) {
    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      }
    })
    return response.data.data
  },

  // 📥 Descargar documento
  async downloadDocument(id, filename) {
    const response = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob'
    })
    
    // Crear URL para descarga
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  // 🔄 Cambiar estado del documento
  async updateStatus(id, status, reason) {
    const response = await apiClient.put(`/documents/${id}/status`, {
      status,
      reason
    })
    return response.data.data
  },

  // ✏️ Actualizar documento
  async updateDocument(id, updateData) {
    const response = await apiClient.put(`/documents/${id}`, updateData)
    return response.data.data
  },

  // 🗑️ Eliminar documento
  async deleteDocument(id) {
    const response = await apiClient.delete(`/documents/${id}`)
    return response.data
  },

  // 🔍 Buscar documentos
  async searchDocuments(query, filters = {}) {
    const params = new URLSearchParams({
      search: query,
      ...filters
    })
    
    const response = await apiClient.get(`/documents/search?${params}`)
    return response.data.data
  },

  // 📊 Obtener estadísticas
  async getDocumentStats(workspace) {
    const response = await apiClient.get(`/documents/stats${workspace ? `?workspace=${workspace}` : ''}`)
    return response.data.data
  }
}
```

### 2. Hook para Gestión de Documentos

```javascript
// hooks/useDocuments.js
import { useState, useEffect } from 'react'
import { documentService } from '../services/documentService'
import { useAuth } from '../contexts/AuthContext'

export const useDocuments = (initialFilters = {}) => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [filters, setFilters] = useState(initialFilters)
  
  const { user } = useAuth()

  // Cargar documentos
  const loadDocuments = async (newFilters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const finalFilters = { ...filters, ...newFilters }
      const result = await documentService.getDocuments(finalFilters)
      
      setDocuments(result.documents)
      setTotal(result.total)
      setHasMore(result.hasMore)
      setFilters(finalFilters)
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar documentos')
    } finally {
      setLoading(false)
    }
  }

  // Cargar más documentos (paginación)
  const loadMore = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const newFilters = {
        ...filters,
        offset: documents.length
      }
      
      const result = await documentService.getDocuments(newFilters)
      setDocuments(prev => [...prev, ...result.documents])
      setHasMore(result.hasMore)
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar más documentos')
    } finally {
      setLoading(false)
    }
  }

  // Subir documento
  const uploadDocument = async (file, metadata, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, value)
        }
      }
    })

    try {
      const newDocument = await documentService.uploadDocument(formData, onProgress)
      setDocuments(prev => [newDocument, ...prev])
      setTotal(prev => prev + 1)
      return newDocument
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Error al subir documento')
    }
  }

  // Actualizar documento
  const updateDocument = async (id, updateData) => {
    try {
      const updatedDocument = await documentService.updateDocument(id, updateData)
      setDocuments(prev => 
        prev.map(doc => doc.id === id ? updatedDocument : doc)
      )
      return updatedDocument
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Error al actualizar documento')
    }
  }

  // Cambiar estado
  const changeStatus = async (id, status, reason) => {
    try {
      const updatedDocument = await documentService.updateStatus(id, status, reason)
      setDocuments(prev =>
        prev.map(doc => doc.id === id ? updatedDocument : doc)
      )
      return updatedDocument
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Error al cambiar estado')
    }
  }

  // Eliminar documento
  const deleteDocument = async (id) => {
    try {
      await documentService.deleteDocument(id)
      setDocuments(prev => prev.filter(doc => doc.id !== id))
      setTotal(prev => prev - 1)
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Error al eliminar documento')
    }
  }

  // Efecto inicial
  useEffect(() => {
    if (user) {
      loadDocuments()
    }
  }, [user])

  return {
    // Estado
    documents,
    loading,
    error,
    total,
    hasMore,
    filters,
    
    // Acciones
    loadDocuments,
    loadMore,
    uploadDocument,
    updateDocument,
    changeStatus,
    deleteDocument,
    setFilters
  }
}
```

### 3. Componente de Upload

```javascript
// components/DocumentUpload.jsx
import React, { useState, useRef } from 'react'
import { useDocuments } from '../hooks/useDocuments'
import { useAuth } from '../contexts/AuthContext'

const DocumentUpload = ({ workspace, onSuccess, onError }) => {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    tags: [],
    workspace: workspace
  })
  
  const fileInputRef = useRef(null)
  const { user } = useAuth()
  const { uploadDocument } = useDocuments()

  // Manejar drag & drop
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      // Validar tipo
      const isValidType = ALLOWED_FILE_TYPES.includes(file.type)
      // Validar tamaño (50MB)
      const isValidSize = file.size <= 50 * 1024 * 1024
      
      return isValidType && isValidSize
    })

    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!files.length || !metadata.title) return

    setUploading(true)
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileMetadata = {
          ...metadata,
          title: files.length > 1 ? `${metadata.title} (${i + 1})` : metadata.title
        }

        await uploadDocument(
          file,
          fileMetadata,
          (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [i]: progress
            }))
          }
        )
      }

      // Reset form
      setFiles([])
      setMetadata({
        title: '',
        description: '',
        tags: [],
        workspace
      })
      setUploadProgress({})
      
      if (onSuccess) onSuccess()
      
    } catch (error) {
      if (onError) onError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleTagAdd = (tag) => {
    if (tag && !metadata.tags.includes(tag)) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  const handleTagRemove = (tagToRemove) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Metadata Form */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Título del Documento *
            </label>
            <input
              type="text"
              required
              value={metadata.title}
              onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              rows={3}
              value={metadata.description}
              onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Etiquetas
            </label>
            <div className="mt-1">
              <TagInput
                tags={metadata.tags}
                onAdd={handleTagAdd}
                onRemove={handleTagRemove}
              />
            </div>
          </div>
        </div>

        {/* File Drop Zone */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${files.length > 0 ? 'border-green-500 bg-green-50' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          {files.length === 0 ? (
            <div>
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Haz clic para subir</span> o arrastra archivos aquí
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOC, XLS, IMG hasta 50MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-green-600">
                {files.length} archivo(s) seleccionado(s)
              </p>
              <p className="text-xs text-gray-500">
                Haz clic para agregar más archivos
              </p>
            </div>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Archivos Seleccionados:</h4>
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {uploadProgress[index] && (
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress[index]}%` }}
                      />
                    </div>
                  )}
                </div>
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || !files.length || !metadata.title}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Subiendo...' : `Subir ${files.length} Archivo(s)`}
        </button>
      </form>
    </div>
  )
}

// Componente auxiliar para tags
const TagInput = ({ tags, onAdd, onRemove }) => {
  const [inputValue, setInputValue] = useState('')

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        onAdd(inputValue.trim())
        setInputValue('')
      }
    }
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
        >
          {tag}
          <button
            type="button"
            onClick={() => onRemove(tag)}
            className="ml-1 text-blue-600 hover:text-blue-800"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Agregar etiqueta..."
        className="flex-1 min-w-0 border-none outline-none bg-transparent"
      />
    </div>
  )
}

export default DocumentUpload
```

### 4. Lista de Documentos

```javascript
// components/DocumentList.jsx
import React, { useState } from 'react'
import { useDocuments } from '../hooks/useDocuments'
import { useAuth } from '../contexts/AuthContext'
import { documentService } from '../services/documentService'

const DocumentList = ({ workspace, showFilters = true }) => {
  const { user } = useAuth()
  const {
    documents,
    loading,
    error,
    total,
    hasMore,
    loadDocuments,
    loadMore,
    changeStatus,
    deleteDocument
  } = useDocuments({ workspace, limit: 20 })

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    tags: []
  })

  const [actionLoading, setActionLoading] = useState({})

  // Aplicar filtros
  const applyFilters = () => {
    loadDocuments(filters)
  }

  // Descargar documento
  const handleDownload = async (document) => {
    setActionLoading(prev => ({ ...prev, [document.id]: 'downloading' }))
    try {
      await documentService.downloadDocument(document.id, document.fileName)
    } catch (error) {
      console.error('Error downloading:', error)
    } finally {
      setActionLoading(prev => ({ ...prev, [document.id]: false }))
    }
  }

  // Cambiar estado con confirmación
  const handleStatusChange = async (document, newStatus) => {
    const reason = prompt(`¿Razón para cambiar a ${newStatus}?`)
    if (!reason) return

    setActionLoading(prev => ({ ...prev, [document.id]: 'status' }))
    try {
      await changeStatus(document.id, newStatus, reason)
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setActionLoading(prev => ({ ...prev, [document.id]: false }))
    }
  }

  // Eliminar documento con confirmación
  const handleDelete = async (document) => {
    if (!confirm(`¿Estás seguro de eliminar "${document.title}"?`)) return

    setActionLoading(prev => ({ ...prev, [document.id]: 'deleting' }))
    try {
      await deleteDocument(document.id)
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setActionLoading(prev => ({ ...prev, [document.id]: false }))
    }
  }

  // Verificar permisos
  const canDownload = (document) => {
    return user?.role === 'administrador' || 
           user?.workspace === document.workspace ||
           user?.permissions?.canDownload?.includes(document.workspace)
  }

  const canChangeStatus = (document) => {
    return user?.role === 'administrador' ||
           document.createdBy === user?.id ||
           user?.permissions?.canArchive?.includes(document.workspace)
  }

  const canDelete = (document) => {
    return user?.role === 'administrador' || document.createdBy === user?.id
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'stored': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Borrador'
      case 'stored': return 'Almacenado'
      case 'archived': return 'Archivado'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Buscar</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Título, descripción..."
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="draft">Borrador</option>
                <option value="stored">Almacenado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-600">
          Mostrando {documents.length} de {total} documentos
          {workspace && ` en ${workspace}`}
        </p>
      </div>

      {/* Lista de documentos */}
      <div className="bg-white shadow rounded-lg">
        {loading && documents.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando documentos...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => loadDocuments()}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No se encontraron documentos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((document) => (
              <div key={document.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {document.title}
                        </h3>
                        {document.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {document.description}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                        {getStatusText(document.status)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>📁 {document.fileName}</span>
                      <span>📏 {(document.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>👤 {document.createdByUser.fullName}</span>
                      <span>📅 {new Date(document.createdAt).toLocaleDateString()}</span>
                    </div>

                    {document.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {document.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="ml-4 flex items-center space-x-2">
                    {canDownload(document) && (
                      <button
                        onClick={() => handleDownload(document)}
                        disabled={actionLoading[document.id]}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        title="Descargar"
                      >
                        {actionLoading[document.id] === 'downloading' ? '⏳' : '📥'}
                      </button>
                    )}

                    {canChangeStatus(document) && document.status !== 'archived' && (
                      <button
                        onClick={() => handleStatusChange(document, 
                          document.status === 'draft' ? 'stored' : 'archived'
                        )}
                        disabled={actionLoading[document.id]}
                        className="text-orange-600 hover:text-orange-800 disabled:opacity-50"
                        title={document.status === 'draft' ? 'Almacenar' : 'Archivar'}
                      >
                        {actionLoading[document.id] === 'status' ? '⏳' : 
                         document.status === 'draft' ? '💾' : '📦'}
                      </button>
                    )}

                    {canDelete(document) && (
                      <button
                        onClick={() => handleDelete(document)}
                        disabled={actionLoading[document.id]}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        title="Eliminar"
                      >
                        {actionLoading[document.id] === 'deleting' ? '⏳' : '🗑️'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="p-4 text-center border-t">
            <button
              onClick={loadMore}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Cargar más'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentList
```

---

## 📱 Ejemplos de Implementación Completa

### Page de Documentos por Workspace

```javascript
// pages/DocumentsPage.jsx
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import DocumentList from '../components/DocumentList'
import DocumentUpload from '../components/DocumentUpload'

const DocumentsPage = () => {
  const { workspace } = useParams()
  const { user, hasWorkspaceAccess } = useAuth()
  const [activeTab, setActiveTab] = useState('list')
  const [refreshKey, setRefreshKey] = useState(0)

  if (!hasWorkspaceAccess(workspace)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
          <p className="mt-2 text-gray-600">
            No tienes permisos para acceder a este workspace
          </p>
        </div>
      </div>
    )
  }

  const canUpload = user?.role === 'administrador' || 
                   user?.workspace === workspace ||
                   user?.permissions?.canUpload?.includes(workspace)

  const workspaceNames = {
    presidencia: 'Presidencia',
    intendencia: 'Intendencia',
    cam: 'Cámara de Comercio',
    ampp: 'Asociación de Municipios',
    comisiones_cf: 'Comisiones de Fiscalización'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Documentos - {workspaceNames[workspace]}
        </h1>
        <p className="mt-2 text-gray-600">
          Gestiona los documentos del workspace {workspace}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📄 Lista de Documentos
          </button>
          
          {canUpload && (
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📤 Subir Documentos
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <DocumentList 
          key={refreshKey}
          workspace={workspace} 
          showFilters={true}
        />
      )}

      {activeTab === 'upload' && canUpload && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Subir Nuevos Documentos</h2>
          <DocumentUpload
            workspace={workspace}
            onSuccess={() => {
              setActiveTab('list')
              setRefreshKey(prev => prev + 1)
            }}
            onError={(error) => {
              alert(`Error: ${error}`)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default DocumentsPage
```

---

## 🔧 Utilidades y Helpers

```javascript
// utils/documentHelpers.js
export const DOCUMENT_UTILS = {
  // Validar archivo antes del upload
  validateFile(file) {
    const errors = []
    
    // Validar tamaño
    if (file.size > 50 * 1024 * 1024) {
      errors.push('El archivo excede el límite de 50MB')
    }
    
    // Validar tipo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push('Tipo de archivo no permitido')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Formatear tamaño de archivo
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // Obtener icono por tipo de archivo
  getFileIcon(mimeType) {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦'
    return '📁'
  },

  // Generar slug para nombres de archivo
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
  }
}
```

¡Con esta guía tienes todo lo necesario para implementar la gestión completa de documentos en el frontend! 📄✨ ¿Te ayudo con alguna parte específica o tienes preguntas sobre la implementación? 🚀
