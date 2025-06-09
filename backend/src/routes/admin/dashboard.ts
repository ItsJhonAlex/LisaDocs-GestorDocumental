import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { userService } from '../../services/userService'
import { documentService } from '../../services/documentService'
import { workspaceService } from '../../services/workspaceService'
import { permissionService } from '../../services/permissionService'
import { WorkspaceType } from '../../generated/prisma'

// 📊 Ruta del dashboard administrativo
export async function dashboardRoute(fastify: FastifyInstance): Promise<void> {
  
  // 📊 GET /admin/dashboard - Dashboard principal con métricas del sistema
  fastify.route({
    method: 'GET',
    url: '/admin/dashboard',
    preHandler: fastify.authenticate,
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
                systemOverview: {
                  type: 'object',
                  properties: {
                    totalUsers: { type: 'number' },
                    activeUsers: { type: 'number' },
                    totalDocuments: { type: 'number' },
                    totalStorage: { type: 'string' },
                    systemHealth: { type: 'string' }
                  }
                },
                userStats: { type: 'object' },
                documentStats: { type: 'object' },
                workspaceStats: { type: 'array' },
                recentActivity: { type: 'array' },
                alerts: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // 🔐 Verificar que es administrador
        const user = (request as any).user
        if (user.role !== 'administrador') {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'Only administrators can access the dashboard'
          })
        }

        // 📊 Obtener estadísticas del sistema
        const [
          userStats,
          documentStats,
          workspacesInfo
        ] = await Promise.all([
          userService.getUserStats(),
          documentService.getDocumentStats(),
          workspaceService.getAllWorkspacesInfo(user.id)
        ])

        // 🏢 Estadísticas por workspace
        const workspaceStats = await Promise.all(
          Object.values(WorkspaceType).map(async (workspace) => {
            const stats = await workspaceService.getWorkspaceStats(workspace)
            const definition = getWorkspaceDefinition(workspace)
            
            return {
              id: workspace,
              name: definition.name,
              description: definition.description,
              totalDocuments: stats.totalDocuments,
              totalUsers: stats.totalUsers,
              storageUsed: stats.storageUsed,
              documentsByStatus: stats.documentsByStatus,
              recentActivity: stats.recentActivity.slice(0, 3)
            }
          })
        )

        // 🚨 Generar alertas del sistema
        const alerts = await generateSystemAlerts(userStats, documentStats)

        // 🔄 Actividad reciente del sistema
        const recentActivity = await getRecentSystemActivity()

        // 📋 Resumen ejecutivo
        const systemOverview = {
          totalUsers: userStats.total,
          activeUsers: userStats.active,
          totalDocuments: documentStats.total,
          totalStorage: documentStats.totalSize,
          systemHealth: calculateSystemHealth(userStats, documentStats)
        }

        return reply.status(200).send({
          success: true,
          message: 'Dashboard data retrieved successfully',
          data: {
            systemOverview,
            userStats: {
              total: userStats.total,
              active: userStats.active,
              byRole: userStats.byRole,
              byWorkspace: userStats.byWorkspace,
              recent: userStats.recent
            },
            documentStats: {
              total: documentStats.total,
              byStatus: documentStats.byStatus,
              byWorkspace: documentStats.byWorkspace,
              totalSize: documentStats.totalSize
            },
            workspaceStats,
            recentActivity,
            alerts
          }
        })

      } catch (error: any) {
        console.error('❌ Admin dashboard error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve dashboard data'
        })
      }
    }
  })

  // 📈 GET /admin/dashboard/metrics - Métricas en tiempo real
  fastify.route({
    method: 'GET',
    url: '/admin/dashboard/metrics',
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          period: { 
            type: 'string', 
            enum: ['1h', '24h', '7d', '30d'],
            default: '24h'
          }
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
                userActivity: { type: 'array' },
                documentActivity: { type: 'array' },
                systemLoad: { type: 'object' },
                errorRates: { type: 'array' },
                performanceMetrics: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: { period?: string }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        if (user.role !== 'administrador') {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'Only administrators can access metrics'
          })
        }

        const period = request.query.period || '24h'
        
        // 📊 Obtener métricas según el periodo
        const metrics = await getSystemMetrics(period)

        return reply.status(200).send({
          success: true,
          message: `Metrics for ${period} period retrieved successfully`,
          data: metrics
        })

      } catch (error: any) {
        console.error('❌ Admin metrics error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve metrics'
        })
      }
    }
  })

  // 🔧 GET /admin/dashboard/system-info - Información del sistema
  fastify.route({
    method: 'GET',
    url: '/admin/dashboard/system-info',
    preHandler: fastify.authenticate,
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
                server: { type: 'object' },
                database: { type: 'object' },
                storage: { type: 'object' },
                version: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        if (user.role !== 'administrador') {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'Only administrators can access system info'
          })
        }

        const systemInfo = await getSystemInfo()

        return reply.status(200).send({
          success: true,
          message: 'System information retrieved successfully',
          data: systemInfo
        })

      } catch (error: any) {
        console.error('❌ System info error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve system information'
        })
      }
    }
  })
}

// 🏢 Obtener definición de workspace
function getWorkspaceDefinition(workspace: WorkspaceType) {
  const definitions = {
    cam: {
      name: 'CAM',
      description: 'Cámara de Comercio - Gestión de documentos comerciales'
    },
    ampp: {
      name: 'AMPP',
      description: 'Asociación de Municipalidades - Documentos municipales'
    },
    presidencia: {
      name: 'Presidencia',
      description: 'Presidencia - Documentos ejecutivos y de alta dirección'
    },
    intendencia: {
      name: 'Intendencia',
      description: 'Intendencia - Gestión territorial y administrativa'
    },
    comisiones_cf: {
      name: 'Comisiones CF',
      description: 'Comisiones de Fiscalización - Control y supervisión'
    }
  }
  
  return definitions[workspace] || { name: workspace, description: 'Workspace description' }
}

// 🚨 Generar alertas del sistema
async function generateSystemAlerts(userStats: any, documentStats: any) {
  const alerts = []

  // Alertas de usuarios
  if (userStats.active < userStats.total * 0.8) {
    alerts.push({
      type: 'warning',
      title: 'Baja actividad de usuarios',
      message: `Solo ${userStats.active} de ${userStats.total} usuarios están activos`,
      action: 'Revisar usuarios inactivos'
    })
  }

  // Alertas de almacenamiento (simulado)
  const storageGB = parseFloat(documentStats.totalSize.replace(/[^\d.]/g, ''))
  if (storageGB > 80) {
    alerts.push({
      type: 'error',
      title: 'Almacenamiento casi lleno',
      message: `Uso de almacenamiento: ${documentStats.totalSize}`,
      action: 'Liberar espacio o ampliar almacenamiento'
    })
  }

  // Alertas de documentos pendientes
  const draftDocuments = documentStats.byStatus?.draft || 0
  if (draftDocuments > 50) {
    alerts.push({
      type: 'info',
      title: 'Muchos documentos en borrador',
      message: `${draftDocuments} documentos pendientes de revisión`,
      action: 'Revisar documentos en borrador'
    })
  }

  return alerts
}

// 📊 Obtener métricas del sistema
async function getSystemMetrics(period: string) {
  // TODO: Implementar métricas reales desde la base de datos
  // Por ahora retornamos datos simulados
  
  const now = new Date()
  const dataPoints = getDataPointsForPeriod(period)
  
  return {
    userActivity: generateActivityData(dataPoints, 'users'),
    documentActivity: generateActivityData(dataPoints, 'documents'),
    systemLoad: {
      cpu: 45.2,
      memory: 62.8,
      disk: 33.1,
      network: 12.4
    },
    errorRates: generateErrorData(dataPoints),
    performanceMetrics: {
      avgResponseTime: 125,
      requestsPerSecond: 42,
      errorRate: 0.3,
      uptime: 99.9
    }
  }
}

// 🔄 Obtener actividad reciente del sistema
async function getRecentSystemActivity() {
  // TODO: Implementar actividad real desde la base de datos
  return [
    {
      id: '1',
      type: 'user_created',
      description: 'Nuevo usuario registrado: Ana García',
      user: 'Administrador',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      type: 'document_uploaded',
      description: 'Documento subido: Informe Mensual CAM',
      user: 'Juan Pérez',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'system_backup',
      description: 'Backup automático completado',
      user: 'Sistema',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }
  ]
}

// 🔧 Obtener información del sistema
async function getSystemInfo() {
  return {
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    },
    database: {
      status: 'connected',
      version: 'PostgreSQL 15.x',
      connections: 12,
      maxConnections: 100
    },
    storage: {
      provider: 'MinIO',
      status: 'connected',
      totalBuckets: 5,
      totalObjects: 'N/A'
    },
    version: {
      api: '1.0.0',
      build: process.env.BUILD_VERSION || 'development',
      deployedAt: process.env.DEPLOY_DATE || new Date().toISOString()
    }
  }
}

// 📈 Calcular salud del sistema
function calculateSystemHealth(userStats: any, documentStats: any): string {
  const activeUserRatio = userStats.active / userStats.total
  
  if (activeUserRatio > 0.9) return 'excellent'
  if (activeUserRatio > 0.7) return 'good'
  if (activeUserRatio > 0.5) return 'fair'
  return 'poor'
}

// 📊 Generar datos de actividad
function generateActivityData(dataPoints: number, type: string) {
  return Array.from({ length: dataPoints }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    value: Math.floor(Math.random() * 100) + (type === 'users' ? 20 : 50)
  }))
}

// ❌ Generar datos de errores
function generateErrorData(dataPoints: number) {
  return Array.from({ length: dataPoints }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    errors: Math.floor(Math.random() * 5)
  }))
}

// 📅 Obtener puntos de datos según periodo
function getDataPointsForPeriod(period: string): number {
  switch (period) {
    case '1h': return 12  // Cada 5 minutos
    case '24h': return 24 // Cada hora
    case '7d': return 7   // Cada día
    case '30d': return 30 // Cada día
    default: return 24
  }
}
