import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { userService, CreateUserData } from '../../services/userService'
import { permissionService } from '../../services/permissionService'
import { UserRole, WorkspaceType } from '../../generated/prisma'
import { z } from 'zod'

// 📋 Schema de validación para crear usuario
const createUserSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long'),
  role: z.nativeEnum(UserRole, { 
    errorMap: () => ({ message: 'Invalid role. Must be one of the allowed roles.' }) 
  }),
  workspace: z.nativeEnum(WorkspaceType, { 
    errorMap: () => ({ message: 'Invalid workspace. Must be one of the allowed workspaces.' }) 
  }),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  isActive: z.boolean().optional().default(true),
  preferences: z.record(z.any()).optional(),
  sendWelcomeEmail: z.boolean().optional().default(false)
})

type CreateUserBody = z.infer<typeof createUserSchema>

// 👤 Ruta para crear usuarios
export async function createRoute(fastify: FastifyInstance): Promise<void> {
  fastify.route({
    method: 'POST',
    url: '/users',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Create a new user (admin only)',
      tags: ['Users'],
      body: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            description: 'User email address (must be unique)'
          },
          fullName: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'User full name'
          },
          role: {
            type: 'string',
            enum: Object.values(UserRole),
            description: 'User role in the system'
          },
          workspace: {
            type: 'string',
            enum: Object.values(WorkspaceType),
            description: 'User workspace assignment'
          },
          password: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
            description: 'User password (will be hashed)'
          },
          isActive: {
            type: 'boolean',
            default: true,
            description: 'Whether the user is active'
          },
          preferences: {
            type: 'object',
            description: 'User preferences object'
          },
          sendWelcomeEmail: {
            type: 'boolean',
            default: false,
            description: 'Send welcome email to new user'
          }
        },
        required: ['email', 'fullName', 'role', 'workspace', 'password']
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
                createdBy: {
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
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
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

        // 🔐 Verificar que es administrador
        if (authenticatedUser.role !== 'administrador') {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'Only administrators can create users'
          })
        }

        // 📋 Validar datos de entrada
        const validationResult = createUserSchema.safeParse(request.body)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const userData = validationResult.data

        // 🔍 Validaciones adicionales
        // Verificar que el workspace es apropiado para el rol
        const isValidRoleWorkspaceCombination = permissionService.validateRoleWorkspaceCombination(userData.role, userData.workspace)
        if (!isValidRoleWorkspaceCombination.valid) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid role-workspace combination',
            details: isValidRoleWorkspaceCombination.reason
          })
        }

        // 👤 Crear usuario
        const newUser = await userService.createUser(userData, authenticatedUser.id)

        // 🎯 Formatear respuesta (sin datos sensibles)
        const responseUser = {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          workspace: newUser.workspace,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt.toISOString(),
          updatedAt: newUser.updatedAt.toISOString()
        }

        // ✅ Respuesta exitosa
        return reply.status(201).send({
          success: true,
          message: `User created successfully: ${newUser.email}`,
          data: {
            user: responseUser,
            createdBy: {
              id: authenticatedUser.id,
              fullName: authenticatedUser.fullName,
              role: authenticatedUser.role
            }
          }
        })

      } catch (error: any) {
        console.error('❌ Create user error:', error)

        // 🚨 Error de email duplicado
        if (error.message.includes('Email already exists')) {
          return reply.status(409).send({
            success: false,
            error: 'Email already exists',
            details: 'A user with this email address already exists'
          })
        }

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
            details: 'Failed to create user in database'
          })
        }

        // 🚨 Error general
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred while creating the user'
        })
      }
    }
  })
}
