import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { workspaceService } from '../../services/workspaceService'
import { z } from 'zod'
import { LogMessages } from '../../utils/logger'

// 📋 Schema para filtros específicos de CAM
const camFiltersSchema = z.object({
  type: z.enum(['comercial', 'empresarial', 'registro', 'certificado', 'tramite']).optional(),
  priority: z.enum(['alta', 'media', 'baja']).optional(),
  status: z.enum(['draft', 'stored', 'archived']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
})

type CamFilters = z.infer<typeof camFiltersSchema>

// 🏢 Rutas específicas del workspace CAM
export async function camRoutes(fastify: FastifyInstance): Promise<void> {

  // 📋 GET /workspaces/cam/documents - Documentos específicos de CAM
  fastify.get('/documents', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get CAM workspace documents with commercial filters',
      tags: ['CAM Workspace'],
      querystring: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['comercial', 'empresarial', 'registro', 'certificado', 'tramite'],
            description: 'Type of commercial document'
          },
          priority: {
            type: 'string',
            enum: ['alta', 'media', 'baja'],
            description: 'Document priority level'
          },
          status: {
            type: 'string',
            enum: ['draft', 'stored', 'archived'],
            description: 'Document status'
          },
          dateFrom: {
            type: 'string',
            format: 'date',
            description: 'Filter from date'
          },
          dateTo: {
            type: 'string',
            format: 'date',
            description: 'Filter to date'
          },
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
                filters: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Querystring: CamFilters }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 🔐 Verificar acceso a CAM
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'cam')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to CAM workspace'
          })
        }

        // 📋 Validar filtros
        const validationResult = camFiltersSchema.safeParse(request.query)
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
          workspace: 'cam',
          status: filters.status,
          limit: filters.limit,
          offset: filters.offset,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }

        // 📅 Filtros de fecha
        if (filters.dateFrom) documentFilters.dateFrom = new Date(filters.dateFrom)
        if (filters.dateTo) documentFilters.dateTo = new Date(filters.dateTo)

        // 🏷️ Filtros por tags específicos de CAM
        if (filters.type || filters.priority) {
          const tags: string[] = []
          if (filters.type) tags.push(`tipo:${filters.type}`)
          if (filters.priority) tags.push(`prioridad:${filters.priority}`)
          documentFilters.tags = tags
        }

        // 📊 Obtener documentos
        const result = await documentService.getDocuments(documentFilters)

        return reply.status(200).send({
          success: true,
          message: `Found ${result.total} CAM documents`,
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
                types: ['comercial', 'empresarial', 'registro', 'certificado', 'tramite'],
                priorities: ['alta', 'media', 'baja'],
                statuses: ['draft', 'stored', 'archived']
              }
            }
          }
        })

      } catch (error: any) {
        console.error('❌ CAM documents error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve CAM documents'
        })
      }
    }
  })

  // 📊 GET /workspaces/cam/dashboard - Dashboard específico de CAM
  fastify.get('/dashboard', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get CAM workspace dashboard with commercial metrics',
      tags: ['CAM Workspace'],
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
                documentsByType: { type: 'object' },
                documentsByPriority: { type: 'object' },
                recentActivity: { type: 'array' },
                pendingTasks: { type: 'array' }
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
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'cam')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to CAM workspace'
          })
        }

        // 📊 Obtener estadísticas específicas de CAM
        const [
          workspaceStats,
          recentDocuments,
          pendingApprovals
        ] = await Promise.all([
          workspaceService.getWorkspaceStats('cam'),
          getRecentCamDocuments(),
          getPendingCamTasks()
        ])

        // 📈 Métricas específicas de CAM
        const dashboardData = {
          overview: {
            totalDocuments: workspaceStats.totalDocuments,
            totalUsers: workspaceStats.totalUsers,
            storageUsed: workspaceStats.storageUsed,
            documentsThisMonth: await getDocumentsThisMonth('cam'),
            pendingApprovals: pendingApprovals.length
          },
          documentsByType: await getDocumentsByType('cam'),
          documentsByPriority: await getDocumentsByPriority('cam'),
          recentActivity: workspaceStats.recentActivity.slice(0, 5),
          pendingTasks: pendingApprovals
        }

        return reply.status(200).send({
          success: true,
          message: 'CAM dashboard retrieved successfully',
          data: dashboardData
        })

      } catch (error: any) {
        console.error('❌ CAM dashboard error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve CAM dashboard'
        })
      }
    }
  })

  // 📈 GET /workspaces/cam/reports - Reportes específicos de CAM
  fastify.get('/reports', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get CAM workspace reports and analytics',
      tags: ['CAM Workspace'],
      querystring: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
            default: 'month'
          },
          format: {
            type: 'string',
            enum: ['json', 'csv'],
            default: 'json'
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
                period: { type: 'string' },
                summary: { type: 'object' },
                charts: { type: 'object' },
                tables: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: { period?: string, format?: string }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const { period = 'month', format = 'json' } = request.query

        // 🔐 Verificar acceso y permisos de reporte
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'cam')
        const permissions = await workspaceService.getUserWorkspacePermissions(user.id, 'cam')
        
        if (!hasAccess || !permissions.includes('view_stats')) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to view CAM reports'
          })
        }

        // 📈 Generar reporte
        const reportData = await generateCamReport(period)

        return reply.status(200).send({
          success: true,
          message: `CAM ${period} report generated successfully`,
          data: reportData
        })

      } catch (error: any) {
        console.error('❌ CAM reports error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to generate CAM reports'
        })
      }
    }
  })

  // 🎯 Log específico de CAM
  fastify.log.info(LogMessages.workspaceRoutes('CAM', [
    'GET /documents - Commercial documents with filters',
    'GET /dashboard - Commercial dashboard metrics', 
    'GET /reports - Commercial reports and analytics'
  ]))
}

// 🔧 Funciones auxiliares específicas de CAM

async function getRecentCamDocuments(): Promise<any[]> {
  // Implementación específica para documentos recientes de CAM
  return []
}

async function getPendingCamTasks(): Promise<any[]> {
  // Implementación específica para tareas pendientes de CAM
  return []
}

async function getDocumentsThisMonth(workspace: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  return await documentService.getDocuments({
    workspace: workspace as any,
    dateFrom: startOfMonth,
    limit: 1
  }).then(result => result.total)
}

async function getDocumentsByType(workspace: string): Promise<Record<string, number>> {
  // TODO: Implementar conteo por tipo usando tags
  return {
    comercial: 0,
    empresarial: 0,
    registro: 0,
    certificado: 0,
    tramite: 0
  }
}

async function getDocumentsByPriority(workspace: string): Promise<Record<string, number>> {
  // TODO: Implementar conteo por prioridad usando tags
  return {
    alta: 0,
    media: 0,
    baja: 0
  }
}

async function generateCamReport(period: string): Promise<any> {
  // TODO: Implementar generación de reportes específicos de CAM
  return {
    period,
    summary: {
      totalProcessed: 0,
      averageProcessingTime: '0 days',
      efficiency: '100%'
    },
    charts: {
      documentsOverTime: [],
      typeDistribution: [],
      priorityTrends: []
    },
    tables: []
  }
}
