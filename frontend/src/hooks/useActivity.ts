import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from './useAuth'

// 📊 Tipos para la actividad
interface ActivityUser {
  id: string
  fullName: string
  email: string
  role: string
}

interface ActivityDocument {
  id: string
  title: string
  fileName: string
  workspace: string
  status: string
}

interface ActivityItem {
  id: string
  action: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user: ActivityUser
  document: ActivityDocument
}

interface ActivityResponse {
  success: boolean
  message: string
  data: {
    activities: ActivityItem[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

interface RecentActivityItem {
  id: string
  action: string
  createdAt: string
  description: string
  user: {
    id: string
    fullName: string
    role: string
  }
  document: {
    id: string
    title: string
    fileName: string
    workspace: string
  }
}

interface RecentActivityResponse {
  success: boolean
  message: string
  data: RecentActivityItem[]
}

// 📋 Filtros para obtener actividades
interface ActivityFilters {
  documentId?: string
  userId?: string
  action?: string
  workspace?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

// 🎯 Hook principal para manejar la actividad
export const useActivity = () => {
  // 🔐 Contexto de autenticación
  const { tokens } = useAuth()
  
  // 📊 Estados
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // 🌐 Función para obtener actividades con filtros
  const fetchActivities = useCallback(async (filters: ActivityFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      // 📋 Agregar filtros como query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      // 🔐 Headers con autenticación
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (tokens?.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`
      }

      const response = await fetch(`/api/activity?${params.toString()}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch activities')
      }

      const data: ActivityResponse = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch activities')
      }

      // 📊 Actualizar estados
      if (filters.offset === 0 || !filters.offset) {
        // Primera página - reemplazar actividades
        setActivities(data.data.activities)
      } else {
        // Páginas siguientes - agregar a las existentes
        setActivities(prev => [...prev, ...data.data.activities])
      }

      setTotalCount(data.data.pagination.total)
      setHasMore(data.data.pagination.hasMore)

      console.log('✅ Activities fetched:', {
        count: data.data.activities.length,
        total: data.data.pagination.total,
        hasMore: data.data.pagination.hasMore
      })

    } catch (error: any) {
      console.error('❌ Fetch activities error:', error)
      setError(error.message || 'Error al cargar la actividad')
      toast.error('Error al cargar la actividad')
    } finally {
      setLoading(false)
    }
  }, [tokens])

  // 🕐 Función para obtener actividad reciente
  const fetchRecentActivity = useCallback(async (limit: number = 20) => {
    setLoading(true)
    setError(null)

    try {
      // 🔐 Headers con autenticación
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (tokens?.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`
      }

      const response = await fetch(`/api/activity/recent?limit=${limit}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch recent activity')
      }

      const data: RecentActivityResponse = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch recent activity')
      }

      setRecentActivity(data.data)

      console.log('✅ Recent activity fetched:', {
        count: data.data.length
      })

    } catch (error: any) {
      console.error('❌ Fetch recent activity error:', error)
      setError(error.message || 'Error al cargar la actividad reciente')
      toast.error('Error al cargar la actividad reciente')
    } finally {
      setLoading(false)
    }
  }, [tokens])

  // 📊 Función para obtener estadísticas de actividad
  const fetchActivityStats = useCallback(async (dateFrom?: string, dateTo?: string) => {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      // 🔐 Headers con autenticación
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (tokens?.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`
      }

      const response = await fetch(`/api/activity/stats?${params.toString()}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch activity stats')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch activity stats')
      }

      return data.data

    } catch (error: any) {
      console.error('❌ Fetch activity stats error:', error)
      toast.error('Error al cargar las estadísticas')
      throw error
    }
  }, [tokens])

  // 🔄 Función para cargar más actividades (paginación)
  const loadMore = useCallback(async (filters: ActivityFilters = {}) => {
    if (!hasMore || loading) return

    const newFilters = {
      ...filters,
      offset: activities.length
    }

    await fetchActivities(newFilters)
  }, [hasMore, loading, activities.length, fetchActivities])

  // 🔄 Función para refrescar actividades
  const refresh = useCallback(async (filters: ActivityFilters = {}) => {
    await fetchActivities({ ...filters, offset: 0 })
  }, [fetchActivities])

  // 🧹 Función para limpiar estados
  const clear = useCallback(() => {
    setActivities([])
    setRecentActivity([])
    setError(null)
    setTotalCount(0)
    setHasMore(false)
  }, [])

  return {
    // 📊 Estados
    activities,
    recentActivity,
    loading,
    error,
    totalCount,
    hasMore,

    // 🔧 Funciones
    fetchActivities,
    fetchRecentActivity,
    fetchActivityStats,
    loadMore,
    refresh,
    clear,

    // 📊 Utilidades computadas
    isEmpty: activities.length === 0 && !loading,
    recentIsEmpty: recentActivity.length === 0 && !loading
  }
}

// 🎯 Hook específico para actividad reciente (para dashboard)
export const useRecentActivity = (limit: number = 15) => {
  // 🔐 Contexto de autenticación
  const { tokens } = useAuth()
  
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentActivity = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 🔐 Headers con autenticación
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (tokens?.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`
      }

      const response = await fetch(`/api/activity/recent?limit=${limit}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch recent activity')
      }

      const data: RecentActivityResponse = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch recent activity')
      }

      setRecentActivity(data.data)

    } catch (error: any) {
      console.error('❌ Fetch recent activity error:', error)
      setError(error.message || 'Error al cargar la actividad reciente')
      // No mostrar toast aquí para evitar spam en dashboard
    } finally {
      setLoading(false)
    }
  }, [limit, tokens])

  // 🔄 Efecto para cargar datos inicialmente
  useEffect(() => {
    fetchRecentActivity()
  }, [fetchRecentActivity])

  // 🔄 Función para refrescar
  const refresh = useCallback(() => {
    fetchRecentActivity()
  }, [fetchRecentActivity])

  return {
    recentActivity,
    loading,
    error,
    refresh,
    isEmpty: recentActivity.length === 0 && !loading
  }
}

export default useActivity 