import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { notificationService } from '../../services/notificationService'
import { permissionService } from '../../services/permissionService'
import { z } from 'zod'

// 📋 Schemas de validación
const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(1000),
  type: z.enum(['info', 'success', 'warning', 'error', 'announcement', 'reminder', 'task', 'alert']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  recipients: z.object({
    type: z.enum(['all', 'role', 'workspace', 'specific', 'custom']),
    roles: z.array(z.string()).optional(),
    workspaces: z.array(z.string()).optional(),
    userIds: z.array(z.string().uuid()).optional(),
    excludeUsers: z.array(z.string().uuid()).optional()
  }),
  delivery: z.object({
    immediate: z.boolean().default(true),
    email: z.boolean().default(false),
    browser: z.boolean().default(true),
    scheduledAt: z.string().datetime().optional()
  }).optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().optional(),
  actionRequired: z.boolean().default(false),
  actionUrl: z.string().url().optional(),
  actionText: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).optional()
})

const createBulkNotificationSchema = z.object({
  notifications: z.array(createNotificationSchema).min(1).max(100),
  batchOptions: z.object({
    delayBetween: z.number().min(0).max(60000).default(100), // ms
    failurePolicy: z.enum(['stop', 'continue', 'retry']).default('continue'),
    retryAttempts: z.number().min(0).max(5).default(3)
  }).optional()
})

type CreateNotificationData = z.infer<typeof createNotificationSchema>
type BulkNotificationData = z.infer<typeof createBulkNotificationSchema>

// 📧 Rutas para crear notificaciones
export async function createNotificationRoute(fastify: FastifyInstance): Promise<void> {
  
  // 📧 POST /notifications/create - Crear una notificación individual
  fastify.route({
    method: 'POST',
    url: '/notifications/create',
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          content: { type: 'string', minLength: 1, maxLength: 1000 },
          type: { 
            type: 'string', 
            enum: ['info', 'success', 'warning', 'error', 'announcement', 'reminder', 'task', 'alert'] 
          },
          priority: { 
            type: 'string', 
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal'
          },
          recipients: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['all', 'role', 'workspace', 'specific', 'custom'] 
              },
              roles: { type: 'array', items: { type: 'string' } },
              workspaces: { type: 'array', items: { type: 'string' } },
              userIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
              excludeUsers: { type: 'array', items: { type: 'string', format: 'uuid' } }
            },
            required: ['type']
          },
          delivery: {
            type: 'object',
            properties: {
              immediate: { type: 'boolean', default: true },
              email: { type: 'boolean', default: false },
              browser: { type: 'boolean', default: true },
              scheduledAt: { type: 'string', format: 'date-time' }
            }
          },
          metadata: { type: 'object' },
          expiresAt: { type: 'string', format: 'date-time' },
          actionRequired: { type: 'boolean', default: false },
          actionUrl: { type: 'string', format: 'uri' },
          actionText: { type: 'string', maxLength: 50 },
          category: { type: 'string', maxLength: 50 },
          tags: { 
            type: 'array', 
            items: { type: 'string', maxLength: 30 },
            maxItems: 10
          }
        },
        required: ['title', 'content', 'type', 'recipients']
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
                recipientCount: { type: 'number' },
                deliveryStatus: { type: 'object' },
                scheduledAt: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: CreateNotificationData
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        
        // 🔐 Verificar permisos para crear notificaciones
        const capabilities = await permissionService.getUserCapabilities(user.id)
        const canCreateNotifications = capabilities.admin.systemSettings || user.role === 'administrador' || user.role === 'presidente'
        if (!canCreateNotifications) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to create notifications for the specified recipients'
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
        const result = await notificationService.createNotification({
          ...validationResult.data,
          createdBy: user.id
        })

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

  // 📧 POST /notifications/create/bulk - Crear múltiples notificaciones
  fastify.route({
    method: 'POST',
    url: '/notifications/create/bulk',
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          notifications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', minLength: 1, maxLength: 200 },
                content: { type: 'string', minLength: 1, maxLength: 1000 },
                type: { 
                  type: 'string', 
                  enum: ['info', 'success', 'warning', 'error', 'announcement', 'reminder', 'task', 'alert'] 
                },
                priority: { 
                  type: 'string', 
                  enum: ['low', 'normal', 'high', 'urgent'],
                  default: 'normal'
                },
                recipients: {
                  type: 'object',
                  properties: {
                    type: { 
                      type: 'string', 
                      enum: ['all', 'role', 'workspace', 'specific', 'custom'] 
                    },
                    roles: { type: 'array', items: { type: 'string' } },
                    workspaces: { type: 'array', items: { type: 'string' } },
                    userIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
                    excludeUsers: { type: 'array', items: { type: 'string', format: 'uuid' } }
                  },
                  required: ['type']
                }
              },
              required: ['title', 'content', 'type', 'recipients']
            },
            minItems: 1,
            maxItems: 100
          },
          batchOptions: {
            type: 'object',
            properties: {
              delayBetween: { type: 'number', minimum: 0, maximum: 60000, default: 100 },
              failurePolicy: { 
                type: 'string', 
                enum: ['stop', 'continue', 'retry'],
                default: 'continue'
              },
              retryAttempts: { type: 'number', minimum: 0, maximum: 5, default: 3 }
            }
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
                results: { type: 'array' },
                estimatedCompletion: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: BulkNotificationData
    }>, reply: FastifyReply) => {
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
        const result = await notificationService.createBulkNotifications({
          ...validationResult.data,
          createdBy: user.id
        })

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

  // 📧 POST /notifications/create/announcement - Crear anuncio del sistema
  fastify.route({
    method: 'POST',
    url: '/notifications/create/announcement',
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          content: { type: 'string', minLength: 1, maxLength: 2000 },
          priority: { 
            type: 'string', 
            enum: ['normal', 'high', 'urgent'],
            default: 'normal'
          },
          scope: {
            type: 'string',
            enum: ['system', 'workspace', 'role'],
            default: 'system'
          },
          targetWorkspaces: { type: 'array', items: { type: 'string' } },
          targetRoles: { type: 'array', items: { type: 'string' } },
          publishAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
          pinned: { type: 'boolean', default: false },
          allowComments: { type: 'boolean', default: false },
          requireAcknowledgment: { type: 'boolean', default: false }
        },
        required: ['title', 'content']
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
                recipientCount: { type: 'number' },
                publishAt: { type: 'string' },
                expiresAt: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: {
        title: string
        content: string
        priority?: string
        scope?: string
        targetWorkspaces?: string[]
        targetRoles?: string[]
        publishAt?: string
        expiresAt?: string
        pinned?: boolean
        allowComments?: boolean
        requireAcknowledgment?: boolean
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        
        // 🔐 Verificar permisos para crear anuncios
        const capabilities = await permissionService.getUserCapabilities(user.id)
        const canCreateAnnouncements = capabilities.admin.systemSettings || user.role === 'administrador' || user.role === 'presidente'
        if (!canCreateAnnouncements) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to create system announcements'
          })
        }

        // 📢 Crear anuncio del sistema
        const result = await notificationService.createSystemAnnouncement({
          ...request.body,
          createdBy: user.id
        })

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

  // 📧 POST /notifications/create/reminder - Crear recordatorio automático
  fastify.route({
    method: 'POST',
    url: '/notifications/create/reminder',
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          content: { type: 'string', minLength: 1, maxLength: 1000 },
          reminderAt: { type: 'string', format: 'date-time' },
          repeatOptions: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean', default: false },
              interval: { 
                type: 'string', 
                enum: ['daily', 'weekly', 'monthly'],
                default: 'daily'
              },
              count: { type: 'number', minimum: 1, maximum: 100 },
              endDate: { type: 'string', format: 'date-time' }
            }
          },
          recipients: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['all', 'role', 'workspace', 'specific'] 
              },
              roles: { type: 'array', items: { type: 'string' } },
              workspaces: { type: 'array', items: { type: 'string' } },
              userIds: { type: 'array', items: { type: 'string', format: 'uuid' } }
            },
            required: ['type']
          },
          actionRequired: { type: 'boolean', default: false },
          actionUrl: { type: 'string', format: 'uri' },
          actionText: { type: 'string', maxLength: 50 }
        },
        required: ['title', 'content', 'reminderAt', 'recipients']
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
                reminderId: { type: 'string' },
                status: { type: 'string' },
                nextExecution: { type: 'string' },
                recipientCount: { type: 'number' },
                repeatCount: { type: 'number' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: {
        title: string
        content: string
        reminderAt: string
        repeatOptions?: {
          enabled?: boolean
          interval?: string
          count?: number
          endDate?: string
        }
        recipients: {
          type: string
          roles?: string[]
          workspaces?: string[]
          userIds?: string[]
        }
        actionRequired?: boolean
        actionUrl?: string
        actionText?: string
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        
        // 🔐 Verificar permisos para crear recordatorios
        const capabilities = await permissionService.getUserCapabilities(user.id)
        const canCreateReminders = capabilities.admin.systemSettings || ['administrador', 'presidente', 'vicepresidente'].includes(user.role)
        if (!canCreateReminders) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to create reminders for the specified recipients'
          })
        }

        // ⏰ Crear recordatorio
        const result = await notificationService.createReminder({
          ...request.body,
          createdBy: user.id
        })

        return reply.status(201).send({
          success: true,
          message: 'Reminder created successfully',
          data: result
        })

      } catch (error: any) {
        console.error('❌ Create reminder error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to create reminder'
        })
      }
    }
  })

  // 📧 POST /notifications/create/template - Crear notificación desde plantilla
  fastify.route({
    method: 'POST',
    url: '/notifications/create/template',
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          templateId: { type: 'string' },
          variables: { type: 'object' },
          recipients: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['all', 'role', 'workspace', 'specific'] 
              },
              roles: { type: 'array', items: { type: 'string' } },
              workspaces: { type: 'array', items: { type: 'string' } },
              userIds: { type: 'array', items: { type: 'string', format: 'uuid' } }
            },
            required: ['type']
          },
          priority: { 
            type: 'string', 
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal'
          },
          delivery: {
            type: 'object',
            properties: {
              immediate: { type: 'boolean', default: true },
              email: { type: 'boolean', default: false },
              browser: { type: 'boolean', default: true },
              scheduledAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        required: ['templateId', 'recipients']
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
                templateUsed: { type: 'string' },
                status: { type: 'string' },
                recipientCount: { type: 'number' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: {
        templateId: string
        variables?: Record<string, any>
        recipients: {
          type: string
          roles?: string[]
          workspaces?: string[]
          userIds?: string[]
        }
        priority?: string
        delivery?: {
          immediate?: boolean
          email?: boolean
          browser?: boolean
          scheduledAt?: string
        }
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        
        // 🔐 Verificar permisos para usar plantillas
        const capabilities = await permissionService.getUserCapabilities(user.id)
        const canUseTemplates = capabilities.admin.systemSettings || ['administrador', 'presidente', 'vicepresidente'].includes(user.role)
        if (!canUseTemplates) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to use notification templates'
          })
        }

        // 📄 Crear notificación desde plantilla
        const result = await notificationService.createFromTemplate({
          ...request.body,
          createdBy: user.id
        })

        return reply.status(201).send({
          success: true,
          message: 'Notification created from template successfully',
          data: result
        })

      } catch (error: any) {
        console.error('❌ Create notification from template error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to create notification from template'
        })
      }
    }
  })
}
