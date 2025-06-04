import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { notificationService } from '../../services/notificationService'
import { z } from 'zod'

// 📋 Schema de validación para query parameters
const notificationListSchema = z.object({
  status: z.enum(['read', 'unread', 'all']).optional().default('all'),
  type: z.enum(['document_uploaded', 'document_archived', 'system_message', 'warning']).optional(),
  category: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.union([z.string(), z.number()]).optional().transform(val => {
    if (typeof val === 'string') return parseInt(val) || 20
    return val || 20
  }),
  offset: z.union([z.string(), z.number()]).optional().transform(val => {
    if (typeof val === 'string') return parseInt(val) || 0
    return val || 0
  })
})

type NotificationQuery = z.infer<typeof notificationListSchema>

// 📧 Ruta para listar notificaciones
export async function notificationListRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get user notifications with filters',
      tags: ['Notifications'],
      querystring: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['read', 'unread', 'all'],
            default: 'all',
            description: 'Filter by read status'
          },
          type: { 
            type: 'string', 
            enum: ['document_uploaded', 'document_archived', 'system_message', 'warning'],
            description: 'Filter by notification type'
          },
          category: {
            type: 'string',
            description: 'Filter by category'
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
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
            description: 'Number of notifications per page'
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            description: 'Number of notifications to skip'
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
                notifications: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      notificationId: { type: 'string' },
                      isRead: { type: 'boolean' },
                      readAt: { type: 'string' },
                      notification: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          title: { type: 'string' },
                          message: { type: 'string' },
                          type: { type: 'string' },
                          createdAt: { type: 'string' },
                          expiresAt: { type: 'string' },
                          relatedDocumentId: { type: 'string' }
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
                },
                summary: {
                  type: 'object',
                  properties: {
                    unreadCount: { type: 'number' }
                  }
                }
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
        }
      }
    },

    handler: async (request: FastifyRequest<{ Querystring: NotificationQuery }>, reply: FastifyReply) => {
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

        // 📋 Validar y procesar query parameters
        const validationResult = notificationListSchema.safeParse(request.query)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid query parameters',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const filters = validationResult.data

        // 📊 Construir filtros para el servicio
        const serviceFilters = {
          isRead: filters.status === 'all' ? undefined : filters.status === 'read',
          type: filters.type,
          category: filters.category,
          startDate: filters.dateFrom,
          endDate: filters.dateTo,
          limit: filters.limit,
          offset: filters.offset
        }

        // 🔍 Obtener notificaciones
        const result = await notificationService.getUserNotifications(user.id, serviceFilters)

        return reply.status(200).send({
          success: true,
          message: `Found ${result.total} notifications`,
          data: {
            notifications: result.notifications.map(notification => ({
              id: notification.id,
              notificationId: notification.notificationId,
              isRead: notification.isRead,
              readAt: notification.readAt?.toISOString() || null,
              isArchived: notification.isArchived,
              archivedAt: notification.archivedAt?.toISOString() || null,
              actionTaken: notification.actionTaken,
              actionTakenAt: notification.actionTakenAt?.toISOString() || null,
              notification: {
                id: notification.notification.id,
                title: notification.notification.title,
                message: notification.notification.message,
                type: notification.notification.type,
                userId: notification.notification.userId,
                relatedDocumentId: notification.notification.relatedDocumentId || null,
                isRead: notification.notification.isRead,
                readAt: notification.notification.readAt?.toISOString() || null,
                expiresAt: notification.notification.expiresAt?.toISOString() || null,
                createdAt: notification.notification.createdAt.toISOString()
              }
            })),
            pagination: {
              total: result.total,
              limit: filters.limit || 20,
              offset: filters.offset || 0,
              hasMore: result.hasMore
            },
            summary: {
              unreadCount: result.unreadCount
            }
          }
        })

      } catch (error: any) {
        console.error('❌ Notification list error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve notifications'
        })
      }
    }
  })
}

export default notificationListRoute
