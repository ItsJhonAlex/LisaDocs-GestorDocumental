import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { workspaceService } from '../../services/workspaceService'
import { userService } from '../../services/userService'
import { auditService } from '../../services/auditService'
import { z } from 'zod'
import { LogMessages } from '../../utils/logger'

// 📋 Schema para filtros específicos de Presidencia
const presidenciaFiltersSchema = z.object({
  classification: z.enum(['confidencial', 'restringido', 'publico']).optional(),
  category: z.enum(['decreto', 'resolucion', 'directiva', 'memorandum', 'informe_ejecutivo', 'acuerdo']).optional(),
  priority: z.enum(['critica', 'alta', 'media', 'baja']).optional(),
  approvalStatus: z.enum(['pendiente', 'aprobado', 'rechazado', 'revision']).optional(),
  status: z.enum(['draft', 'stored', 'archived']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
})

type PresidenciaFilters = z.infer<typeof presidenciaFiltersSchema>

// 👑 Rutas específicas del workspace Presidencia
export async function presidenciaRoutes(fastify: FastifyInstance): Promise<void> {

  // 📋 GET /workspaces/presidencia/documents - Documentos ejecutivos
  fastify.get('/documents', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get Presidencia workspace documents with executive filters',
      tags: ['Presidencia Workspace'],
      querystring: {
        type: 'object',
        properties: {
          classification: {
            type: 'string',
            enum: ['confidencial', 'restringido', 'publico'],
            description: 'Document classification level'
          },
          category: {
            type: 'string',
            enum: ['decreto', 'resolucion', 'directiva', 'memorandum', 'informe_ejecutivo', 'acuerdo'],
            description: 'Type of executive document'
          },
          priority: {
            type: 'string',
            enum: ['critica', 'alta', 'media', 'baja'],
            description: 'Document priority level'
          },
          approvalStatus: {
            type: 'string',
            enum: ['pendiente', 'aprobado', 'rechazado', 'revision'],
            description: 'Document approval status'
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
                filters: { type: 'object' },
                summary: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Querystring: PresidenciaFilters }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 🔐 Verificar acceso a Presidencia
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'presidencia')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to Presidencia workspace'
          })
        }

        // 📋 Validar filtros
        const validationResult = presidenciaFiltersSchema.safeParse(request.query)
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
          workspace: 'presidencia',
          status: filters.status,
          limit: filters.limit,
          offset: filters.offset,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }

        // 📅 Filtros de fecha
        if (filters.dateFrom) documentFilters.dateFrom = new Date(filters.dateFrom)
        if (filters.dateTo) documentFilters.dateTo = new Date(filters.dateTo)

        // 🏷️ Filtros por tags específicos de Presidencia
        if (filters.classification || filters.category || filters.priority || filters.approvalStatus) {
          const tags: string[] = []
          if (filters.classification) tags.push(`clasificacion:${filters.classification}`)
          if (filters.category) tags.push(`categoria:${filters.category}`)
          if (filters.priority) tags.push(`prioridad:${filters.priority}`)
          if (filters.approvalStatus) tags.push(`aprobacion:${filters.approvalStatus}`)
          documentFilters.tags = tags
        }

        // 📊 Obtener documentos y resumen
        const [result, summary] = await Promise.all([
          documentService.getDocuments(documentFilters),
          getPresidenciaDocumentsSummary(filters)
        ])

        return reply.status(200).send({
          success: true,
          message: `Found ${result.total} Presidencia documents`,
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
                classifications: ['confidencial', 'restringido', 'publico'],
                categories: ['decreto', 'resolucion', 'directiva', 'memorandum', 'informe_ejecutivo', 'acuerdo'],
                priorities: ['critica', 'alta', 'media', 'baja'],
                approvalStatuses: ['pendiente', 'aprobado', 'rechazado', 'revision'],
                statuses: ['draft', 'stored', 'archived']
              }
            },
            summary
          }
        })

      } catch (error: any) {
        console.error('❌ Presidencia documents error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve Presidencia documents'
        })
      }
    }
  })

  // 📊 GET /workspaces/presidencia/dashboard - Dashboard ejecutivo
  fastify.get('/dashboard', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get Presidencia workspace executive dashboard',
      tags: ['Presidencia Workspace'],
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
                pendingApprovals: { type: 'array' },
                criticalMatters: { type: 'array' },
                workspaceActivity: { type: 'object' },
                systemWideStats: { type: 'object' }
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
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'presidencia')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to Presidencia workspace'
          })
        }

        // 📊 Obtener estadísticas ejecutivas
        const [
          workspaceStats,
          pendingApprovals,
          criticalMatters,
          systemWideStats
        ] = await Promise.all([
          workspaceService.getWorkspaceStats('presidencia'),
          getPendingApprovals(),
          getCriticalMatters(),
          getSystemWideStats(user.role)
        ])

        // 📈 Dashboard ejecutivo
        const dashboardData = {
          overview: {
            totalDocuments: workspaceStats.totalDocuments,
            totalUsers: workspaceStats.totalUsers,
            storageUsed: workspaceStats.storageUsed,
            pendingApprovals: pendingApprovals.length,
            criticalMatters: criticalMatters.length
          },
          pendingApprovals,
          criticalMatters,
          workspaceActivity: {
            documentsThisWeek: await getDocumentsThisWeek('presidencia'),
            documentsThisMonth: await getDocumentsThisMonth('presidencia'),
            recentActivity: workspaceStats.recentActivity.slice(0, 8)
          },
          systemWideStats
        }

        return reply.status(200).send({
          success: true,
          message: 'Presidencia executive dashboard retrieved successfully',
          data: dashboardData
        })

      } catch (error: any) {
        console.error('❌ Presidencia dashboard error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve Presidencia dashboard'
        })
      }
    }
  })

  // 🔍 GET /workspaces/presidencia/audit - Auditoría y supervisión
  fastify.get('/audit', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get audit logs and system oversight (executive access)',
      tags: ['Presidencia Workspace'],
      querystring: {
        type: 'object',
        properties: {
          workspace: {
            type: 'string',
            enum: ['all', 'cam', 'ampp', 'presidencia', 'intendencia', 'comisiones_cf'],
            default: 'all'
          },
          action: {
            type: 'string',
            enum: ['all', 'document_created', 'document_updated', 'user_login', 'permission_changed'],
            default: 'all'
          },
          period: {
            type: 'string',
            enum: ['today', 'week', 'month'],
            default: 'week'
          },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 }
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
                auditLogs: { type: 'array' },
                summary: { type: 'object' },
                alerts: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: {
        workspace?: string
        action?: string
        period?: string
        limit?: number
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const { workspace = 'all', action = 'all', period = 'week', limit = 50 } = request.query

        // 🔐 Verificar permisos de auditoría (solo presidente/vicepresidente)
        if (!['presidente', 'vicepresidente', 'administrador'].includes(user.role)) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'Only executives can access audit logs'
          })
        }

        // 🔍 Obtener logs de auditoría
        const [auditLogs, summary, alerts] = await Promise.all([
          getAuditLogs({ workspace, action, period, limit }),
          getAuditSummary(period),
          getSecurityAlerts()
        ])

        return reply.status(200).send({
          success: true,
          message: 'Audit logs retrieved successfully',
          data: {
            auditLogs,
            summary,
            alerts
          }
        })

      } catch (error: any) {
        console.error('❌ Presidencia audit error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve audit logs'
        })
      }
    }
  })

  // 📈 GET /workspaces/presidencia/reports - Reportes ejecutivos
  fastify.get('/reports', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get executive reports and system analytics',
      tags: ['Presidencia Workspace'],
      querystring: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['executive-summary', 'workspace-comparison', 'user-activity', 'document-flow'],
            default: 'executive-summary'
          },
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
            default: 'month'
          },
          includeAll: {
            type: 'boolean',
            default: true,
            description: 'Include all workspaces in report'
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
                reportType: { type: 'string' },
                period: { type: 'string' },
                generatedAt: { type: 'string' },
                executive: { type: 'object' },
                workspaces: { type: 'array' },
                metrics: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: {
        type?: string
        period?: string
        includeAll?: boolean
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const { type = 'executive-summary', period = 'month', includeAll = true } = request.query

        // 🔐 Verificar permisos ejecutivos
        if (!['presidente', 'vicepresidente', 'administrador'].includes(user.role)) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'Only executives can access executive reports'
          })
        }

        // 📈 Generar reporte ejecutivo
        const reportData = await generateExecutiveReport(type, period, includeAll)

        return reply.status(200).send({
          success: true,
          message: `Executive ${type} report for ${period} generated successfully`,
          data: reportData
        })

      } catch (error: any) {
        console.error('❌ Presidencia reports error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to generate executive reports'
        })
      }
    }
  })

  // 🎯 Log específico de Presidencia
  fastify.log.info(LogMessages.workspaceRoutes('Presidencia', [
    'GET /documents - Executive documents with high-level filters',
    'GET /dashboard - Executive dashboard with system oversight',
    'GET /audit - System audit logs and security oversight',
    'GET /reports - Executive reports and analytics'
  ]))
}

// 🔧 Funciones auxiliares específicas de Presidencia

async function getPresidenciaDocumentsSummary(filters: any): Promise<any> {
  return {
    totalDocuments: 0,
    byClassification: {
      confidencial: 0,
      restringido: 0,
      publico: 0
    },
    byPriority: {
      critica: 0,
      alta: 0,
      media: 0,
      baja: 0
    },
    pendingApprovals: 0
  }
}

async function getPendingApprovals(): Promise<any[]> {
  // TODO: Implementar filtro por documentos pendientes de aprobación usando tags
  return []
}

async function getCriticalMatters(): Promise<any[]> {
  // TODO: Implementar filtro por asuntos críticos usando tags prioridad:critica
  return []
}

async function getSystemWideStats(userRole: string): Promise<any> {
  if (!['presidente', 'vicepresidente', 'administrador'].includes(userRole)) {
    return null
  }

  // 📊 Estadísticas generales del sistema para ejecutivos
  const allWorkspaces = ['cam', 'ampp', 'presidencia', 'intendencia', 'comisiones_cf']
  const stats: any = {}

  for (const workspace of allWorkspaces) {
    try {
      const workspaceStats = await workspaceService.getWorkspaceStats(workspace as any)
      stats[workspace] = {
        documents: workspaceStats.totalDocuments,
        users: workspaceStats.totalUsers,
        storage: workspaceStats.storageUsed
      }
    } catch (error) {
      stats[workspace] = { documents: 0, users: 0, storage: '0 Bytes' }
    }
  }

  return stats
}

async function getDocumentsThisWeek(workspace: string): Promise<number> {
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  return await documentService.getDocuments({
    workspace: workspace as any,
    dateFrom: startOfWeek,
    limit: 1
  }).then(result => result.total)
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

async function getAuditLogs(filters: any): Promise<any[]> {
  // TODO: Implementar obtención de logs de auditoría desde DocumentActivity
  return []
}

async function getAuditSummary(period: string): Promise<any> {
  // TODO: Implementar resumen de auditoría
  return {
    period,
    totalActions: 0,
    userLogins: 0,
    documentsCreated: 0,
    documentsModified: 0,
    securityEvents: 0
  }
}

async function getSecurityAlerts(): Promise<any[]> {
  // TODO: Implementar alertas de seguridad
  return []
}

async function generateExecutiveReport(type: string, period: string, includeAll: boolean): Promise<any> {
  // TODO: Implementar generación de reportes ejecutivos completos
  return {
    reportType: type,
    period,
    generatedAt: new Date().toISOString(),
    generatedBy: 'System',
    executive: {
      summary: 'System operating normally',
      highlights: [],
      concerns: []
    },
    workspaces: [],
    metrics: {
      totalDocuments: 0,
      totalUsers: 0,
      systemHealth: '100%',
      efficiency: 'High'
    }
  }
}
