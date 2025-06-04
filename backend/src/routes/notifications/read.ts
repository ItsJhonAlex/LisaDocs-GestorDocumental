import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { notificationService } from '../../services/notificationService'
import { z } from 'zod'

// 📋 Schema de validación para marcar como leída
const markAsReadSchema = z.object({
  notificationId: z.string().uuid('Invalid notification ID format')
})

// 📋 Schema para marcar múltiples como leídas
const markMultipleAsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1, 'At least one notification ID is required').max(50, 'Maximum 50 notifications at once')
})

type MarkAsReadParams = z.infer<typeof markAsReadSchema>
type MarkMultipleAsReadBody = z.infer<typeof markMultipleAsReadSchema>

// 📧 Rutas para manejar estado de lectura de notificaciones
export async function notificationReadRoute(fastify: FastifyInstance): Promise<void> {

  // 📧 PUT /:id/read - Marcar notificación específica como leída
  fastify.put('/:notificationId/read', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Mark a specific notification as read',
      tags: ['Notifications'],
      params: {
        type: 'object',
        properties: {
          notificationId: { 
            type: 'string', 
            format: 'uuid',
            description: 'Notification ID to mark as read'
          }
        },
        required: ['notificationId']
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
                notificationId: { type: 'string' },
                readAt: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            details: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Params: MarkAsReadParams }>, reply: FastifyReply) => {
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

        // 📋 Validar parámetros
        const validationResult = markAsReadSchema.safeParse(request.params)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid notification ID',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const { notificationId } = validationResult.data

        // 📧 Marcar como leída
        const result = await notificationService.markAsRead(notificationId, user.id)

        if (!result.success) {
          return reply.status(404).send({
            success: false,
            error: 'Notification not found',
            details: 'Notification not found or you do not have access to it'
          })
        }

        return reply.status(200).send({
          success: true,
          message: 'Notification marked as read',
          data: {
            notificationId,
            readAt: result.readAt
          }
        })

      } catch (error: any) {
        console.error('❌ Mark notification as read error:', error)

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to mark notification as read'
        })
      }
    }
  })

  // 📧 PUT /read-multiple - Marcar múltiples notificaciones como leídas
  fastify.put('/read-multiple', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Mark multiple notifications as read',
      tags: ['Notifications'],
      body: {
        type: 'object',
        properties: {
          notificationIds: { 
            type: 'array', 
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            maxItems: 50,
            description: 'Array of notification IDs to mark as read'
          }
        },
        required: ['notificationIds']
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
                markedCount: { type: 'number' },
                failedIds: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Body: MarkMultipleAsReadBody }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 📋 Validar datos
        const validationResult = markMultipleAsReadSchema.safeParse(request.body)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid notification IDs',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const { notificationIds } = validationResult.data

        // 📧 Marcar múltiples como leídas (usando markAsRead individualmente)
        const results = {
          markedCount: 0,
          failedIds: [] as string[]
        }

        for (const notificationId of notificationIds) {
          try {
            const result = await notificationService.markAsRead(notificationId, user.id)
            if (result.success) {
              results.markedCount++
        } else {
              results.failedIds.push(notificationId)
            }
          } catch (error) {
            results.failedIds.push(notificationId)
          }
        }

        return reply.status(200).send({
          success: true,
          message: `${results.markedCount} notifications marked as read`,
          data: results
        })

      } catch (error: any) {
        console.error('❌ Mark multiple notifications as read error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to mark notifications as read'
        })
      }
    }
  })

  // 📧 PUT /read-all - Marcar todas las notificaciones como leídas
  fastify.put('/read-all', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Mark all user notifications as read',
      tags: ['Notifications'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                markedCount: { type: 'number' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 📧 Obtener todas las notificaciones no leídas
        const notifications = await notificationService.getUserNotifications(user.id, {
          isRead: false,
          limit: 1000  // Asumiendo que no hay más de 1000 notificaciones no leídas
        })

        let markedCount = 0

        // 📧 Marcar todas como leídas
        for (const notification of notifications.notifications) {
          try {
            const result = await notificationService.markAsRead(notification.notificationId, user.id)
            if (result.success) {
              markedCount++
            }
          } catch (error) {
            // Continuar con la siguiente notificación
            console.error(`❌ Failed to mark notification ${notification.notificationId} as read:`, error)
          }
        }

        return reply.status(200).send({
          success: true,
          message: `All ${markedCount} notifications marked as read`,
          data: {
            markedCount
          }
        })

      } catch (error: any) {
        console.error('❌ Mark all notifications as read error:', error)

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to mark all notifications as read'
        })
      }
    }
  })

  // 📧 GET /unread-count - Obtener conteo de notificaciones no leídas
  fastify.get('/unread-count', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get count of unread notifications for the current user',
      tags: ['Notifications'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                unreadCount: { type: 'number' },
                lastChecked: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 📊 Obtener conteo de no leídas usando getUserNotifications
        const result = await notificationService.getUserNotifications(user.id, {
          isRead: false,
          limit: 1  // Solo necesitamos el conteo total
        })

        return reply.status(200).send({
          success: true,
          message: 'Unread count retrieved successfully',
          data: {
            unreadCount: result.unreadCount,
            lastChecked: new Date().toISOString()
          }
        })

      } catch (error: any) {
        console.error('❌ Get unread count error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to get unread count'
        })
      }
    }
  })
}

export default notificationReadRoute
