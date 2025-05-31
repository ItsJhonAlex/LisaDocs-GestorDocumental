import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { dashboardRoute } from './dashboard'
import { auditRoute } from './audit'
import { settingsRoute } from './settings'

// 🏛️ Router principal de administración
export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  
  // 🔐 Middleware de verificación de rol de administrador para todas las rutas admin
  fastify.addHook('preHandler', async (request, reply) => {
    const user = (request as any).user
    
    // Verificar que el usuario esté autenticado
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
        details: 'User must be authenticated to access admin routes'
      })
    }
    
    // Verificar que el usuario sea administrador
    if (user.role !== 'administrador') {
      return reply.status(403).send({
        success: false,
        error: 'Access denied',
        details: 'Only administrators can access admin routes'
      })
    }
  })

  // 📊 Registrar rutas del dashboard
  await fastify.register(dashboardRoute)
  
  // 🔍 Registrar rutas de auditoría
  await fastify.register(auditRoute)
  
  // ⚙️ Registrar rutas de configuración
  await fastify.register(settingsRoute)

  // 🏠 GET /admin - Información general del panel de administración
  fastify.route({
    method: 'GET',
    url: '/admin',
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                version: { type: 'string' },
                modules: { type: 'array' },
                permissions: { type: 'array' },
                systemInfo: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request, reply) => {
      try {
        const user = (request as any).user

        // 📋 Información del panel de administración
        const adminInfo = {
          version: '1.0.0',
          modules: [
            {
              name: 'Dashboard',
              description: 'Panel principal con métricas y estadísticas del sistema',
              path: '/admin/dashboard',
              status: 'active'
            },
            {
              name: 'Audit',
              description: 'Logs de auditoría y seguimiento de actividades',
              path: '/admin/audit',
              status: 'active'
            },
            {
              name: 'Settings',
              description: 'Configuración del sistema y mantenimiento',
              path: '/admin/settings',
              status: 'active'
            }
          ],
          permissions: [
            'view_dashboard',
            'view_audit_logs',
            'manage_users',
            'system_configuration',
            'system_backup',
            'system_maintenance'
          ],
          systemInfo: {
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            uptime: Math.floor(process.uptime()),
            memoryUsage: {
              used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
              total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            }
          }
        }

        return reply.status(200).send({
          success: true,
          message: `Welcome to LisaDocs Admin Panel, ${user.fullName}`,
          data: adminInfo
        })

      } catch (error: any) {
        console.error('❌ Admin info error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve admin panel information'
        })
      }
    }
  })

  // 📈 GET /admin/quick-stats - Estadísticas rápidas para widgets
  fastify.route({
    method: 'GET',
    url: '/admin/quick-stats',
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                users: { type: 'object' },
                documents: { type: 'object' },
                storage: { type: 'object' },
                system: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request, reply) => {
      try {
        // 📊 Estadísticas rápidas para el panel
        const quickStats = await getQuickStats()

        return reply.status(200).send({
          success: true,
          message: 'Quick statistics retrieved successfully',
          data: quickStats
        })

      } catch (error: any) {
        console.error('❌ Quick stats error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve quick statistics'
        })
      }
    }
  })

  // 🔍 GET /admin/search - Búsqueda global en el panel de administración
  fastify.route({
    method: 'GET',
    url: '/admin/search',
    schema: {
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', minLength: 2, maxLength: 100 },
          type: { 
            type: 'string', 
            enum: ['users', 'documents', 'logs', 'all'],
            default: 'all'
          },
          limit: { type: 'string', default: '20' }
        },
        required: ['q']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                results: { type: 'object' },
                total: { type: 'number' },
                suggestions: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: { q: string; type?: string; limit?: string }
    }>, reply: FastifyReply) => {
      try {
        const { q, type = 'all', limit = '20' } = request.query

        // 🔍 Realizar búsqueda global
        const searchResults = await performAdminSearch(q, type, parseInt(limit))

        return reply.status(200).send({
          success: true,
          message: 'Search completed successfully',
          data: searchResults
        })

      } catch (error: any) {
        console.error('❌ Admin search error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to perform search'
        })
      }
    }
  })

  // 🚨 GET /admin/alerts - Alertas del sistema para administradores
  fastify.route({
    method: 'GET',
    url: '/admin/alerts',
    schema: {
      querystring: {
        type: 'object',
        properties: {
          severity: { 
            type: 'string', 
            enum: ['info', 'warning', 'error', 'critical'] 
          },
          unread: { type: 'string', enum: ['true', 'false'] },
          limit: { type: 'string', default: '50' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                alerts: { type: 'array' },
                unreadCount: { type: 'number' },
                criticalCount: { type: 'number' },
                summary: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: { severity?: string; unread?: string; limit?: string }
    }>, reply: FastifyReply) => {
      try {
        const filters = {
          severity: request.query.severity,
          unread: request.query.unread === 'true',
          limit: parseInt(request.query.limit || '50')
        }

        // 🚨 Obtener alertas del sistema
        const alertsData = await getSystemAlerts(filters)

        return reply.status(200).send({
          success: true,
          message: 'System alerts retrieved successfully',
          data: alertsData
        })

      } catch (error: any) {
        console.error('❌ System alerts error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve system alerts'
        })
      }
    }
  })
}

// 📊 Obtener estadísticas rápidas
async function getQuickStats() {
  // TODO: Implementar estadísticas reales desde servicios
  return {
    users: {
      total: 125,
      active: 98,
      new_today: 3,
      change_percentage: '+5.2%'
    },
    documents: {
      total: 2847,
      uploaded_today: 23,
      total_size: '15.7 GB',
      change_percentage: '+2.8%'
    },
    storage: {
      used: '45.2 GB',
      available: '54.8 GB',
      percentage: 45.2,
      status: 'healthy'
    },
    system: {
      uptime: '15 days, 3 hours',
      cpu_usage: 35.2,
      memory_usage: 62.8,
      status: 'healthy'
    }
  }
}

// 🔍 Realizar búsqueda global en el panel de administración
async function performAdminSearch(query: string, type: string, limit: number) {
  // TODO: Implementar búsqueda real en servicios
  const results = {
    users: type === 'all' || type === 'users' ? [
      {
        id: '1',
        type: 'user',
        title: 'Juan Pérez',
        description: 'Secretario CAM - juan.perez@example.com',
        url: '/admin/users/1'
      }
    ] : [],
    documents: type === 'all' || type === 'documents' ? [
      {
        id: '1',
        type: 'document',
        title: 'Informe Mensual CAM',
        description: 'Documento subido hace 2 días',
        url: '/admin/documents/1'
      }
    ] : [],
    logs: type === 'all' || type === 'logs' ? [
      {
        id: '1',
        type: 'log',
        title: 'Usuario creado: Juan Pérez',
        description: 'Hace 1 hora - Nivel: Info',
        url: '/admin/audit/logs?search=' + encodeURIComponent(query)
      }
    ] : []
  }

  const total = results.users.length + results.documents.length + results.logs.length

  return {
    query,
    results,
    total,
    suggestions: [
      'usuarios activos',
      'documentos recientes',
      'logs de error',
      'configuración sistema'
    ]
  }
}

// 🚨 Obtener alertas del sistema
async function getSystemAlerts(filters: any) {
  // TODO: Implementar alertas reales desde servicios
  const alerts = [
    {
      id: '1',
      type: 'warning',
      title: 'Almacenamiento 80% lleno',
      message: 'El almacenamiento está alcanzando su límite',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      action: 'Liberar espacio o ampliar almacenamiento'
    },
    {
      id: '2',
      type: 'info',
      title: 'Backup programado completado',
      message: 'El backup automático se completó exitosamente',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      action: null
    }
  ]

  const unreadCount = alerts.filter(alert => !alert.isRead).length
  const criticalCount = alerts.filter(alert => alert.type === 'critical').length

  return {
    alerts: alerts.slice(0, filters.limit),
    unreadCount,
    criticalCount,
    summary: {
      total: alerts.length,
      byType: {
        info: alerts.filter(a => a.type === 'info').length,
        warning: alerts.filter(a => a.type === 'warning').length,
        error: alerts.filter(a => a.type === 'error').length,
        critical: alerts.filter(a => a.type === 'critical').length
      }
    }
  }
}
