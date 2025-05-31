import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { workspaceService } from '../../services/workspaceService'
import { z } from 'zod'

// 📋 Schema para filtros específicos de Intendencia
const intendenciaFiltersSchema = z.object({
  territory: z.enum(['urbano', 'rural', 'mixto']).optional(),
  category: z.enum(['planificacion', 'obras', 'permisos', 'fiscalizacion', 'emergencia']).optional(),
  priority: z.enum(['emergencia', 'alta', 'media', 'baja']).optional(),
  department: z.string().optional(),
  status: z.enum(['draft', 'stored', 'archived']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
})

type IntendenciaFilters = z.infer<typeof intendenciaFiltersSchema>

// 🏛️ Rutas específicas del workspace Intendencia
export async function intendenciaRoutes(fastify: FastifyInstance): Promise<void> {

  // 📋 GET /workspaces/intendencia/documents - Documentos territoriales
  fastify.route({
    method: 'GET',
    url: '/documents',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get Intendencia workspace documents with territorial filters',
      tags: ['Intendencia Workspace'],
      querystring: {
        type: 'object',
        properties: {
          territory: {
            type: 'string',
            enum: ['urbano', 'rural', 'mixto'],
            description: 'Territory type'
          },
          category: {
            type: 'string',
            enum: ['planificacion', 'obras', 'permisos', 'fiscalizacion', 'emergencia'],
            description: 'Document category'
          },
          priority: {
            type: 'string',
            enum: ['emergencia', 'alta', 'media', 'baja'],
            description: 'Document priority'
          },
          department: {
            type: 'string',
            description: 'Department or division'
          },
          status: {
            type: 'string',
            enum: ['draft', 'stored', 'archived'],
            description: 'Document status'
          },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 }
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
                documents: { type: 'array' },
                pagination: { type: 'object' },
                filters: { type: 'object' },
                territorialStats: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Querystring: IntendenciaFilters }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 🔐 Verificar acceso a Intendencia
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'intendencia')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to Intendencia workspace'
          })
        }

        // 📋 Validar y procesar filtros
        const validationResult = intendenciaFiltersSchema.safeParse(request.query)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid filters',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const filters = validationResult.data

        // 🔍 Construir filtros para documentService
        const documentFilters: any = {
          workspace: 'intendencia',
          status: filters.status,
          limit: filters.limit,
          offset: filters.offset,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }

        // 📅 Filtros de fecha
        if (filters.dateFrom) documentFilters.dateFrom = new Date(filters.dateFrom)
        if (filters.dateTo) documentFilters.dateTo = new Date(filters.dateTo)

        // 🏷️ Filtros por tags específicos de Intendencia
        if (filters.territory || filters.category || filters.priority || filters.department) {
          const tags: string[] = []
          if (filters.territory) tags.push(`territorio:${filters.territory}`)
          if (filters.category) tags.push(`categoria:${filters.category}`)
          if (filters.priority) tags.push(`prioridad:${filters.priority}`)
          if (filters.department) tags.push(`departamento:${filters.department}`)
          documentFilters.tags = tags
        }

        // 📊 Obtener documentos y estadísticas territoriales
        const [result, territorialStats] = await Promise.all([
          documentService.getDocuments(documentFilters),
          getTerritorialStats()
        ])

        return reply.status(200).send({
          success: true,
          message: `Found ${result.total} Intendencia documents`,
          data: {
            documents: result.documents,
            pagination: {
              total: result.total,
              limit: filters.limit || 20,
              offset: filters.offset || 0,
              hasMore: result.hasMore
            },
            filters: {
              applied: filters,
              available: {
                territories: ['urbano', 'rural', 'mixto'],
                categories: ['planificacion', 'obras', 'permisos', 'fiscalizacion', 'emergencia'],
                priorities: ['emergencia', 'alta', 'media', 'baja'],
                departments: await getAvailableDepartments(),
                statuses: ['draft', 'stored', 'archived']
              }
            },
            territorialStats
          }
        })

      } catch (error: any) {
        console.error('❌ Intendencia documents error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve Intendencia documents'
        })
      }
    }
  })

  // 🗺️ GET /workspaces/intendencia/territories - Gestión territorial
  fastify.route({
    method: 'GET',
    url: '/territories',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get territorial management information',
      tags: ['Intendencia Workspace'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                territories: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      documentsCount: { type: 'number' },
                      activeProjects: { type: 'number' },
                      coverage: { type: 'string' }
                    }
                  }
                },
                projects: { type: 'array' },
                emergencies: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 🔐 Verificar acceso
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'intendencia')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to Intendencia workspace'
          })
        }

        // 🗺️ Obtener información territorial
        const [territories, activeProjects, emergencies] = await Promise.all([
          getTerritorialBreakdown(),
          getActiveProjects(),
          getActiveEmergencies()
        ])

        return reply.status(200).send({
          success: true,
          message: 'Territorial information retrieved successfully',
          data: {
            territories,
            projects: activeProjects,
            emergencies
          }
        })

      } catch (error: any) {
        console.error('❌ Intendencia territories error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve territorial information'
        })
      }
    }
  })

  // 📊 GET /workspaces/intendencia/dashboard - Dashboard territorial
  fastify.route({
    method: 'GET',
    url: '/dashboard',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get Intendencia workspace territorial dashboard',
      tags: ['Intendencia Workspace'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                overview: { type: 'object' },
                territorialDistribution: { type: 'object' },
                activeProjects: { type: 'array' },
                emergencyAlerts: { type: 'array' },
                performance: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 🔐 Verificar acceso
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'intendencia')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to Intendencia workspace'
          })
        }

        // 📊 Obtener métricas territoriales
        const [
          workspaceStats,
          territorialDistribution,
          activeProjects,
          emergencyAlerts,
          performance
        ] = await Promise.all([
          workspaceService.getWorkspaceStats('intendencia'),
          getTerritorialDistribution(),
          getActiveProjects(),
          getEmergencyAlerts(),
          getIntendenciaPerformance()
        ])

        const dashboardData = {
          overview: {
            totalDocuments: workspaceStats.totalDocuments,
            totalUsers: workspaceStats.totalUsers,
            storageUsed: workspaceStats.storageUsed,
            activeProjects: activeProjects.length,
            emergencyAlerts: emergencyAlerts.length
          },
          territorialDistribution,
          activeProjects: activeProjects.slice(0, 5),
          emergencyAlerts,
          performance
        }

        return reply.status(200).send({
          success: true,
          message: 'Intendencia territorial dashboard retrieved successfully',
          data: dashboardData
        })

      } catch (error: any) {
        console.error('❌ Intendencia dashboard error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve Intendencia dashboard'
        })
      }
    }
  })

  // 🎯 Log específico de Intendencia
  fastify.log.info({
    workspace: 'Intendencia',
    routes: [
      'GET /documents - Territorial documents with filters',
      'GET /territories - Territorial management info',
      'GET /dashboard - Territorial dashboard metrics'
    ]
  }, '🏛️ Intendencia workspace routes registered')
}

// 🔧 Funciones auxiliares específicas de Intendencia

async function getTerritorialStats(): Promise<any> {
  return {
    totalArea: '1,250 km²',
    urbanCoverage: '45%',
    ruralCoverage: '55%',
    populationDensity: '1,200 hab/km²'
  }
}

async function getAvailableDepartments(): Promise<string[]> {
  return [
    'Planificación Urbana',
    'Obras Públicas', 
    'Medio Ambiente',
    'Desarrollo Rural',
    'Emergencias'
  ]
}

async function getTerritorialBreakdown(): Promise<any[]> {
  return [
    {
      type: 'urbano',
      documentsCount: 150,
      activeProjects: 12,
      coverage: '45%'
    },
    {
      type: 'rural',
      documentsCount: 98,
      activeProjects: 8,
      coverage: '55%'
    },
    {
      type: 'mixto',
      documentsCount: 23,
      activeProjects: 3,
      coverage: '5%'
    }
  ]
}

async function getActiveProjects(): Promise<any[]> {
  // TODO: Implementar obtención de proyectos activos
  return []
}

async function getActiveEmergencies(): Promise<any[]> {
  // TODO: Implementar obtención de emergencias activas
  return []
}

async function getTerritorialDistribution(): Promise<Record<string, number>> {
  return {
    urbano: 60,
    rural: 35,
    mixto: 5
  }
}

async function getEmergencyAlerts(): Promise<any[]> {
  // TODO: Implementar alertas de emergencia
  return []
}

async function getIntendenciaPerformance(): Promise<any> {
  return {
    projectsCompleted: 85,
    averageResponseTime: '2.3 days',
    citizenSatisfaction: '87%',
    territorialCoverage: '100%'
  }
}
