import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { permissionService } from '../../services/permissionService'
import { z } from 'zod'

// 📋 Schemas de validación
const systemConfigSchema = z.object({
  security: z.object({
    sessionTimeout: z.number().min(300).max(86400), // 5 min a 24 horas
    maxLoginAttempts: z.number().min(3).max(10),
    passwordExpiryDays: z.number().min(30).max(365),
    enableTwoFactor: z.boolean(),
    enableIpWhitelist: z.boolean(),
    allowedIps: z.array(z.string().ip()).optional()
  }).optional(),
  storage: z.object({
    maxFileSize: z.number().min(1024 * 1024).max(100 * 1024 * 1024), // 1MB a 100MB
    allowedFileTypes: z.array(z.string()),
    autoArchiveDays: z.number().min(30).max(3650), // 30 días a 10 años
    backupRetentionDays: z.number().min(7).max(365)
  }).optional(),
  notifications: z.object({
    enableEmailNotifications: z.boolean(),
    enableBrowserNotifications: z.boolean(),
    adminEmailAlerts: z.boolean(),
    securityEventAlerts: z.boolean(),
    systemMaintenanceAlerts: z.boolean()
  }).optional(),
  performance: z.object({
    enableCaching: z.boolean(),
    cacheExpiryMinutes: z.number().min(5).max(1440), // 5 min a 24 horas
    maxConcurrentUsers: z.number().min(10).max(1000),
    enableRateLimit: z.boolean(),
    rateLimitWindow: z.number().min(60).max(3600) // 1 min a 1 hora
  }).optional()
})

type SystemConfig = z.infer<typeof systemConfigSchema>

// ⚙️ Rutas de configuración administrativa
export async function settingsRoute(fastify: FastifyInstance): Promise<void> {
  
  // ⚙️ GET /admin/settings - Obtener configuración del sistema
  fastify.route({
    method: 'GET',
    url: '/admin/settings',
    preHandler: fastify.authenticate,
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                security: { type: 'object' },
                storage: { type: 'object' },
                notifications: { type: 'object' },
                performance: { type: 'object' },
                lastUpdated: { type: 'string' },
                updatedBy: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // 🔐 Verificar permisos de administración
        const user = (request as any).user
        const canManageSettings = await permissionService.canPerformAdminAction(user.id, 'system_config')
        
        if (!canManageSettings) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to view system settings'
          })
        }

        // ⚙️ Obtener configuración actual del sistema
        const systemConfig = await getSystemConfiguration()

        return reply.status(200).send({
          success: true,
          message: 'System configuration retrieved successfully',
          data: systemConfig
        })

      } catch (error: any) {
        console.error('❌ Get settings error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve system settings'
        })
      }
    }
  })

  // ⚙️ PUT /admin/settings - Actualizar configuración del sistema
  fastify.route({
    method: 'PUT',
    url: '/admin/settings',
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          security: {
            type: 'object',
            properties: {
              sessionTimeout: { type: 'number', minimum: 300, maximum: 86400 },
              maxLoginAttempts: { type: 'number', minimum: 3, maximum: 10 },
              passwordExpiryDays: { type: 'number', minimum: 30, maximum: 365 },
              enableTwoFactor: { type: 'boolean' },
              enableIpWhitelist: { type: 'boolean' },
              allowedIps: { type: 'array', items: { type: 'string' } }
            }
          },
          storage: {
            type: 'object',
            properties: {
              maxFileSize: { type: 'number' },
              allowedFileTypes: { type: 'array', items: { type: 'string' } },
              autoArchiveDays: { type: 'number', minimum: 30, maximum: 3650 },
              backupRetentionDays: { type: 'number', minimum: 7, maximum: 365 }
            }
          },
          notifications: {
            type: 'object',
            properties: {
              enableEmailNotifications: { type: 'boolean' },
              enableBrowserNotifications: { type: 'boolean' },
              adminEmailAlerts: { type: 'boolean' },
              securityEventAlerts: { type: 'boolean' },
              systemMaintenanceAlerts: { type: 'boolean' }
            }
          },
          performance: {
            type: 'object',
            properties: {
              enableCaching: { type: 'boolean' },
              cacheExpiryMinutes: { type: 'number', minimum: 5, maximum: 1440 },
              maxConcurrentUsers: { type: 'number', minimum: 10, maximum: 1000 },
              enableRateLimit: { type: 'boolean' },
              rateLimitWindow: { type: 'number', minimum: 60, maximum: 3600 }
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
                updated: { type: 'boolean' },
                changes: { type: 'array' },
                restartRequired: { type: 'boolean' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: SystemConfig
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const canManageSettings = await permissionService.canPerformAdminAction(user.id, 'system_config')
        
        if (!canManageSettings) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to update system settings'
          })
        }

        // 📋 Validar configuración
        const configValidation = systemConfigSchema.safeParse(request.body)
        if (!configValidation.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: configValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        // ⚙️ Actualizar configuración
        const updateResult = await updateSystemConfiguration(configValidation.data, user.id)

        return reply.status(200).send({
          success: true,
          message: 'System configuration updated successfully',
          data: updateResult
        })

      } catch (error: any) {
        console.error('❌ Update settings error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to update system settings'
        })
      }
    }
  })

  // 💾 POST /admin/settings/backup - Crear backup del sistema
  fastify.route({
    method: 'POST',
    url: '/admin/settings/backup',
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          includeDocuments: { type: 'boolean', default: true },
          includeDatabase: { type: 'boolean', default: true },
          includeConfigs: { type: 'boolean', default: true },
          compressionLevel: { type: 'number', minimum: 1, maximum: 9, default: 6 },
          description: { type: 'string', maxLength: 255 }
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
                backupId: { type: 'string' },
                status: { type: 'string' },
                estimatedTime: { type: 'string' },
                downloadUrl: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: {
        includeDocuments?: boolean
        includeDatabase?: boolean
        includeConfigs?: boolean
        compressionLevel?: number
        description?: string
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const canManageSettings = await permissionService.canPerformAdminAction(user.id, 'system_config')
        
        if (!canManageSettings) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to create system backups'
          })
        }

        // 💾 Crear backup del sistema
        const backupResult = await createSystemBackup(request.body, user.id)

        return reply.status(200).send({
          success: true,
          message: 'System backup initiated successfully',
          data: backupResult
        })

      } catch (error: any) {
        console.error('❌ Create backup error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to create system backup'
        })
      }
    }
  })

  // 💾 GET /admin/settings/backups - Listar backups disponibles
  fastify.route({
    method: 'GET',
    url: '/admin/settings/backups',
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string', default: '20' },
          offset: { type: 'string', default: '0' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'failed'] }
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
                backups: { type: 'array' },
                total: { type: 'number' },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: { limit?: string; offset?: string; status?: string }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const canManageSettings = await permissionService.canPerformAdminAction(user.id, 'system_config')
        
        if (!canManageSettings) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to view system backups'
          })
        }

        const limit = parseInt(request.query.limit || '20')
        const offset = parseInt(request.query.offset || '0')
        const status = request.query.status

        // 💾 Obtener lista de backups
        const backupsResult = await getSystemBackups({ limit, offset, status })

        return reply.status(200).send({
          success: true,
          message: 'System backups retrieved successfully',
          data: backupsResult
        })

      } catch (error: any) {
        console.error('❌ Get backups error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve system backups'
        })
      }
    }
  })

  // 🔧 POST /admin/settings/maintenance - Configurar mantenimiento del sistema
  fastify.route({
    method: 'POST',
    url: '/admin/settings/maintenance',
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['enable', 'disable', 'schedule'] },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          message: { type: 'string', maxLength: 500 },
          allowAdminAccess: { type: 'boolean', default: true },
          redirectUrl: { type: 'string', format: 'uri' }
        },
        required: ['mode']
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
                maintenanceMode: { type: 'boolean' },
                scheduledStart: { type: 'string' },
                scheduledEnd: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: {
        mode: string
        startTime?: string
        endTime?: string
        message?: string
        allowAdminAccess?: boolean
        redirectUrl?: string
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const canManageSettings = await permissionService.canPerformAdminAction(user.id, 'system_config')
        
        if (!canManageSettings) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to configure system maintenance'
          })
        }

        // 🔧 Configurar mantenimiento
        const maintenanceResult = await configureSystemMaintenance(request.body, user.id)

        return reply.status(200).send({
          success: true,
          message: 'System maintenance configured successfully',
          data: maintenanceResult
        })

      } catch (error: any) {
        console.error('❌ Configure maintenance error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to configure system maintenance'
        })
      }
    }
  })

  // 📊 GET /admin/settings/health - Estado de salud del sistema
  fastify.route({
    method: 'GET',
    url: '/admin/settings/health',
    preHandler: fastify.authenticate,
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                overall: { type: 'string' },
                services: { type: 'object' },
                performance: { type: 'object' },
                storage: { type: 'object' },
                alerts: { type: 'array' },
                recommendations: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const canManageSettings = await permissionService.canPerformAdminAction(user.id, 'system_config')
        
        if (!canManageSettings) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to view system health'
          })
        }

        // 📊 Obtener estado de salud del sistema
        const healthStatus = await getSystemHealth()

        return reply.status(200).send({
          success: true,
          message: 'System health status retrieved successfully',
          data: healthStatus
        })

      } catch (error: any) {
        console.error('❌ Get health status error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve system health status'
        })
      }
    }
  })

  // 🔄 POST /admin/settings/reset - Resetear configuración a valores por defecto
  fastify.route({
    method: 'POST',
    url: '/admin/settings/reset',
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          sections: { 
            type: 'array', 
            items: { 
              type: 'string', 
              enum: ['security', 'storage', 'notifications', 'performance', 'all'] 
            } 
          },
          confirmReset: { type: 'boolean' }
        },
        required: ['sections', 'confirmReset']
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
                resetSections: { type: 'array' },
                restartRequired: { type: 'boolean' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: { sections: string[]; confirmReset: boolean }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const canManageSettings = await permissionService.canPerformAdminAction(user.id, 'system_config')
        
        if (!canManageSettings) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to reset system settings'
          })
        }

        if (!request.body.confirmReset) {
          return reply.status(400).send({
            success: false,
            error: 'Confirmation required',
            details: 'You must confirm the reset operation'
          })
        }

        // 🔄 Resetear configuración
        const resetResult = await resetSystemConfiguration(request.body.sections, user.id)

        return reply.status(200).send({
          success: true,
          message: 'System configuration reset successfully',
          data: resetResult
        })

      } catch (error: any) {
        console.error('❌ Reset settings error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to reset system settings'
        })
      }
    }
  })
}

// ⚙️ Obtener configuración actual del sistema
async function getSystemConfiguration() {
  // TODO: Implementar lectura real desde base de datos o archivo de configuración
  return {
    security: {
      sessionTimeout: 3600, // 1 hora
      maxLoginAttempts: 5,
      passwordExpiryDays: 90,
      enableTwoFactor: false,
      enableIpWhitelist: false,
      allowedIps: []
    },
    storage: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png'],
      autoArchiveDays: 365,
      backupRetentionDays: 30
    },
    notifications: {
      enableEmailNotifications: true,
      enableBrowserNotifications: true,
      adminEmailAlerts: true,
      securityEventAlerts: true,
      systemMaintenanceAlerts: true
    },
    performance: {
      enableCaching: true,
      cacheExpiryMinutes: 60,
      maxConcurrentUsers: 100,
      enableRateLimit: true,
      rateLimitWindow: 900 // 15 minutos
    },
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  }
}

// ⚙️ Actualizar configuración del sistema
async function updateSystemConfiguration(config: SystemConfig, userId: string) {
  // TODO: Implementar actualización real
  console.log('🔧 Updating system configuration:', config, 'by user:', userId)
  
  return {
    updated: true,
    changes: ['security.sessionTimeout', 'performance.enableCaching'],
    restartRequired: false
  }
}

// 💾 Crear backup del sistema
async function createSystemBackup(options: any, userId: string) {
  // TODO: Implementar backup real
  const backupId = `backup_${Date.now()}`
  
  return {
    backupId,
    status: 'pending',
    estimatedTime: '15-30 minutes',
    downloadUrl: `/admin/backups/download/${backupId}`
  }
}

// 💾 Obtener lista de backups
async function getSystemBackups(filters: any) {
  // TODO: Implementar listado real desde base de datos
  return {
    backups: [
      {
        id: 'backup_1234567890',
        description: 'Backup completo del sistema',
        status: 'completed',
        size: '2.3 GB',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Administrador',
        downloadUrl: '/admin/backups/download/backup_1234567890'
      }
    ],
    total: 1,
    hasMore: false
  }
}

// 🔧 Configurar mantenimiento del sistema
async function configureSystemMaintenance(config: any, userId: string) {
  // TODO: Implementar configuración real
  console.log('🔧 Configuring maintenance mode:', config, 'by user:', userId)
  
  return {
    maintenanceMode: config.mode === 'enable',
    scheduledStart: config.startTime,
    scheduledEnd: config.endTime,
    message: config.message || 'Sistema en mantenimiento'
  }
}

// 📊 Obtener estado de salud del sistema
async function getSystemHealth() {
  // TODO: Implementar verificación real de salud
  return {
    overall: 'healthy',
    services: {
      database: { status: 'healthy', responseTime: '12ms' },
      storage: { status: 'healthy', responseTime: '8ms' },
      cache: { status: 'healthy', hitRate: '95%' },
      api: { status: 'healthy', responseTime: '45ms' }
    },
    performance: {
      cpu: 35.2,
      memory: 62.8,
      disk: 45.1,
      network: 12.4
    },
    storage: {
      total: '1TB',
      used: '450GB',
      available: '550GB',
      percentage: 45
    },
    alerts: [],
    recommendations: [
      'Considerar optimizar consultas de base de datos',
      'Programar backup automático semanal'
    ]
  }
}

// 🔄 Resetear configuración del sistema
async function resetSystemConfiguration(sections: string[], userId: string) {
  // TODO: Implementar reset real
  console.log('🔄 Resetting configuration sections:', sections, 'by user:', userId)
  
  return {
    resetSections: sections,
    restartRequired: sections.includes('all') || sections.includes('performance')
  }
}
