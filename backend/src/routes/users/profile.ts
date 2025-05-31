import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { userService } from '../../services/userService'
import { z } from 'zod'

// 📋 Schema de validación para actualizar perfil
const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long').optional(),
  preferences: z.record(z.any()).optional()
})

type UpdateProfileBody = z.infer<typeof updateProfileSchema>

// 👤 Rutas de perfil de usuario
export async function profileRoute(fastify: FastifyInstance): Promise<void> {
  
  // 📄 GET /users/profile - Obtener perfil del usuario autenticado
  fastify.route({
    method: 'GET',
    url: '/users/profile',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get current user profile',
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
                    email: { type: 'string' },
                    fullName: { type: 'string' },
                    role: { type: 'string' },
                    workspace: { type: 'string' },
                    isActive: { type: 'boolean' },
                    documentsCount: { type: 'number' },
                    lastActivity: { type: 'string' },
                    preferences: { type: 'object' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                    lastLoginAt: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
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

        // 📄 Obtener datos completos del usuario
        const userWithStats = await userService.getUserById(authenticatedUser.id)
        
        if (!userWithStats) {
          return reply.status(404).send({
            success: false,
            error: 'User not found',
            details: 'Current user not found in database'
          })
        }

        // 🎯 Formatear respuesta
        const profileData = {
          id: userWithStats.id,
          email: userWithStats.email,
          fullName: userWithStats.fullName,
          role: userWithStats.role,
          workspace: userWithStats.workspace,
          isActive: userWithStats.isActive,
          documentsCount: userWithStats.documentsCount,
          lastActivity: userWithStats.lastActivity?.toISOString() || null,
          preferences: userWithStats.preferences || {},
          createdAt: userWithStats.createdAt.toISOString(),
          updatedAt: userWithStats.updatedAt.toISOString(),
          lastLoginAt: userWithStats.lastLoginAt?.toISOString() || null
        }

        // ✅ Respuesta exitosa
        return reply.status(200).send({
          success: true,
          message: 'Profile retrieved successfully',
          data: {
            user: profileData
          }
        })

      } catch (error: any) {
        console.error('❌ Get profile error:', error)

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve user profile'
        })
      }
    }
  })

  // ✏️ PUT /users/profile - Actualizar perfil del usuario autenticado
  fastify.route({
    method: 'PUT',
    url: '/users/profile',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Update current user profile',
      tags: ['Users'],
      body: {
        type: 'object',
        properties: {
          fullName: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'User full name'
          },
          preferences: {
            type: 'object',
            description: 'User preferences object'
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
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    fullName: { type: 'string' },
                    role: { type: 'string' },
                    workspace: { type: 'string' },
                    isActive: { type: 'boolean' },
                    preferences: { type: 'object' },
                    updatedAt: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Body: UpdateProfileBody }>, reply: FastifyReply) => {
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

        // 📋 Validar datos de entrada
        const validationResult = updateProfileSchema.safeParse(request.body)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const updateData = validationResult.data

        // ✏️ Actualizar perfil
        const updatedUser = await userService.updateUser(
          authenticatedUser.id,
          updateData,
          authenticatedUser.id
        )

        // 🎯 Formatear respuesta
        const responseUser = {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          workspace: updatedUser.workspace,
          isActive: updatedUser.isActive,
          preferences: updatedUser.preferences || {},
          updatedAt: updatedUser.updatedAt.toISOString()
        }

        // ✅ Respuesta exitosa
        return reply.status(200).send({
          success: true,
          message: 'Profile updated successfully',
          data: {
            user: responseUser
          }
        })

      } catch (error: any) {
        console.error('❌ Update profile error:', error)

        // 🚨 Error de validación
        if (error.message.includes('validation') || error.message.includes('Invalid')) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: error.message
          })
        }

        // 🚨 Error general
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to update profile'
        })
      }
    }
  })

  // 🔐 PUT /users/profile/password - Cambiar contraseña del usuario autenticado
  fastify.route({
    method: 'PUT',
    url: '/users/profile/password',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Change current user password',
      tags: ['Users'],
      body: {
        type: 'object',
        properties: {
          currentPassword: {
            type: 'string',
            description: 'Current password for verification'
          },
          newPassword: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
            description: 'New password'
          },
          confirmPassword: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
            description: 'Confirm new password'
          }
        },
        required: ['currentPassword', 'newPassword', 'confirmPassword']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: { 
        currentPassword: string
        newPassword: string
        confirmPassword: string 
      }
    }>, reply: FastifyReply) => {
      try {
        const authenticatedUser = (request as any).user
        const { currentPassword, newPassword, confirmPassword } = request.body

        // ✅ Verificar que las contraseñas coinciden
        if (newPassword !== confirmPassword) {
          return reply.status(400).send({
            success: false,
            error: 'Password confirmation mismatch',
            details: 'New password and confirmation password do not match'
          })
        }

        // 🔐 Cambiar contraseña
        await userService.changePassword(authenticatedUser.id, {
          currentPassword,
          newPassword
        })

        return reply.status(200).send({
          success: true,
          message: 'Password changed successfully'
        })

      } catch (error: any) {
        console.error('❌ Change profile password error:', error)

        if (error.message.includes('incorrect')) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid current password',
            details: 'The current password provided is incorrect'
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to change password'
        })
      }
    }
  })

  // 📊 GET /users/profile/activity - Obtener actividad del usuario
  fastify.route({
    method: 'GET',
    url: '/users/profile/activity',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get current user activity summary',
      tags: ['Users'],
      querystring: {
        type: 'object',
        properties: {
          limit: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 50, 
            default: 10,
            description: 'Number of recent activities to return' 
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
                documentsCreated: { type: 'number' },
                recentDocuments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      status: { type: 'string' },
                      createdAt: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: { limit?: number }
    }>, reply: FastifyReply) => {
      try {
        const authenticatedUser = (request as any).user
        const limit = request.query.limit || 10

        // 📊 Obtener estadísticas y documentos recientes
        // TODO: Implementar servicio para obtener actividad del usuario
        
        // Por ahora retornamos datos básicos
        return reply.status(200).send({
          success: true,
          message: 'User activity retrieved successfully',
          data: {
            documentsCreated: 0,
            recentDocuments: []
          }
        })

      } catch (error: any) {
        console.error('❌ Get profile activity error:', error)

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve user activity'
        })
      }
    }
  })
}
