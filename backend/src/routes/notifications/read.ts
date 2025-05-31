import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

// 📋 Schemas de validación
const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1).max(100).optional(),
  markAll: z.boolean().default(false),
  filters: z.object({
    type: z.enum(['info', 'success', 'warning', 'error', 'announcement', 'reminder', 'task', 'alert']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    category: z.string().max(50).optional(),
    olderThan: z.string().datetime().optional()
  }).optional()
})

const archiveSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1).max(100).optional(),
  archiveAll: z.boolean().default(false),
  autoArchiveRead: z.boolean().default(false),
  olderThanDays: z.number().min(1).max(365).optional()
})

type MarkReadRequest = z.infer<typeof markReadSchema>
type ArchiveRequest = z.infer<typeof archiveSchema>

// 📧 Rutas para manejo de lectura de notificaciones
export async function readNotificationRoute(fastify: FastifyInstance): Promise<void> {
  
  // ✅ PUT /notifications/:id/read - Marcar una notificación como leída
  fastify.route({
    method: 'PUT',
    url: '/notifications/:id/read',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Mark a notification as read',
      tags: ['Notifications'],
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
                notificationId: { type: 'string' },
                readAt: { type: 'string' },
                wasAlreadyRead: { type: 'boolean' }
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

        // 🔍 Validar UUID
        if (!id || !z.string().uuid().safeParse(id).success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid notification ID',
            details: 'Notification ID must be a valid UUID'
          })
        }

        // ✅ Marcar como leída
        const { notificationService } = require('../../services/notificationService')
        const result = await notificationService.markAsRead(id, user.id)

        return reply.status(200).send({
          success: true,
          message: result.wasAlreadyRead ? 'Notification was already read' : 'Notification marked as read successfully',
          data: {
            notificationId: id,
            readAt: result.readAt,
            wasAlreadyRead: result.wasAlreadyRead || false
          }
        })

      } catch (error: any) {
        console.error('❌ Mark notification as read error:', error)

        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          return reply.status(404).send({
            success: false,
            error: 'Notification not found',
            details: 'The specified notification does not exist or you do not have access to it'
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to mark notification as read'
        })
      }
    }
  })

  // ✅ PUT /notifications/read/bulk - Marcar múltiples notificaciones como leídas
  fastify.route({
    method: 'PUT',
    url: '/notifications/read/bulk',
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
            maxItems: 100
          },
          markAll: { type: 'boolean', default: false },
          filters: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['info', 'success', 'warning', 'error', 'announcement', 'reminder', 'task', 'alert'] 
              },
              priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
              category: { type: 'string', maxLength: 50 },
              olderThan: { type: 'string', format: 'date-time' }
            }
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
                markedCount: { type: 'number' },
                alreadyReadCount: { type: 'number' },
                failedCount: { type: 'number' },
                details: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: MarkReadRequest
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 📋 Validar datos de entrada
        const validationResult = markReadSchema.safeParse(request.body)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const { notificationIds, markAll, filters } = validationResult.data

        // 🔍 Validar que se proporcione al menos una opción
        if (!notificationIds && !markAll) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid request',
            details: 'Must provide either notificationIds or markAll=true'
          })
        }

        // ✅ Marcar notificaciones como leídas
        const { notificationService } = require('../../services/notificationService')
        let result

        if (markAll) {
          result = await notificationService.markAllAsRead(user.id, filters)
        } else {
          result = await notificationService.markMultipleAsRead(notificationIds!, user.id)
        }

        return reply.status(200).send({
          success: true,
          message: `Successfully marked ${result.markedCount} notifications as read`,
          data: {
            markedCount: result.markedCount,
            alreadyReadCount: result.alreadyReadCount || 0,
            failedCount: result.failedCount || 0,
            details: result.details || []
          }
        })

      } catch (error: any) {
        console.error('❌ Bulk mark as read error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to mark notifications as read'
        })
      }
    }
  })

  // ❌ PUT /notifications/:id/unread - Marcar notificación como no leída
  fastify.route({
    method: 'PUT',
    url: '/notifications/:id/unread',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Mark a notification as unread',
      tags: ['Notifications'],
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
                notificationId: { type: 'string' },
                markedUnreadAt: { type: 'string' }
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

        // 🔍 Validar UUID
        if (!z.string().uuid().safeParse(id).success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid notification ID',
            details: 'Notification ID must be a valid UUID'
          })
        }

        // ❌ Marcar como no leída
        const { notificationService } = require('../../services/notificationService')
        const result = await notificationService.markAsUnread(id, user.id)

        return reply.status(200).send({
          success: true,
          message: 'Notification marked as unread successfully',
          data: {
            notificationId: id,
            markedUnreadAt: result.markedUnreadAt
          }
        })

      } catch (error: any) {
        console.error('❌ Mark notification as unread error:', error)

        if (error.message.includes('not found')) {
          return reply.status(404).send({
            success: false,
            error: 'Notification not found',
            details: 'The specified notification does not exist or you do not have access to it'
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to mark notification as unread'
        })
      }
    }
  })

  // 📦 PUT /notifications/:id/archive - Archivar notificación
  fastify.route({
    method: 'PUT',
    url: '/notifications/:id/archive',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Archive a notification',
      tags: ['Notifications'],
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
                notificationId: { type: 'string' },
                archivedAt: { type: 'string' },
                wasAlreadyArchived: { type: 'boolean' }
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

        // 🔍 Validar UUID
        if (!z.string().uuid().safeParse(id).success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid notification ID',
            details: 'Notification ID must be a valid UUID'
          })
        }

        // 📦 Archivar notificación
        const { notificationService } = require('../../services/notificationService')
        const result = await notificationService.archiveNotification(id, user.id)

        return reply.status(200).send({
          success: true,
          message: result.wasAlreadyArchived ? 'Notification was already archived' : 'Notification archived successfully',
          data: {
            notificationId: id,
            archivedAt: result.archivedAt,
            wasAlreadyArchived: result.wasAlreadyArchived || false
          }
        })

      } catch (error: any) {
        console.error('❌ Archive notification error:', error)

        if (error.message.includes('not found')) {
          return reply.status(404).send({
            success: false,
            error: 'Notification not found',
            details: 'The specified notification does not exist or you do not have access to it'
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to archive notification'
        })
      }
    }
  })

  // 📦 PUT /notifications/archive/bulk - Archivar múltiples notificaciones
  fastify.route({
    method: 'PUT',
    url: '/notifications/archive/bulk',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Archive multiple notifications',
      tags: ['Notifications'],
      body: {
        type: 'object',
        properties: {
          notificationIds: { 
            type: 'array', 
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            maxItems: 100
          },
          archiveAll: { type: 'boolean', default: false },
          autoArchiveRead: { type: 'boolean', default: false },
          olderThanDays: { type: 'number', minimum: 1, maximum: 365 }
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
                archivedCount: { type: 'number' },
                alreadyArchivedCount: { type: 'number' },
                failedCount: { type: 'number' },
                details: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: ArchiveRequest
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 📋 Validar datos de entrada
        const validationResult = archiveSchema.safeParse(request.body)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const { notificationIds, archiveAll, autoArchiveRead, olderThanDays } = validationResult.data

        // 🔍 Validar que se proporcione al menos una opción
        if (!notificationIds && !archiveAll && !autoArchiveRead && !olderThanDays) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid request',
            details: 'Must provide notificationIds, archiveAll, autoArchiveRead, or olderThanDays'
          })
        }

        // 📦 Archivar notificaciones
        const { notificationService } = require('../../services/notificationService')
        let result

        if (archiveAll) {
          result = await notificationService.archiveAllNotifications(user.id)
        } else if (autoArchiveRead) {
          result = await notificationService.archiveReadNotifications(user.id, olderThanDays)
        } else if (olderThanDays) {
          result = await notificationService.archiveOldNotifications(user.id, olderThanDays)
        } else {
          result = await notificationService.archiveMultipleNotifications(notificationIds!, user.id)
        }

        return reply.status(200).send({
          success: true,
          message: `Successfully archived ${result.archivedCount} notifications`,
          data: {
            archivedCount: result.archivedCount,
            alreadyArchivedCount: result.alreadyArchivedCount || 0,
            failedCount: result.failedCount || 0,
            details: result.details || []
          }
        })

      } catch (error: any) {
        console.error('❌ Bulk archive error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to archive notifications'
        })
      }
    }
  })

  // 🔄 PUT /notifications/:id/restore - Restaurar notificación archivada
  fastify.route({
    method: 'PUT',
    url: '/notifications/:id/restore',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Restore an archived notification',
      tags: ['Notifications'],
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
                notificationId: { type: 'string' },
                restoredAt: { type: 'string' }
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

        // 🔍 Validar UUID
        if (!z.string().uuid().safeParse(id).success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid notification ID',
            details: 'Notification ID must be a valid UUID'
          })
        }

        // 🔄 Restaurar notificación
        const { notificationService } = require('../../services/notificationService')
        const result = await notificationService.restoreNotification(id, user.id)

        return reply.status(200).send({
          success: true,
          message: 'Notification restored successfully',
          data: {
            notificationId: id,
            restoredAt: result.restoredAt
          }
        })

      } catch (error: any) {
        console.error('❌ Restore notification error:', error)

        if (error.message.includes('not found')) {
          return reply.status(404).send({
            success: false,
            error: 'Notification not found',
            details: 'The specified notification does not exist or is not archived'
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to restore notification'
        })
      }
    }
  })
}

export default readNotificationRoute
