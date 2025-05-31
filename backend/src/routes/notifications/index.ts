import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createNotificationRoute } from './create'
import { listNotificationRoute } from './list'
import { readNotificationRoute } from './read'

// 📧 Router principal de notificaciones
export async function notificationRoutes(fastify: FastifyInstance): Promise<void> {
  
  // 🔐 Middleware de autenticación para todas las rutas de notificaciones
  fastify.addHook('preHandler', fastify.authenticate)

  // 📧 Registrar todas las rutas de notificaciones
  await fastify.register(createNotificationRoute)  // Crear notificaciones
  await fastify.register(listNotificationRoute)    // Listar notificaciones
  await fastify.register(readNotificationRoute)    // Manejar lectura

  // 📊 GET /notifications - Obtener notificaciones del usuario
  fastify.route({
    method: 'GET',
    url: '/notifications',
    schema: {
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
          limit: { type: 'string', default: '20' },
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
                notifications: { type: 'array' },
                total: { type: 'number' },
                unreadCount: { type: 'number' },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: {
        isRead?: string
        isArchived?: string
        type?: string
        priority?: string
        category?: string
        startDate?: string
        endDate?: string
        limit?: string
        offset?: string
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const { notificationService } = require('../../services/notificationService')
        
        // 📊 Convertir query params a filtros
        const filters = {
          isRead: request.query.isRead === 'true' ? true : request.query.isRead === 'false' ? false : undefined,
          isArchived: request.query.isArchived === 'true' ? true : request.query.isArchived === 'false' ? false : undefined,
          type: request.query.type,
          priority: request.query.priority,
          category: request.query.category,
          startDate: request.query.startDate,
          endDate: request.query.endDate,
          limit: parseInt(request.query.limit || '20'),
          offset: parseInt(request.query.offset || '0')
        }

        // 📧 Obtener notificaciones del usuario
        const result = await notificationService.getUserNotifications(user.id, filters)

        return reply.status(200).send({
          success: true,
          message: 'Notifications retrieved successfully',
          data: result
        })

      } catch (error: any) {
        console.error('❌ Get notifications error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve notifications'
        })
      }
    }
  })

  // ✅ PUT /notifications/:id/read - Marcar notificación como leída
  fastify.route({
    method: 'PUT',
    url: '/notifications/:id/read',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
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
                success: { type: 'boolean' },
                readAt: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Params: { id: string }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const { id } = request.params
        const { notificationService } = require('../../services/notificationService')

        // ✅ Marcar como leída
        const result = await notificationService.markAsRead(id, user.id)

        return reply.status(200).send({
          success: true,
          message: 'Notification marked as read successfully',
          data: result
        })

      } catch (error: any) {
        console.error('❌ Mark as read error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to mark notification as read'
        })
      }
    }
  })

  // 📊 GET /notifications/stats - Estadísticas de notificaciones
  fastify.route({
    method: 'GET',
    url: '/notifications/stats',
    schema: {
      querystring: {
        type: 'object',
        properties: {
          period: { 
            type: 'string', 
            enum: ['7d', '30d', '90d'],
            default: '30d'
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
                topTypes: { type: 'array' },
                deliveryStats: { type: 'object' },
                userEngagement: { type: 'object' }
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
        const { period = '30d' } = request.query
        const { notificationService } = require('../../services/notificationService')

        // 📊 Obtener estadísticas de notificaciones
        const stats = await notificationService.getNotificationStatistics(period)

        return reply.status(200).send({
          success: true,
          message: 'Notification statistics retrieved successfully',
          data: stats
        })

      } catch (error: any) {
        console.error('❌ Get notification stats error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve notification statistics'
        })
      }
    }
  })
}

export default notificationRoutes
