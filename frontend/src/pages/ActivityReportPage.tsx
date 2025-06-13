import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Activity, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar,
  Search,
  Users,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import ActivityFeed from '@/components/ActivityFeed'
import { useActivity } from '@/hooks/useActivity'
import { useAuth } from '@/hooks/useAuth'

// 📊 Filtros disponibles
const actionFilters = [
  { value: '', label: 'Todas las acciones' },
  { value: 'uploaded', label: 'Subidas' },
  { value: 'downloaded', label: 'Descargas' },
  { value: 'deleted', label: 'Eliminaciones' },
  { value: 'archived', label: 'Archivados' },
  { value: 'status_changed', label: 'Cambios de estado' },
  { value: 'viewed', label: 'Visualizaciones' },
  { value: 'updated', label: 'Actualizaciones' },
  { value: 'created', label: 'Creaciones' }
]

const workspaceFilters = [
  { value: '', label: 'Todos los espacios' },
  { value: 'presidencia', label: 'Presidencia' },
  { value: 'cam', label: 'CAM' },
  { value: 'ampp', label: 'AMPP' },
  { value: 'comisiones', label: 'Comisiones' },
  { value: 'intendencia', label: 'Intendencia' },
  { value: 'secretaria', label: 'Secretaría' }
]

// 🎯 Página principal de reportes de actividad
export function ActivityReportPage() {
  const { user } = useAuth()
  const { 
    activities, 
    loading, 
    error, 
    totalCount, 
    hasMore, 
    fetchActivities, 
    loadMore 
  } = useActivity()

  // 📋 Estados para filtros
  const [filters, setFilters] = useState({
    action: '',
    workspace: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
    limit: 50,
    offset: 0
  })

  // 🔄 Estados de UI
  const [isFiltering, setIsFiltering] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // 🔐 Verificar permisos
  const hasActivityAccess = user && (['administrador', 'presidente', 'vicepresidente'].includes(user.role) ||
                           user.role.includes('secretario'))

  // 🔄 Efecto para cargar actividades iniciales
  useEffect(() => {
    if (hasActivityAccess) {
      fetchActivities({ limit: 50 })
    }
  }, [hasActivityAccess, fetchActivities])

  // 🔍 Aplicar filtros
  const applyFilters = async () => {
    setIsFiltering(true)
    try {
      const cleanFilters: any = { limit: filters.limit, offset: 0 }
      
      if (filters.action) cleanFilters.action = filters.action
      if (filters.workspace) cleanFilters.workspace = filters.workspace
      if (filters.dateFrom) cleanFilters.dateFrom = filters.dateFrom
      if (filters.dateTo) cleanFilters.dateTo = filters.dateTo

      await fetchActivities(cleanFilters)
    } finally {
      setIsFiltering(false)
    }
  }

  // 🧹 Limpiar filtros
  const clearFilters = () => {
    setFilters({
      action: '',
      workspace: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: '',
      limit: 50,
      offset: 0
    })
    fetchActivities({ limit: 50 })
  }

  // 📄 Cargar más actividades
  const handleLoadMore = () => {
    const cleanFilters: any = { limit: filters.limit }
    if (filters.action) cleanFilters.action = filters.action
    if (filters.workspace) cleanFilters.workspace = filters.workspace
    if (filters.dateFrom) cleanFilters.dateFrom = filters.dateFrom
    if (filters.dateTo) cleanFilters.dateTo = filters.dateTo
    
    loadMore(cleanFilters)
  }

  // 🛡️ Verificar acceso
  if (!hasActivityAccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Acceso Restringido
              </h2>
              <p className="text-gray-600 text-center max-w-md">
                No tienes permisos para ver los reportes de actividad del sistema.
                Contacta con un administrador si necesitas acceso.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 🎯 Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Reportes de Actividad
            </h1>
            <p className="text-gray-600 mt-2">
              Monitorea todas las acciones realizadas en el sistema
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
            <Button onClick={() => fetchActivities({ limit: 50 })}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* 📊 Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Actividades</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalCount.toLocaleString()}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mostradas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activities.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activities.filter(a => 
                      new Date(a.createdAt).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(activities.map(a => a.user.id)).size}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🔍 Panel de filtros */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros de Búsqueda
              </CardTitle>
              <CardDescription>
                Filtra las actividades por acción, espacio de trabajo o fecha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 🎯 Filtro por acción */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Tipo de Acción
                  </label>
                  <Select 
                    value={filters.action} 
                    onValueChange={(value) => setFilters(f => ({ ...f, action: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar acción" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionFilters.map(filter => (
                        <SelectItem key={filter.value} value={filter.value}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 🏢 Filtro por workspace */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Espacio de Trabajo
                  </label>
                  <Select 
                    value={filters.workspace} 
                    onValueChange={(value) => setFilters(f => ({ ...f, workspace: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaceFilters.map(filter => (
                        <SelectItem key={filter.value} value={filter.value}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 📅 Fecha desde */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fecha Desde
                  </label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                  />
                </div>

                {/* 📅 Fecha hasta */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fecha Hasta
                  </label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                  />
                </div>
              </div>

              {/* 🔧 Botones de acción */}
              <div className="flex items-center gap-3 mt-6">
                <Button 
                  onClick={applyFilters} 
                  disabled={isFiltering}
                  className="flex items-center gap-2"
                >
                  {isFiltering ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Aplicar Filtros
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 📊 Lista de actividades */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Actividades del Sistema</CardTitle>
                <CardDescription>
                  {totalCount > 0 
                    ? `Mostrando ${activities.length} de ${totalCount.toLocaleString()} actividades`
                    : 'No hay actividades que mostrar'
                  }
                </CardDescription>
              </div>
              {filters.action && (
                <Badge variant="secondary">
                  Filtrado por: {actionFilters.find(f => f.value === filters.action)?.label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              activities={activities}
              loading={loading}
              error={error || undefined}
              showHeader={false}
              compact={false}
            />

            {/* 📄 Botón para cargar más */}
            {hasMore && !loading && (
              <div className="text-center mt-6">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  className="min-w-[200px]"
                >
                  Cargar Más Actividades
                </Button>
              </div>
            )}

            {/* 📊 Indicador de final */}
            {!hasMore && activities.length > 0 && (
              <div className="text-center mt-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Has visto todas las actividades disponibles
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default ActivityReportPage 