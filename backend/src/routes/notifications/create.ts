import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { notificationService } from '../../services/notificationService'
import { permissionService } from '../../services/permissionService'
import { NotificationType, WorkspaceType, UserRole } from '../../generated/prisma'
import { z } from 'zod'

// 📋 Schema de validación para crear notificación individual
const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  type: z.nativeEnum(NotificationType, { message: 'Invalid notification type' }),
  userId: z.string().uuid('Invalid user ID'),
  relatedDocumentId: z.string().uuid().optional(),
  expiresAt: z.string().optional()
})

// 📋 Schema de validación para notificaciones masivas
const createBulkNotificationSchema = z.object({
  notifications: z.array(z.object({
    title: z.string().min(1).max(255),
    message: z.string().min(1).max(1000),
    type: z.nativeEnum(NotificationType),
    userId: z.string().uuid(),
    relatedDocumentId: z.string().uuid().optional()
  })).min(1, 'At least one notification required').max(100, 'Maximum 100 notifications at once')
})

// 📋 Schema para anuncios del sistema
const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
  targetWorkspaces: z.array(z.nativeEnum(WorkspaceType)).optional(),
  targetRoles: z.array(z.nativeEnum(UserRole)).optional(),
  expiresAt: z.string().optional()
})

type CreateNotificationData = z.infer<typeof createNotificationSchema>
type BulkNotificationData = z.infer<typeof createBulkNotificationSchema>
type AnnouncementData = z.infer<typeof createAnnouncementSchema>

// 📧 Rutas para crear notificaciones
export async function createNotificationRoute(fastify: FastifyInstance): Promise<void> {
  
  // 📧 POST /notifications - Crear notificación individual
  fastify.post('/', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Create a single notification',
      tags: ['Notifications'],
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          message: { type: 'string', minLength: 1, maxLength: 1000 },
          type: { 
            type: 'string', 
            enum: ['document_uploaded', 'document_archived', 'system_message', 'warning']
          },
          userId: { type: 'string', format: 'uuid' },
          relatedDocumentId: { type: 'string', format: 'uuid' },
          expiresAt: { type: 'string', format: 'date-time' }
        },
        required: ['title', 'message', 'type', 'userId']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                notificationId: { type: 'string' },
                status: { type: 'string' },
                recipientCount: { type: 'number' }
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
        403: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Body: CreateNotificationData }>, reply: FastifyReply) => {
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
        
        // 🔐 Verificar permisos para crear notificaciones
        const capabilities = await permissionService.getUserCapabilities(user.id)
        const canCreateNotifications = capabilities.admin.systemSettings || 
                                     user.role === 'administrador' ||
                                     ['presidente', 'vicepresidente'].includes(user.role)
        
        if (!canCreateNotifications) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to create notifications'
          })
        }

        // 📋 Validar datos de entrada
        const validationResult = createNotificationSchema.safeParse(request.body)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        // 📧 Crear notificación
        const result = await notificationService.createNotification(validationResult.data)

        return reply.status(201).send({
          success: true,
          message: 'Notification created successfully',
          data: result
        })

      } catch (error: any) {
        console.error('❌ Create notification error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to create notification'
        })
      }
    }
  })

  // 📧 POST /notifications/bulk - Crear múltiples notificaciones
  fastify.post('/bulk', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Create multiple notifications at once',
      tags: ['Notifications'],
      body: {
        type: 'object',
        properties: {
          notifications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', minLength: 1, maxLength: 255 },
                message: { type: 'string', minLength: 1, maxLength: 1000 },
                type: { 
                  type: 'string', 
                  enum: ['document_uploaded', 'document_archived', 'system_message', 'warning']
                },
                userId: { type: 'string', format: 'uuid' },
                relatedDocumentId: { type: 'string', format: 'uuid' }
              },
              required: ['title', 'message', 'type', 'userId']
            },
            minItems: 1,
            maxItems: 100
          }
        },
        required: ['notifications']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                batchId: { type: 'string' },
                totalCount: { type: 'number' },
                successCount: { type: 'number' },
                failureCount: { type: 'number' },
                status: { type: 'string' },
                results: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Body: BulkNotificationData }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        
        // 🔐 Verificar permisos para crear notificaciones masivas
        const capabilities = await permissionService.getUserCapabilities(user.id)
        const canCreateBulkNotifications = capabilities.admin.systemSettings || user.role === 'administrador'
        if (!canCreateBulkNotifications) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to create bulk notifications'
          })
        }

        // 📋 Validar datos de entrada
        const validationResult = createBulkNotificationSchema.safeParse(request.body)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        // 📧 Crear notificaciones en lote
        const result = await notificationService.createBulkNotifications(validationResult.data)

        return reply.status(201).send({
          success: true,
          message: 'Bulk notifications created successfully',
          data: result
        })

      } catch (error: any) {
        console.error('❌ Create bulk notifications error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to create bulk notifications'
        })
      }
    }
  })

  // 📧 POST /notifications/announcement - Crear anuncio del sistema
  fastify.post('/announcement', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Create system-wide announcement',
      tags: ['Notifications'],
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          message: { type: 'string', minLength: 1, maxLength: 2000 },
          targetWorkspaces: { 
            type: 'array', 
            items: { 
            type: 'string', 
              enum: ['cam', 'ampp', 'presidencia', 'intendencia', 'comisiones_cf']
            }
          },
          targetRoles: { 
            type: 'array', 
            items: { 
            type: 'string',
              enum: ['administrador', 'presidente', 'vicepresidente', 'secretario_cam', 'secretario_ampp', 'secretario_cf', 'intendente', 'cf_member']
            }
          },
          expiresAt: { type: 'string', format: 'date-time' }
        },
        required: ['title', 'message']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                announcementId: { type: 'string' },
                status: { type: 'string' },
                recipientCount: { type: 'number' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Body: AnnouncementData }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        
        // 🔐 Solo administradores pueden crear anuncios del sistema
        if (user.role !== 'administrador') {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'Only administrators can create system announcements'
          })
        }

        // 📋 Validar datos de entrada
        const validationResult = createAnnouncementSchema.safeParse(request.body)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        // 📢 Crear anuncio del sistema
        const result = await notificationService.createSystemAnnouncement(validationResult.data)

        return reply.status(201).send({
          success: true,
          message: 'System announcement created successfully',
          data: result
        })

      } catch (error: any) {
        console.error('❌ Create announcement error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to create system announcement'
        })
      }
    }
  })
}

export default createNotificationRoute
