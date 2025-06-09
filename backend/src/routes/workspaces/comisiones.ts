import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { workspaceService } from '../../services/workspaceService'
import { z } from 'zod'
import { LogMessages } from '../../utils/logger'

// 📋 Schema para filtros específicos de Comisiones CF
const comisionesFiltersSchema = z.object({
  commission: z.enum(['fiscalizacion', 'auditoria', 'control', 'supervision', 'investigacion']).optional(),
  scope: z.enum(['municipal', 'regional', 'nacional']).optional(),
  severity: z.enum(['critico', 'alto', 'medio', 'bajo']).optional(),
  investigationStatus: z.enum(['abierta', 'en_proceso', 'cerrada', 'suspendida']).optional(),
  status: z.enum(['draft', 'stored', 'archived']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
})

type ComisionesFilters = z.infer<typeof comisionesFiltersSchema>

// 🔍 Rutas específicas del workspace Comisiones CF
export async function comisionesRoutes(fastify: FastifyInstance): Promise<void> {

  // 📋 GET /workspaces/comisiones-cf/documents - Documentos de fiscalización
  fastify.get('/documents', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get Comisiones CF workspace documents with oversight filters',
      tags: ['Comisiones CF Workspace'],
      querystring: {
        type: 'object',
        properties: {
          commission: {
            type: 'string',
            enum: ['fiscalizacion', 'auditoria', 'control', 'supervision', 'investigacion'],
            description: 'Type of commission'
          },
          scope: {
            type: 'string',
            enum: ['municipal', 'regional', 'nacional'],
            description: 'Investigation scope'
          },
          severity: {
            type: 'string',
            enum: ['critico', 'alto', 'medio', 'bajo'],
            description: 'Severity level'
          },
          investigationStatus: {
            type: 'string',
            enum: ['abierta', 'en_proceso', 'cerrada', 'suspendida'],
            description: 'Investigation status'
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
                oversightSummary: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Querystring: ComisionesFilters }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 🔐 Verificar acceso a Comisiones CF
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'comisiones_cf')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to Comisiones CF workspace'
          })
        }

        // 📋 Validar filtros
        const validationResult = comisionesFiltersSchema.safeParse(request.query)
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
          workspace: 'comisiones_cf',
          status: filters.status,
          limit: filters.limit,
          offset: filters.offset,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }

        // 📅 Filtros de fecha
        if (filters.dateFrom) documentFilters.dateFrom = new Date(filters.dateFrom)
        if (filters.dateTo) documentFilters.dateTo = new Date(filters.dateTo)

        // 🏷️ Filtros por tags específicos de Comisiones CF
        if (filters.commission || filters.scope || filters.severity || filters.investigationStatus) {
          const tags: string[] = []
          if (filters.commission) tags.push(`comision:${filters.commission}`)
          if (filters.scope) tags.push(`alcance:${filters.scope}`)
          if (filters.severity) tags.push(`severidad:${filters.severity}`)
          if (filters.investigationStatus) tags.push(`investigacion:${filters.investigationStatus}`)
          documentFilters.tags = tags
        }

        // 📊 Obtener documentos y resumen de supervisión
        const [result, oversightSummary] = await Promise.all([
          documentService.getDocuments(documentFilters),
          getOversightSummary()
        ])

        return reply.status(200).send({
          success: true,
          message: `Found ${result.total} Comisiones CF documents`,
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
                commissions: ['fiscalizacion', 'auditoria', 'control', 'supervision', 'investigacion'],
                scopes: ['municipal', 'regional', 'nacional'],
                severities: ['critico', 'alto', 'medio', 'bajo'],
                investigationStatuses: ['abierta', 'en_proceso', 'cerrada', 'suspendida'],
                statuses: ['draft', 'stored', 'archived']
              }
            },
            oversightSummary
          }
        })

      } catch (error: any) {
        console.error('❌ Comisiones CF documents error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve Comisiones CF documents'
        })
      }
    }
  })

  // 🔍 GET /workspaces/comisiones-cf/investigations - Investigaciones activas
  fastify.get('/investigations', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get active investigations and oversight activities',
      tags: ['Comisiones CF Workspace'],
      querystring: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['abierta', 'en_proceso', 'cerrada', 'suspendida'],
            default: 'abierta'
          },
          priority: {
            type: 'string',
            enum: ['critico', 'alto', 'medio', 'bajo']
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
                investigations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      status: { type: 'string' },
                      severity: { type: 'string' },
                      startDate: { type: 'string' },
                      deadline: { type: 'string' },
                      progress: { type: 'number' }
                    }
                  }
                },
                summary: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: { status?: string, priority?: string }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const { status = 'abierta', priority } = request.query

        // 🔐 Verificar acceso
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'comisiones_cf')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to Comisiones CF workspace'
          })
        }

        // 🔍 Obtener investigaciones
        const [investigations, summary] = await Promise.all([
          getActiveInvestigations(status, priority),
          getInvestigationsSummary()
        ])

        return reply.status(200).send({
          success: true,
          message: 'Active investigations retrieved successfully',
          data: {
            investigations,
            summary
          }
        })

      } catch (error: any) {
        console.error('❌ Comisiones CF investigations error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve investigations'
        })
      }
    }
  })

  // 📊 GET /workspaces/comisiones-cf/dashboard - Dashboard de control
  fastify.get('/dashboard', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get Comisiones CF oversight dashboard',
      tags: ['Comisiones CF Workspace'],
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
                activeInvestigations: { type: 'array' },
                criticalFindings: { type: 'array' },
                complianceMetrics: { type: 'object' },
                recentActivity: { type: 'array' }
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
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'comisiones_cf')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to Comisiones CF workspace'
          })
        }

        // 📊 Obtener métricas de control
        const [
          workspaceStats,
          activeInvestigations,
          criticalFindings,
          complianceMetrics
        ] = await Promise.all([
          workspaceService.getWorkspaceStats('comisiones_cf'),
          getActiveInvestigations('abierta'),
          getCriticalFindings(),
          getComplianceMetrics()
        ])

        const dashboardData = {
          overview: {
            totalDocuments: workspaceStats.totalDocuments,
            totalUsers: workspaceStats.totalUsers,
            storageUsed: workspaceStats.storageUsed,
            activeInvestigations: activeInvestigations.length,
            criticalFindings: criticalFindings.length
          },
          activeInvestigations: activeInvestigations.slice(0, 5),
          criticalFindings,
          complianceMetrics,
          recentActivity: workspaceStats.recentActivity.slice(0, 8)
        }

        return reply.status(200).send({
          success: true,
          message: 'Comisiones CF oversight dashboard retrieved successfully',
          data: dashboardData
        })

      } catch (error: any) {
        console.error('❌ Comisiones CF dashboard error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve Comisiones CF dashboard'
        })
      }
    }
  })

  // 📈 GET /workspaces/comisiones-cf/reports - Reportes de fiscalización
  fastify.get('/reports', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get oversight and compliance reports',
      tags: ['Comisiones CF Workspace'],
      querystring: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['oversight', 'compliance', 'investigations', 'audit'],
            default: 'oversight'
          },
          period: {
            type: 'string',
            enum: ['month', 'quarter', 'year'],
            default: 'quarter'
          },
          scope: {
            type: 'string',
            enum: ['municipal', 'regional', 'nacional', 'all'],
            default: 'all'
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
                scope: { type: 'string' },
                findings: { type: 'array' },
                compliance: { type: 'object' },
                recommendations: { type: 'array' }
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
        scope?: string
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const { type = 'oversight', period = 'quarter', scope = 'all' } = request.query

        // 🔐 Verificar acceso y permisos
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'comisiones_cf')
        const permissions = await workspaceService.getUserWorkspacePermissions(user.id, 'comisiones_cf')
        
        if (!hasAccess || !permissions.includes('read')) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to view CF reports'
          })
        }

        // 📈 Generar reporte de fiscalización
        const reportData = await generateOversightReport(type, period, scope)

        return reply.status(200).send({
          success: true,
          message: `CF ${type} report for ${period} generated successfully`,
          data: reportData
        })

      } catch (error: any) {
        console.error('❌ Comisiones CF reports error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to generate CF reports'
        })
      }
    }
  })

  // 🎯 Log específico de Comisiones CF
  fastify.log.info(LogMessages.workspaceRoutes('Comisiones CF', [
    'GET /documents - Oversight documents with filters',
    'GET /investigations - Active investigations',
    'GET /dashboard - Oversight dashboard',
    'GET /reports - Oversight and compliance reports'
  ]))
}

// 🔧 Funciones auxiliares específicas de Comisiones CF

async function getOversightSummary(): Promise<any> {
  return {
    totalInvestigations: 12,
    criticalCases: 3,
    complianceRate: '78%',
    averageResolutionTime: '45 days'
  }
}

async function getActiveInvestigations(status?: string, priority?: string): Promise<any[]> {
  // TODO: Implementar obtención de investigaciones activas
  return []
}

async function getInvestigationsSummary(): Promise<any> {
  return {
    active: 8,
    pending: 4,
    completed: 15,
    critical: 2
  }
}

async function getCriticalFindings(): Promise<any[]> {
  // TODO: Implementar obtención de hallazgos críticos
  return []
}

async function getComplianceMetrics(): Promise<any> {
  return {
    overallCompliance: '78%',
    byScope: {
      municipal: '82%',
      regional: '75%',
      nacional: '70%'
    },
    trends: {
      improving: 65,
      stable: 25,
      declining: 10
    }
  }
}

async function generateOversightReport(type: string, period: string, scope: string): Promise<any> {
  // TODO: Implementar generación de reportes de fiscalización
  return {
    reportType: type,
    period,
    scope,
    generatedAt: new Date().toISOString(),
    findings: [],
    compliance: {
      rate: '78%',
      trend: 'stable'
    },
    recommendations: []
  }
}
