import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { userService } from '../../services/userService'
import { permissionService } from '../../services/permissionService'
import { z } from 'zod'

// 📋 Schema de validación para parámetros
const paramsSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
})

type PermissionsParams = z.infer<typeof paramsSchema>

// 🔍 Rutas de permisos de usuario
async function permissionsRoutePlugin(fastify: FastifyInstance): Promise<void> {
  
  // 🔍 GET /:id/permissions - Obtener permisos de un usuario específico
  fastify.get<{ Params: PermissionsParams }>('/:id/permissions', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get permissions for a specific user (admin only)',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            format: 'uuid',
            description: 'User UUID' 
          }
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
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    fullName: { type: 'string' },
                    role: { type: 'string' },
                    workspace: { type: 'string' }
                  }
                },
                permissions: {
                  type: 'object',
                  properties: {
                    canCreate: { type: 'boolean' },
                    canRead: { type: 'boolean' },
                    canUpdate: { type: 'boolean' },
                    canDelete: { type: 'boolean' },
                    canManageUsers: { type: 'boolean' },
                    canViewAllDocuments: { type: 'boolean' },
                    canArchiveDocuments: { type: 'boolean' },
                    workspaceAccess: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        403: {
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
    }
  }, async (request: FastifyRequest<{ Params: PermissionsParams }>, reply: FastifyReply) => {
    try {
      // 🔐 Obtener usuario autenticado
      const authenticatedUser = (request as any).user
      if (!authenticatedUser?.id) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required',
          details: 'User not authenticated'
        })
      }

      // 📋 Validar parámetros
      const paramsValidation = paramsSchema.safeParse(request.params)
      if (!paramsValidation.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid user ID',
          details: paramsValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        })
      }

      const { id: targetUserId } = paramsValidation.data

      // 🔐 Verificar permisos de acceso
      const canViewPermissions = authenticatedUser.role === 'administrador' || authenticatedUser.id === targetUserId
      
      if (!canViewPermissions) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied',
          details: 'You can only view your own permissions. Administrators can view any user permissions.'
        })
      }

      // 📄 Obtener usuario objetivo
      const targetUser = await userService.getUserById(targetUserId)
      if (!targetUser) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
          details: `No user found with ID: ${targetUserId}`
        })
      }

      // 🔍 Obtener capacidades del usuario usando el permissionService
      const capabilities = await permissionService.getUserCapabilities(targetUserId)

      // 📄 Formatear respuesta
      const responseData = {
        user: {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.fullName,
          role: targetUser.role,
          workspace: targetUser.workspace
        },
        permissions: {
          role: targetUser.role,
          workspace: targetUser.workspace,
          capabilities
        }
      }

      // ✅ Respuesta exitosa
      return reply.status(200).send({
        success: true,
        message: 'User permissions retrieved successfully',
        data: responseData
      })

    } catch (error: any) {
      console.error('❌ Get user permissions error:', error)

      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        details: 'Failed to retrieve user permissions'
      })
    }
  })

  // 🔍 GET /permissions/my - Obtener permisos del usuario autenticado (shortcut)
  fastify.get('/permissions/my', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get permissions for the authenticated user',
      tags: ['Users'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    fullName: { type: 'string' },
                    role: { type: 'string' },
                    workspace: { type: 'string' }
                  }
                },
                permissions: {
                  type: 'object',
                  properties: {
                    canCreate: { type: 'boolean' },
                    canRead: { type: 'boolean' },
                    canUpdate: { type: 'boolean' },
                    canDelete: { type: 'boolean' },
                    canManageUsers: { type: 'boolean' },
                    canViewAllDocuments: { type: 'boolean' },
                    canArchiveDocuments: { type: 'boolean' },
                    workspaceAccess: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authenticatedUser = (request as any).user

      // 🔍 Obtener capacidades del usuario autenticado usando el permissionService
      const capabilities = await permissionService.getUserCapabilities(authenticatedUser.id)

      return reply.status(200).send({
        success: true,
        message: 'Current user permissions retrieved successfully',
        data: {
          role: authenticatedUser.role,
          workspace: authenticatedUser.workspace,
          capabilities
        }
      })

    } catch (error: any) {
      console.error('❌ Get my permissions error:', error)

      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        details: 'Failed to retrieve current user permissions'
      })
    }
  })

  // 📊 GET /permissions/matrix - Obtener matriz de permisos del sistema (admin only)
  fastify.get('/permissions/matrix', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get system permissions matrix (admin only)',
      tags: ['Users'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                roles: { type: 'array' },
                workspaces: { type: 'array' },
                permissions: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authenticatedUser = (request as any).user

      // 🔐 Solo administradores pueden ver la matriz completa
      if (authenticatedUser.role !== 'administrador') {
        return reply.status(403).send({
          success: false,
          error: 'Access denied',
          details: 'Only administrators can view the permissions matrix'
        })
      }

      // 📊 Generar matriz de permisos completa usando el permissionService
      const permissionsMatrix = permissionService.generatePermissionsMatrix()

      return reply.status(200).send({
        success: true,
        message: 'Permissions matrix retrieved successfully',
        data: permissionsMatrix
      })

    } catch (error: any) {
      console.error('❌ Get permissions matrix error:', error)

      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        details: 'Failed to retrieve permissions matrix'
      })
    }
  })
}

// 🎯 Exportar como plugin de Fastify
export const permissionsRoute = fp(permissionsRoutePlugin, {
  name: 'user-permissions-routes'
})
