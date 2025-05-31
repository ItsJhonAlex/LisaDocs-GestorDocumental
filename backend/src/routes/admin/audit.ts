import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { auditService } from '../../services/auditService'
import { permissionService } from '../../services/permissionService'
import { z } from 'zod'

// 📋 Schemas de validación
const auditQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  workspace: z.string().optional(),
  level: z.enum(['info', 'warning', 'error']).optional(),
  limit: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 1000).default('100'),
  offset: z.string().transform(val => parseInt(val)).refine(val => val >= 0).default('0')
})

type AuditQuery = z.infer<typeof auditQuerySchema>

// 🔍 Rutas de auditoría administrativa
export async function auditRoute(fastify: FastifyInstance): Promise<void> {
  
  // 🔍 GET /admin/audit/logs - Obtener logs de auditoría
  fastify.route({
    method: 'GET',
    url: '/admin/audit/logs',
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          userId: { type: 'string', format: 'uuid' },
          action: { type: 'string' },
          workspace: { type: 'string' },
          level: { type: 'string', enum: ['info', 'warning', 'error'] },
          limit: { type: 'string', default: '100' },
          offset: { type: 'string', default: '0' }
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
                logs: { type: 'array' },
                total: { type: 'number' },
                hasMore: { type: 'boolean' },
                summary: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: AuditQuery
    }>, reply: FastifyReply) => {
      try {
        // 🔐 Verificar permisos de auditoría
        const user = (request as any).user
        const canViewAudit = await permissionService.canPerformAdminAction(user.id, 'view_audit')
        
        if (!canViewAudit) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to view audit logs'
          })
        }

        // 📋 Validar parámetros
        const queryValidation = auditQuerySchema.safeParse(request.query)
        if (!queryValidation.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: queryValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const filters = queryValidation.data

        // 📊 Obtener logs de auditoría
        const auditResult = await auditService.getAuditLogs(filters)

        return reply.status(200).send({
          success: true,
          message: 'Audit logs retrieved successfully',
          data: auditResult
        })

      } catch (error: any) {
        console.error('❌ Audit logs error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve audit logs'
        })
      }
    }
  })

  // 👤 GET /admin/audit/user-activity/:userId - Actividad específica de usuario
  fastify.route({
    method: 'GET',
    url: '/admin/audit/user-activity/:userId',
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' }
        },
        required: ['userId']
      },
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'string', default: '30' },
          includeDetails: { type: 'string', default: 'true' }
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
                user: { type: 'object' },
                activity: { type: 'array' },
                statistics: { type: 'object' },
                riskAssessment: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Params: { userId: string }
      Querystring: { days?: string; includeDetails?: string }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const canViewAudit = await permissionService.canPerformAdminAction(user.id, 'view_audit')
        
        if (!canViewAudit) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to view user activity'
          })
        }

        const { userId } = request.params
        const days = parseInt(request.query.days || '30')
        const includeDetails = request.query.includeDetails !== 'false'

        // 📊 Obtener actividad del usuario
        const userActivity = await auditService.getUserActivity(userId, days, includeDetails)

        return reply.status(200).send({
          success: true,
          message: 'User activity retrieved successfully',
          data: userActivity
        })

      } catch (error: any) {
        console.error('❌ User activity error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve user activity'
        })
      }
    }
  })

  // 🔒 GET /admin/audit/security-events - Eventos de seguridad
  fastify.route({
    method: 'GET',
    url: '/admin/audit/security-events',
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          resolved: { type: 'string', enum: ['true', 'false'] },
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
                events: { type: 'array' },
                summary: { type: 'object' },
                recommendations: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: {
        severity?: string
        startDate?: string
        endDate?: string
        resolved?: string
        limit?: string
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const canViewAudit = await permissionService.canPerformAdminAction(user.id, 'view_audit')
        
        if (!canViewAudit) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to view security events'
          })
        }

        // 🔒 Obtener eventos de seguridad
        const securityEvents = await auditService.getSecurityEvents(request.query)

        return reply.status(200).send({
          success: true,
          message: 'Security events retrieved successfully',
          data: securityEvents
        })

      } catch (error: any) {
        console.error('❌ Security events error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve security events'
        })
      }
    }
  })

  // 📊 GET /admin/audit/reports - Generar reportes de auditoría
  fastify.route({
    method: 'GET',
    url: '/admin/audit/reports',
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            enum: ['daily', 'weekly', 'monthly', 'custom'],
            default: 'daily'
          },
          format: { 
            type: 'string', 
            enum: ['json', 'csv', 'pdf'],
            default: 'json'
          },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          includeCharts: { type: 'string', default: 'true' }
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
                report: { type: 'object' },
                downloadUrl: { type: 'string' },
                expiresAt: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: {
        type?: string
        format?: string
        startDate?: string
        endDate?: string
        includeCharts?: string
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const canViewAudit = await permissionService.canPerformAdminAction(user.id, 'view_audit')
        
        if (!canViewAudit) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to generate audit reports'
          })
        }

        // 📊 Generar reporte de auditoría
        const reportResult = await auditService.generateAuditReport(request.query, user.id)

        return reply.status(200).send({
          success: true,
          message: 'Audit report generated successfully',
          data: reportResult
        })

      } catch (error: any) {
        console.error('❌ Audit report error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to generate audit report'
        })
      }
    }
  })

  // ⚠️ POST /admin/audit/mark-reviewed/:eventId - Marcar evento como revisado
  fastify.route({
    method: 'POST',
    url: '/admin/audit/mark-reviewed/:eventId',
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          eventId: { type: 'string', format: 'uuid' }
        },
        required: ['eventId']
      },
      body: {
        type: 'object',
        properties: {
          reviewNotes: { type: 'string', maxLength: 500 },
          resolution: { 
            type: 'string', 
            enum: ['resolved', 'false_positive', 'investigating', 'escalated']
          }
        },
        required: ['resolution']
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
                eventId: { type: 'string' },
                resolution: { type: 'string' },
                reviewedBy: { type: 'string' },
                reviewedAt: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Params: { eventId: string }
      Body: { reviewNotes?: string; resolution: string }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const canViewAudit = await permissionService.canPerformAdminAction(user.id, 'view_audit')
        
        if (!canViewAudit) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to review audit events'
          })
        }

        const { eventId } = request.params
        const { reviewNotes, resolution } = request.body

        // ✅ Marcar evento como revisado
        const reviewResult = await auditService.markEventAsReviewed(
          eventId, 
          user.id, 
          resolution, 
          reviewNotes
        )

        return reply.status(200).send({
          success: true,
          message: 'Audit event marked as reviewed successfully',
          data: reviewResult
        })

      } catch (error: any) {
        console.error('❌ Mark reviewed error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to mark event as reviewed'
        })
      }
    }
  })

  // 📈 GET /admin/audit/statistics - Estadísticas de auditoría
  fastify.route({
    method: 'GET',
    url: '/admin/audit/statistics',
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          period: { 
            type: 'string', 
            enum: ['7d', '30d', '90d', '1y'],
            default: '30d'
          },
          groupBy: { 
            type: 'string', 
            enum: ['day', 'week', 'month'],
            default: 'day'
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
                overview: { type: 'object' },
                trends: { type: 'array' },
                topUsers: { type: 'array' },
                topActions: { type: 'array' },
                securityMetrics: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: { period?: string; groupBy?: string }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const canViewAudit = await permissionService.canPerformAdminAction(user.id, 'view_audit')
        
        if (!canViewAudit) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to view audit statistics'
          })
        }

        const { period = '30d', groupBy = 'day' } = request.query

        // 📈 Obtener estadísticas de auditoría
        const statistics = await auditService.getAuditStatistics(period, groupBy)

        return reply.status(200).send({
          success: true,
          message: 'Audit statistics retrieved successfully',
          data: statistics
        })

      } catch (error: any) {
        console.error('❌ Audit statistics error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve audit statistics'
        })
      }
    }
  })
}
