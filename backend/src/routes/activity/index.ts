import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { activityService } from '../../services/activityService'
import { permissionService } from '../../services/permissionService'
import { WorkspaceType } from '../../generated/prisma'
import { z } from 'zod'

// 📋 Schema de validación para query parameters
const activityQuerySchema = z.object({
  documentId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.enum(['uploaded', 'downloaded', 'deleted', 'archived', 'status_changed', 'viewed', 'updated', 'created']).optional(),
  workspace: z.nativeEnum(WorkspaceType).optional(),
  dateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.union([z.string(), z.number()]).optional().transform(val => val ? parseInt(val.toString()) : 50),
  offset: z.union([z.string(), z.number()]).optional().transform(val => val ? parseInt(val.toString()) : 0)
})

type ActivityQuery = z.infer<typeof activityQuerySchema>

// 📊 Rutas de actividad de documentos
export async function activityRoutes(fastify: FastifyInstance): Promise<void> {

  // 📊 GET /activity - Obtener actividades con filtros
  fastify.get('/', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get document activities with filters',
      tags: ['Activity'],
      querystring: {
        type: 'object',
        properties: {
          documentId: {
            type: 'string',
            format: 'uuid',
            description: 'Filter by specific document'
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'Filter by specific user'
          },
          action: {
            type: 'string',
            enum: ['uploaded', 'downloaded', 'deleted', 'archived', 'status_changed', 'viewed', 'updated', 'created'],
            description: 'Filter by action type'
          },
          workspace: {
            type: 'string',
            enum: Object.values(WorkspaceType),
            description: 'Filter by workspace'
          },
          dateFrom: {
            type: 'string',
            format: 'date-time',
            description: 'Filter from date'
          },
          dateTo: {
            type: 'string',
            format: 'date-time',
            description: 'Filter to date'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 50,
            description: 'Number of activities per page'
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            description: 'Number of activities to skip'
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
                activities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      action: { type: 'string' },
                      details: { type: 'object' },
                      ipAddress: { type: 'string' },
                      userAgent: { type: 'string' },
                      createdAt: { type: 'string' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          fullName: { type: 'string' },
                          email: { type: 'string' },
                          role: { type: 'string' }
                        }
                      },
                      document: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          title: { type: 'string' },
                          fileName: { type: 'string' },
                          workspace: { type: 'string' },
                          status: { type: 'string' }
                        }
                      }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    limit: { type: 'number' },
                    offset: { type: 'number' },
                    hasMore: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Querystring: ActivityQuery }>, reply: FastifyReply) => {
      try {
        // 🔐 Verificar autenticación
        const user = (request as any).user
        if (!user?.id) {
          return reply.status(401).send({
            success: false,
            error: 'Authentication required'
          })
        }

        // 🛡️ Verificar permisos para ver actividad
        const hasActivityAccess = ['administrador', 'presidente', 'vicepresidente'].includes(user.role) ||
                                user.role.includes('secretario')
        
        if (!hasActivityAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            message: 'You do not have permission to view activity logs'
          })
        }

        // 📋 Validar query parameters
        const validationResult = activityQuerySchema.safeParse(request.query)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid query parameters',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const filters = validationResult.data

        console.log('📊 Fetching activities:', {
          userId: user.id,
          userRole: user.role,
          filters
        })

        // 📊 Obtener actividades
        const result = await activityService.getActivities(filters)

        return reply.status(200).send({
          success: true,
          message: `Found ${result.total} activities`,
          data: {
            activities: result.activities,
            pagination: {
              total: result.total,
              limit: filters.limit || 50,
              offset: filters.offset || 0,
              hasMore: result.hasMore
            }
          }
        })

      } catch (error: any) {
        console.error('❌ Get activities error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve activities'
        })
      }
    }
  })

  // 📊 GET /activity/stats - Estadísticas de actividad
  fastify.get('/stats', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get activity statistics',
      tags: ['Activity'],
      querystring: {
        type: 'object',
        properties: {
          dateFrom: {
            type: 'string',
            format: 'date-time',
            description: 'Statistics from date'
          },
          dateTo: {
            type: 'string',
            format: 'date-time',
            description: 'Statistics to date'
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
                actionStats: { type: 'array' },
                dailyActivity: { type: 'array' },
                topUsers: { type: 'array' },
                topDocuments: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: { dateFrom?: string, dateTo?: string }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        
        // 🛡️ Solo administradores pueden ver estadísticas
        if (user.role !== 'administrador') {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            message: 'Only administrators can view activity statistics'
          })
        }

        const { dateFrom, dateTo } = request.query
        const fromDate = dateFrom ? new Date(dateFrom) : undefined
        const toDate = dateTo ? new Date(dateTo) : undefined

        const stats = await activityService.getActivityStats(fromDate, toDate)

        return reply.status(200).send({
          success: true,
          message: 'Activity statistics retrieved successfully',
          data: stats
        })

      } catch (error: any) {
        console.error('❌ Get activity stats error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve activity statistics'
        })
      }
    }
  })

  // 📊 GET /activity/recent - Actividad reciente (para dashboard)
  fastify.get('/recent', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get recent activity for dashboard',
      tags: ['Activity'],
      querystring: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            default: 20
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
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  action: { type: 'string' },
                  createdAt: { type: 'string' },
                  description: { type: 'string' },
                  user: { type: 'object' },
                  document: { type: 'object' }
                }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: { limit?: number }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const { limit = 20 } = request.query

        // 🛡️ Verificar permisos básicos
        const hasActivityAccess = ['administrador', 'presidente', 'vicepresidente'].includes(user.role) ||
                                user.role.includes('secretario')
        
        if (!hasActivityAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied'
          })
        }

        const recentActivity = await activityService.getRecentActivity(limit)

        return reply.status(200).send({
          success: true,
          message: 'Recent activity retrieved successfully',
          data: recentActivity
        })

      } catch (error: any) {
        console.error('❌ Get recent activity error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve recent activity'
        })
      }
    }
  })
}

export default activityRoutes 