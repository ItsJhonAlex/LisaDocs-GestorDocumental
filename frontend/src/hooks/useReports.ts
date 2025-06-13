import { useState, useEffect, useCallback } from 'react'

// 📊 Tipos para los reportes
export interface ReportStats {
  overview: {
    totalDocuments: number
    totalUsers: number
    totalActiveUsers: number
    storageUsed: number
    storageUsedGB: number
    documentsThisMonth: number
    documentsLastMonth: number
    growthPercentage: number
  }
  documentsByWorkspace: Record<string, number>
  documentsByStatus: Record<string, number>
  documentsByMonth: Record<string, number>
  usersByRole: Record<string, number>
  recentActivity: Array<{
    date: string
    action: string
    count: number
  }>
}

interface UseReportsOptions {
  period?: '1month' | '3months' | '6months' | '1year'
  workspace?: string
  autoLoad?: boolean
}

interface StatsResponse {
  success: boolean
  message: string
  data: ReportStats
}

export function useReports(options: UseReportsOptions = {}) {
  const { period = '6months', workspace, autoLoad = true } = options
  
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  /**
   * 📊 Obtener estadísticas del backend
   */
  const fetchStats = useCallback(async (
    customPeriod?: string,
    customWorkspace?: string
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('📊 Fetching statistics:', {
        period: customPeriod || period,
        workspace: customWorkspace || workspace
      })

      const params = new URLSearchParams({
        period: customPeriod || period
      })

      if (customWorkspace || workspace) {
        params.append('workspace', customWorkspace || workspace!)
      }

      const response = await fetch(`/api/reports/stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const result: StatsResponse = await response.json()

      console.log('✅ Statistics retrieved successfully:', result.data.overview)

      setStats(result.data)
      return result.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error fetching statistics:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [period, workspace])

  /**
   * 📤 Exportar reporte
   */
  const exportReport = useCallback(async (
    format: 'csv' | 'excel' | 'pdf',
    type: 'documents' | 'users' | 'activity' | 'overview',
    customPeriod?: string,
    customWorkspace?: string
  ) => {
    setIsExporting(true)
    setError(null)

    try {
      console.log('📤 Exporting report:', { format, type, period: customPeriod || period })

      const params = new URLSearchParams({
        format,
        type,
        period: customPeriod || period
      })

      if (customWorkspace || workspace) {
        params.append('workspace', customWorkspace || workspace!)
      }

      const response = await fetch(`/api/reports/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        )
      }

      // Si el response contiene un archivo, descargarlo
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        // Es una respuesta JSON (probablemente un placeholder)
        const result = await response.json()
        console.log('📋 Export response:', result)
        
        // TODO: Mostrar mensaje al usuario sobre el estado de la exportación
        return result
      } else {
        // Es un archivo, descargarlo
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // 📝 Determinar la extensión correcta según el formato
        const getFileExtension = (format: string): string => {
          switch (format) {
            case 'excel':
              return 'xlsx'
            case 'csv':
              return 'csv'
            case 'pdf':
              return 'pdf'
            default:
              return format
          }
        }
        
        const extension = getFileExtension(format)
        link.download = `reporte-${type}-${new Date().toISOString().split('T')[0]}.${extension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        console.log('✅ Report downloaded successfully')
        return { success: true, message: 'Reporte descargado exitosamente' }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error exporting report:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setIsExporting(false)
    }
  }, [period, workspace])

  /**
   * 📊 Refrescar estadísticas
   */
  const refreshStats = useCallback(() => {
    return fetchStats()
  }, [fetchStats])

  /**
   * 🔄 Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 📈 Obtener porcentaje de crecimiento formateado
   */
  const getGrowthDisplay = useCallback(() => {
    if (!stats?.overview.growthPercentage) return '0%'
    
    const growth = stats.overview.growthPercentage
    const sign = growth > 0 ? '+' : ''
    return `${sign}${growth}%`
  }, [stats])

  /**
   * 💾 Formatear tamaño de almacenamiento
   */
  const getStorageDisplay = useCallback(() => {
    if (!stats?.overview.storageUsedGB) return '0 GB'
    
    const gb = stats.overview.storageUsedGB
    if (gb < 1) {
      return `${(gb * 1024).toFixed(0)} MB`
    }
    return `${gb.toFixed(1)} GB`
  }, [stats])

  /**
   * 🏢 Formatear nombre de workspace
   */
  const formatWorkspaceName = useCallback((workspace: string) => {
    const names: Record<string, string> = {
      'presidencia': 'Presidencia',
      'cam': 'CAM',
      'ampp': 'AMPP',
      'intendencia': 'Intendencia',
      'comisiones_cf': 'Comisiones CF'
    }
    return names[workspace] || workspace
  }, [])

  /**
   * 🎯 Auto-cargar estadísticas al montar el componente
   */
  useEffect(() => {
    if (autoLoad) {
      fetchStats().catch(console.error)
    }
  }, [autoLoad, fetchStats])

  return {
    // Estado
    stats,
    isLoading,
    isExporting,
    error,
    
    // Acciones
    fetchStats,
    exportReport,
    refreshStats,
    clearError,
    
    // Utilidades
    getGrowthDisplay,
    getStorageDisplay,
    formatWorkspaceName
  }
} 