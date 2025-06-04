import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { userService, UpdateUserData } from '../../services/userService'
import { UserRole, WorkspaceType } from '../../generated/prisma'
import { z } from 'zod'

// 📋 Schema de validación para parámetros
const paramsSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
})

// 📋 Schema de validación para actualizar usuario
const updateUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long').optional(),
  role: z.nativeEnum(UserRole).optional(),
  workspace: z.nativeEnum(WorkspaceType).optional(),
  isActive: z.boolean().optional(),
  preferences: z.record(z.any()).optional()
})

type UpdateParams = z.infer<typeof paramsSchema>
type UpdateBody = z.infer<typeof updateUserSchema>

// ✏️ Ruta para actualizar usuarios
async function updateRoutePlugin(fastify: FastifyInstance): Promise<void> {
  fastify.put<{ 
    Params: UpdateParams, 
    Body: UpdateBody 
  }>('/:id', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Update a user (admin can update any user, users can update themselves)',
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
      body: {
        type: 'object',
        properties: {
          fullName: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'User full name'
          },
          role: {
            type: 'string',
            enum: Object.values(UserRole),
            description: 'User role (admin only)'
          },
          workspace: {
            type: 'string',
            enum: Object.values(WorkspaceType),
            description: 'User workspace (admin only)'
          },
          isActive: {
            type: 'boolean',
            description: 'User active status (admin only)'
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
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' }
                  }
                },
                updatedBy: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    fullName: { type: 'string' },
                    role: { type: 'string' }
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
  }, async (request: FastifyRequest<{ 
    Params: UpdateParams, 
    Body: UpdateBody 
  }>, reply: FastifyReply) => {
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

      // 📋 Validar body
      const bodyValidation = updateUserSchema.safeParse(request.body)
      if (!bodyValidation.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: bodyValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        })
      }

      const updateData = bodyValidation.data

      // 🔍 Verificar que el usuario objetivo existe
      const targetUser = await userService.getUserById(targetUserId)
      if (!targetUser) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
          details: `No user found with ID: ${targetUserId}`
        })
      }

      // 🔐 Verificar permisos de actualización
      const canUpdate = await validateUpdatePermissions(
        authenticatedUser,
        targetUser,
        updateData
      )

      if (!canUpdate.allowed) {
        return reply.status(403).send({
          success: false,
          error: 'Permission denied',
          details: canUpdate.reason
        })
      }

      // 🔍 Filtrar datos según permisos
      const filteredUpdateData = filterUpdateDataByPermissions(
        authenticatedUser,
        updateData
      )

      // ✏️ Actualizar usuario
      const updatedUser = await userService.updateUser(
        targetUserId,
        filteredUpdateData,
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
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString()
      }

      // ✅ Respuesta exitosa
      return reply.status(200).send({
        success: true,
        message: `User updated successfully`,
        data: {
          user: responseUser,
          updatedBy: {
            id: authenticatedUser.id,
            fullName: authenticatedUser.fullName,
            role: authenticatedUser.role
          }
        }
      })

    } catch (error: any) {
      console.error('❌ Update user error:', error)

      // 🚨 Error de validación
      if (error.message.includes('validation') || error.message.includes('Invalid')) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.message
        })
      }

      // 🚨 Error de base de datos
      if (error.message.includes('Database') || error.message.includes('Prisma')) {
        return reply.status(500).send({
          success: false,
          error: 'Database error',
          details: 'Failed to update user in database'
        })
      }

      // 🚨 Error general
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        details: 'An unexpected error occurred while updating the user'
      })
    }
  })

  // 🔐 Ruta adicional para cambiar contraseña
  fastify.put<{
    Params: { id: string },
    Body: { currentPassword: string, newPassword: string }
  }>('/:id/password', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Change user password (users can change their own password)',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
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
          }
        },
        required: ['currentPassword', 'newPassword']
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
    }
  }, async (request: FastifyRequest<{
    Params: { id: string },
    Body: { currentPassword: string, newPassword: string }
  }>, reply: FastifyReply) => {
    try {
      const authenticatedUser = (request as any).user
      const { id: targetUserId } = request.params
      const { currentPassword, newPassword } = request.body

      // 🔐 Solo el propio usuario puede cambiar su contraseña
      if (authenticatedUser.id !== targetUserId) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied',
          details: 'You can only change your own password'
        })
      }

      // 🔐 Cambiar contraseña
      await userService.changePassword(targetUserId, {
        currentPassword,
        newPassword
      })

      return reply.status(200).send({
        success: true,
        message: 'Password changed successfully'
      })

    } catch (error: any) {
      console.error('❌ Change password error:', error)

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
  })
}

// 🎯 Exportar como plugin de Fastify
export const updateRoute = fp(updateRoutePlugin, {
  name: 'user-update-routes'
})

// 🔐 Función para validar permisos de actualización
async function validateUpdatePermissions(
  authenticatedUser: any,
  targetUser: any,
  updateData: UpdateBody
): Promise<{ allowed: boolean; reason?: string }> {
  
  // 🔐 Administradores pueden actualizar cualquier usuario
  if (authenticatedUser.role === 'administrador') {
    return { allowed: true }
  }

  // 👤 Los usuarios solo pueden actualizar sus propios datos
  if (authenticatedUser.id !== targetUser.id) {
    return {
      allowed: false,
      reason: 'You can only update your own profile'
    }
  }

  // 🚫 Los usuarios normales no pueden cambiar role, workspace o isActive
  if (updateData.role || updateData.workspace || updateData.isActive !== undefined) {
    return {
      allowed: false,
      reason: 'You cannot change role, workspace, or active status. Contact an administrator.'
    }
  }

  return { allowed: true }
}

// 🔍 Función para filtrar datos según permisos
function filterUpdateDataByPermissions(
  authenticatedUser: any,
  updateData: UpdateBody
): UpdateUserData {
  // 🔐 Administradores pueden actualizar todo
  if (authenticatedUser.role === 'administrador') {
    return updateData
  }

  // 👤 Usuarios normales solo pueden actualizar datos básicos
  return {
    fullName: updateData.fullName,
    preferences: updateData.preferences
  }
}
