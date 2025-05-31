import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

// 📋 Schema de validación para query parameters
const listNotificationsSchema = z.object({
  isRead: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  isArchived: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  type: z.enum(['info', 'success', 'warning', 'error', 'announcement', 'reminder', 'task', 'alert']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  category: z.string().max(50).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().min(2).max(100).optional(),
  limit: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 100).default('20'),
  offset: z.string().transform(val => parseInt(val)).refine(val => val >= 0).default('0'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>

// 📋 Rutas para listar notificaciones
export async function listNotificationRoute(fastify: FastifyInstance): Promise<void> {
  
  // 📋 GET /notifications/list - Obtener lista de notificaciones con filtros avanzados
  fastify.route({
    method: 'GET',
    url: '/notifications/list',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get a list of notifications with advanced filters',
      tags: ['Notifications'],
      querystring: {
        type: 'object',
        properties: {
          isRead: { type: 'string', enum: ['true', 'false'] },
          isArchived: { type: 'string', enum: ['true', 'false'] },
          type: { 
            type: 'string', 
            enum: ['info', 'success', 'warning', 'error', 'announcement', 'reminder', 'task', 'alert'] 
          },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
          category: { type: 'string', maxLength: 50 },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          search: { type: 'string', minLength: 2, maxLength: 100 },
          limit: { type: 'string', default: '20' },
          offset: { type: 'string', default: '0' },
          sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'priority'], default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
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
                notifications: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      content: { type: 'string' },
                      type: { type: 'string' },
                      priority: { type: 'string' },
                      isRead: { type: 'boolean' },
                      isArchived: { type: 'boolean' },
                      createdAt: { type: 'string' },
                      readAt: { type: 'string' },
                      category: { type: 'string' },
                      actionRequired: { type: 'boolean' },
                      actionUrl: { type: 'string' },
                      actionText: { type: 'string' }
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
                },
                filters: { type: 'object' },
                summary: {
                  type: 'object',
                  properties: {
                    unreadCount: { type: 'number' },
                    byType: { type: 'object' },
                    byPriority: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: ListNotificationsQuery
    }>, reply: FastifyReply) => {
      try {
        // 🔐 Obtener usuario autenticado
        const user = (request as any).user
        if (!user?.id) {
          return reply.status(401).send({
            success: false,
            error: 'Authentication required',
            details: 'User not authenticated'
          })
        }

        // 📋 Validar parámetros de consulta
        const validationResult = listNotificationsSchema.safeParse(request.query)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const filters = validationResult.data

        // 🔍 Validar fechas
        if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid date range',
            details: 'startDate must be before endDate'
          })
        }

        // 📧 Obtener notificaciones del usuario
        const { notificationService } = require('../../services/notificationService')
        const result = await notificationService.getUserNotifications(user.id, filters)

        // 📊 Calcular resumen de notificaciones
        const summary = {
          unreadCount: result.unreadCount || 0,
          byType: result.notifications.reduce((acc: any, notif: any) => {
            acc[notif.type] = (acc[notif.type] || 0) + 1
            return acc
          }, {}),
          byPriority: result.notifications.reduce((acc: any, notif: any) => {
            acc[notif.priority] = (acc[notif.priority] || 0) + 1
            return acc
          }, {})
        }

        return reply.status(200).send({
          success: true,
          message: `Found ${result.total} notifications`,
          data: {
            notifications: result.notifications,
            pagination: {
              total: result.total,
              limit: filters.limit,
              offset: filters.offset,
              hasMore: result.hasMore
            },
            filters: {
              isRead: filters.isRead,
              isArchived: filters.isArchived,
              type: filters.type,
              priority: filters.priority,
              category: filters.category,
              search: filters.search
            },
            summary
          }
        })

      } catch (error: any) {
        console.error('❌ List notifications error:', error)

        // 🚨 Error de base de datos
        if (error.message.includes('Database') || error.message.includes('Prisma')) {
          return reply.status(500).send({
            success: false,
            error: 'Database error',
            details: 'Failed to retrieve notifications from database'
          })
        }

        // 🚨 Error general
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred while retrieving notifications'
        })
      }
    }
  })

  // 📋 GET /notifications/archived - Obtener notificaciones archivadas
  fastify.route({
    method: 'GET',
    url: '/notifications/archived',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get archived notifications',
      tags: ['Notifications'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string', default: '20' },
          offset: { type: 'string', default: '0' },
          sortBy: { type: 'string', enum: ['archivedAt', 'createdAt'], default: 'archivedAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
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
                notifications: { type: 'array' },
                total: { type: 'number' },
                pagination: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: {
        limit?: string
        offset?: string
        sortBy?: string
        sortOrder?: string
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const { limit = '20', offset = '0', sortBy = 'archivedAt', sortOrder = 'desc' } = request.query

        const filters = {
          isArchived: true,
          limit: parseInt(limit),
          offset: parseInt(offset),
          sortBy,
          sortOrder
        }

        const { notificationService } = require('../../services/notificationService')
        const result = await notificationService.getUserNotifications(user.id, filters)

        return reply.status(200).send({
          success: true,
          message: 'Archived notifications retrieved successfully',
          data: {
            notifications: result.notifications,
            total: result.total,
            pagination: {
              limit: filters.limit,
              offset: filters.offset,
              hasMore: result.hasMore
            }
          }
        })

      } catch (error: any) {
        console.error('❌ Get archived notifications error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve archived notifications'
        })
      }
    }
  })

  // 📋 GET /notifications/unread - Obtener solo notificaciones no leídas
  fastify.route({
    method: 'GET',
    url: '/notifications/unread',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get unread notifications',
      tags: ['Notifications'],
      querystring: {
        type: 'object',
        properties: {
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
          type: { 
            type: 'string', 
            enum: ['info', 'success', 'warning', 'error', 'announcement', 'reminder', 'task', 'alert'] 
          },
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
                notifications: { type: 'array' },
                count: { type: 'number' },
                hasUrgent: { type: 'boolean' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: {
        priority?: string
        type?: string
        limit?: string
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const { priority, type, limit = '50' } = request.query

        const filters = {
          isRead: false,
          priority,
          type,
          limit: parseInt(limit),
          offset: 0,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }

        const { notificationService } = require('../../services/notificationService')
        const result = await notificationService.getUserNotifications(user.id, filters)

        // 🚨 Verificar si hay notificaciones urgentes
        const hasUrgent = result.notifications.some((notif: any) => notif.priority === 'urgent')

        return reply.status(200).send({
          success: true,
          message: 'Unread notifications retrieved successfully',
          data: {
            notifications: result.notifications,
            count: result.total,
            hasUrgent
          }
        })

      } catch (error: any) {
        console.error('❌ Get unread notifications error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve unread notifications'
        })
      }
    }
  })
}

export default listNotificationRoute
