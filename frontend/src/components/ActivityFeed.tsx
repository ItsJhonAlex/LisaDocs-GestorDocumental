import React, { useState, useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, User, FileText, Download, Upload, Archive, Trash2, Eye, Edit3, Plus } from 'lucide-react'

// 📊 Tipos para la actividad
interface ActivityUser {
  id: string
  fullName: string
  role: string
}

interface ActivityDocument {
  id: string
  title: string
  fileName: string
  workspace: string
}

interface ActivityItem {
  id: string
  action: string
  createdAt: string
  description: string
  user: ActivityUser
  document: ActivityDocument
}

interface ActivityFeedProps {
  activities?: ActivityItem[]
  loading?: boolean
  error?: string
  compact?: boolean
  showHeader?: boolean
  limit?: number
}

// 📋 Mapeo de acciones a iconos y colores
const actionConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  uploaded: { 
    icon: <Upload className="w-4 h-4" />, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100' 
  },
  downloaded: { 
    icon: <Download className="w-4 h-4" />, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100' 
  },
  deleted: { 
    icon: <Trash2 className="w-4 h-4" />, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100' 
  },
  archived: { 
    icon: <Archive className="w-4 h-4" />, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100' 
  },
  status_changed: { 
    icon: <Edit3 className="w-4 h-4" />, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100' 
  },
  viewed: { 
    icon: <Eye className="w-4 h-4" />, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100' 
  },
  updated: { 
    icon: <Edit3 className="w-4 h-4" />, 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-100' 
  },
  created: { 
    icon: <Plus className="w-4 h-4" />, 
    color: 'text-teal-600', 
    bgColor: 'bg-teal-100' 
  }
}

// 🎨 Componente principal de la actividad
export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities = [],
  loading = false,
  error,
  compact = false,
  showHeader = true,
  limit
}) => {
  // 📊 Estados locales
  const [displayedActivities, setDisplayedActivities] = useState<ActivityItem[]>([])

  // 🔄 Efecto para actualizar actividades mostradas
  useEffect(() => {
    const sorted = [...activities].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    const limited = limit ? sorted.slice(0, limit) : sorted
    setDisplayedActivities(limited)
  }, [activities, limit])

  // 🎯 Renderizar estado de carga
  if (loading) {
    return (
      <div className="space-y-3">
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ❌ Renderizar estado de error
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">❌ Error</div>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    )
  }

  // 📊 Renderizar actividades vacías
  if (displayedActivities.length === 0) {
    return (
      <div className="text-center py-8">
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}
        <div className="text-gray-400 mb-2">📊</div>
        <p className="text-gray-600 text-sm">No hay actividad reciente</p>
      </div>
    )
  }

  // 🎨 Renderizar feed de actividad
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {displayedActivities.length} actividades
          </span>
        </div>
      )}

      <div className="space-y-3">
        {displayedActivities.map((activity, index) => {
          const config = actionConfig[activity.action] || actionConfig.updated
          const isToday = new Date(activity.createdAt).toDateString() === new Date().toDateString()

          return (
            <div
              key={activity.id}
              className={`flex gap-3 p-3 rounded-lg transition-all duration-200 hover:shadow-sm ${
                index === 0 ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* 🎯 Icono de la acción */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                <div className={config.color}>
                  {config.icon}
                </div>
              </div>

              {/* 📋 Contenido de la actividad */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 📝 Descripción principal */}
                    <p className="text-sm text-gray-900 leading-relaxed">
                      <span className="font-medium text-blue-600">
                        {activity.user.fullName}
                      </span>
                      {' '}
                      <span className="text-gray-700">
                        {activity.description}
                      </span>
                    </p>

                    {/* 📄 Información del documento */}
                    {!compact && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <FileText className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">
                          {activity.document.fileName}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs">
                          {activity.document.workspace}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 🕒 Timestamp */}
                  <div className="flex-shrink-0 ml-3 text-right">
                    <div className="text-xs text-gray-500">
                      {isToday ? (
                        <>
                          <div className="text-green-600 font-medium">Hoy</div>
                          <div>{format(new Date(activity.createdAt), 'HH:mm', { locale: es })}</div>
                        </>
                      ) : (
                        <>
                          <div>{format(new Date(activity.createdAt), 'dd/MM', { locale: es })}</div>
                          <div>{format(new Date(activity.createdAt), 'HH:mm', { locale: es })}</div>
                        </>
                      )}
                    </div>
                    {!compact && (
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 👤 Información del usuario (solo en modo completo) */}
                {!compact && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <User className="w-3 h-3" />
                    <span>{activity.user.role}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 📊 Indicador si hay más actividades */}
      {limit && activities.length > limit && (
        <div className="text-center py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            Mostrando {limit} de {activities.length} actividades
          </span>
        </div>
      )}
    </div>
  )
}

export default ActivityFeed 