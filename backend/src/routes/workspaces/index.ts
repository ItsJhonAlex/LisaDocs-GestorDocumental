import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify'
import { camRoutes } from './cam'
import { amppRoutes } from './ampp'
import { presidenciaRoutes } from './presidencia'
import { intendenciaRoutes } from './intendencia'
import { comisionesRoutes } from './comisiones'
import { workspaceService } from '../../services/workspaceService'
import { WorkspaceType } from '../../generated/prisma'
import { z } from 'zod'
import { LogMessages } from '../../utils/logger'

// 📋 Schema de validación para parámetros de workspace
const workspaceParamsSchema = z.object({
  workspace: z.nativeEnum(WorkspaceType, {
    errorMap: () => ({ message: 'Invalid workspace type' })
  })
})

type WorkspaceParams = z.infer<typeof workspaceParamsSchema>

// 🏢 Plugin principal para rutas de workspaces
export async function workspaceRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {

  // 🏢 GET /workspaces - Listar todos los workspaces disponibles
  // Obtiene información básica de todos los workspaces con contadores y acceso del usuario
  fastify.get('/workspaces', {
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
                workspaces: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      documentsCount: { type: 'number' },
                      usersCount: { type: 'number' },
                      hasAccess: { type: 'boolean' }
                    }
                  }
                },
                userWorkspace: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request, reply) => {
      try {
        const user = (request as any).user

        // 📊 Obtener información de todos los workspaces
        const workspacesInfo = await workspaceService.getAllWorkspacesInfo(user.id)

        return reply.status(200).send({
          success: true,
          message: 'Workspaces retrieved successfully',
          data: {
            workspaces: workspacesInfo.workspaces,
            userWorkspace: user.workspace
          }
        })

      } catch (error: any) {
        console.error('❌ Get workspaces error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve workspaces information'
        })
      }
    }
  })

  // 🏢 GET /workspaces/:workspace - Información específica de un workspace
  // Obtiene información detallada de un workspace específico incluyendo estadísticas y documentos recientes
  fastify.get('/workspaces/:workspace', {
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          workspace: {
            type: 'string',
            enum: Object.values(WorkspaceType),
            description: 'Workspace identifier'
          }
        },
        required: ['workspace']
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
                workspace: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    documentsCount: { type: 'number' },
                    usersCount: { type: 'number' },
                    recentDocuments: { type: 'array' },
                    stats: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Params: WorkspaceParams }>, reply) => {
      try {
        const user = (request as any).user
        const { workspace } = request.params

        // 🔐 Verificar acceso al workspace
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, workspace)
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: `You don't have access to ${workspace} workspace`
          })
        }

        // 📊 Obtener información detallada del workspace
        const workspaceInfo = await workspaceService.getWorkspaceDetails(workspace, user.id)

        return reply.status(200).send({
          success: true,
          message: `${workspace} workspace information retrieved successfully`,
          data: {
            workspace: workspaceInfo
          }
        })

      } catch (error: any) {
        console.error('❌ Get workspace details error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve workspace details'
        })
      }
    }
  })

  // 📊 GET /workspaces/:workspace/stats - Estadísticas del workspace
  // Obtiene estadísticas completas del workspace: documentos, usuarios, almacenamiento y actividad
  fastify.get('/workspaces/:workspace/stats', {
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          workspace: {
            type: 'string',
            enum: Object.values(WorkspaceType)
          }
        },
        required: ['workspace']
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
                stats: {
                  type: 'object',
                  properties: {
                    totalDocuments: { type: 'number' },
                    documentsByStatus: { type: 'object' },
                    totalUsers: { type: 'number' },
                    usersByRole: { type: 'object' },
                    storageUsed: { type: 'string' },
                    recentActivity: { type: 'array' }
                  }
                }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Params: WorkspaceParams }>, reply) => {
      try {
        const user = (request as any).user
        const { workspace } = request.params

        // 🔐 Verificar acceso
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, workspace)
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: `You don't have access to ${workspace} workspace statistics`
          })
        }

        // 📊 Obtener estadísticas
        const stats = await workspaceService.getWorkspaceStats(workspace)

        return reply.status(200).send({
          success: true,
          message: `${workspace} workspace statistics retrieved successfully`,
          data: {
            stats
          }
        })

      } catch (error: any) {
        console.error('❌ Get workspace stats error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve workspace statistics'
        })
      }
    }
  })

  // 👥 GET /workspaces/:workspace/users - Usuarios del workspace
  // Obtiene la lista de usuarios activos en un workspace específico
  fastify.get('/workspaces/:workspace/users', {
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          workspace: {
            type: 'string',
            enum: Object.values(WorkspaceType)
          }
        },
        required: ['workspace']
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
                users: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      fullName: { type: 'string' },
                      email: { type: 'string' },
                      role: { type: 'string' },
                      isActive: { type: 'boolean' },
                      lastActivity: { type: 'string' }
                    }
                  }
                },
                total: { type: 'number' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Params: WorkspaceParams }>, reply) => {
      try {
        const user = (request as any).user
        const { workspace } = request.params

        // 🔐 Verificar permisos (admin o miembro del workspace)
        const canViewUsers = user.role === 'administrador' || 
                           user.workspace === workspace ||
                           ['presidente', 'vicepresidente'].includes(user.role)

        if (!canViewUsers) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You cannot view users from this workspace'
          })
        }

        // 👥 Obtener usuarios del workspace
        const workspaceUsers = await workspaceService.getWorkspaceUsers(workspace)

        return reply.status(200).send({
          success: true,
          message: `Users from ${workspace} workspace retrieved successfully`,
          data: {
            users: workspaceUsers.users,
            total: workspaceUsers.total
          }
        })

      } catch (error: any) {
        console.error('❌ Get workspace users error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve workspace users'
        })
      }
    }
  })

  // 🏢 Registrar rutas específicas de cada workspace
  await fastify.register(camRoutes, { prefix: '/workspaces/cam' })
  await fastify.register(amppRoutes, { prefix: '/workspaces/ampp' })
  await fastify.register(presidenciaRoutes, { prefix: '/workspaces/presidencia' })
  await fastify.register(intendenciaRoutes, { prefix: '/workspaces/intendencia' })
  await fastify.register(comisionesRoutes, { prefix: '/workspaces/comisiones-cf' })

  // 📊 Log de todas las rutas de workspace registradas  
  fastify.log.info(LogMessages.workspaceRoutesComplete({
    routes: {
      general: 'GET /api/workspaces - List all workspaces',
      details: 'GET /api/workspaces/:workspace - Workspace details',
      stats: 'GET /api/workspaces/:workspace/stats - Workspace statistics',
      users: 'GET /api/workspaces/:workspace/users - Workspace users',
      specific: {
        cam: '/api/workspaces/cam/* - CAM specific routes',
        ampp: '/api/workspaces/ampp/* - AMPP specific routes',
        presidencia: '/api/workspaces/presidencia/* - Presidencia specific routes',
        intendencia: '/api/workspaces/intendencia/* - Intendencia specific routes',
        comisiones: '/api/workspaces/comisiones-cf/* - Comisiones CF specific routes'
      }
    }
  }))
}
