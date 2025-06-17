import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { userService } from '../../services/userService'
import { z } from 'zod'

// 📋 Schema de validación para parámetros
const paramsSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
})

type DeleteParams = z.infer<typeof paramsSchema>

// 🗑️ Ruta para eliminar usuarios
async function deleteRoutePlugin(fastify: FastifyInstance): Promise<void> {
  fastify.delete<{ 
    Params: DeleteParams
  }>('/:id', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Delete a user permanently (admin only)',
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
                    email: { type: 'string' },
                    role: { type: 'string' },
                    workspace: { type: 'string' }
                  }
                },
                deletedAt: { type: 'string' },
                deletedBy: {
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
        404: {
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

    handler: async (request: FastifyRequest<{ 
      Params: DeleteParams
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

        // 🔍 Verificar que el usuario objetivo existe
        const targetUser = await userService.getUserById(targetUserId)
        if (!targetUser) {
          return reply.status(404).send({
            success: false,
            error: 'User not found',
            details: `No user found with ID: ${targetUserId}`
          })
        }

        // 🔐 Verificar permisos de eliminación
        const canDelete = await validateDeletePermissions(
          authenticatedUser,
          targetUser
        )

        if (!canDelete.allowed) {
          return reply.status(403).send({
            success: false,
            error: 'Permission denied',
            details: canDelete.reason
          })
        }

        // 📊 Guardar información para respuesta antes de eliminar
        const userInfo = {
          id: targetUser.id,
          fullName: targetUser.fullName,
          email: targetUser.email,
          role: targetUser.role,
          workspace: targetUser.workspace
        }

        // 🗑️ Eliminar usuario
        await userService.deleteUser(targetUserId, authenticatedUser.id)

        // ✅ Respuesta exitosa
        return reply.status(200).send({
          success: true,
          message: `User ${userInfo.fullName} deleted successfully`,
          data: {
            user: userInfo,
            deletedAt: new Date().toISOString(),
            deletedBy: {
              id: authenticatedUser.id,
              fullName: authenticatedUser.fullName,
              role: authenticatedUser.role
            }
          }
        })

      } catch (error: any) {
        console.error('❌ Delete user error:', error)

        // Manejo de errores específicos
        if (error.message.includes('Cannot delete yourself')) {
          return reply.status(400).send({
            success: false,
            error: 'Self-deletion not allowed',
            details: 'You cannot delete your own account'
          })
        }

        if (error.message.includes('Cannot delete another administrator')) {
          return reply.status(403).send({
            success: false,
            error: 'Administrator protection',
            details: 'Administrators cannot delete other administrators'
          })
        }

        if (error.message.includes('has active documents')) {
          return reply.status(400).send({
            success: false,
            error: 'User has active content',
            details: 'Cannot delete user with active documents. Archive or reassign documents first.'
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to delete user'
        })
      }
    }
  })
}

// 🎯 Exportar como plugin de Fastify
export const deleteRoute = fp(deleteRoutePlugin, {
  name: 'user-delete-routes'
})

// 🔐 Función para validar permisos de eliminación
async function validateDeletePermissions(
  authenticatedUser: any,
  targetUser: any
): Promise<{ allowed: boolean; reason?: string }> {
  
  // 🚫 No puede eliminarse a sí mismo
  if (authenticatedUser.id === targetUser.id) {
    return { 
      allowed: false, 
      reason: 'You cannot delete your own account' 
    }
  }

  // 🔐 Administradores pueden eliminar usuarios no-administradores
  if (authenticatedUser.role === 'administrador') {
    if (targetUser.role === 'administrador') {
      return { 
        allowed: false, 
        reason: 'Administrators cannot delete other administrators' 
      }
    }
    return { allowed: true }
  }

  // 👑 Presidentes pueden eliminar usuarios no-administradores
  if (authenticatedUser.role === 'presidente') {
    if (targetUser.role === 'administrador') {
      return { 
        allowed: false, 
        reason: 'Presidents cannot delete administrators' 
      }
    }
    return { allowed: true }
  }

  // 🚫 Otros roles no pueden eliminar usuarios
  return { 
    allowed: false, 
    reason: `Users with role ${authenticatedUser.role} cannot delete users` 
  }
} 