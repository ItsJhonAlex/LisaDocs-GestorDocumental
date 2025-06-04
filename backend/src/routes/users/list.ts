import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { userService } from '../../services/userService'
import { UserRole, WorkspaceType } from '../../generated/prisma'
import { z } from 'zod'

// 📋 Schema de validación para query parameters
const listQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  workspace: z.nativeEnum(WorkspaceType).optional(),
  isActive: z.union([z.string(), z.boolean()]).optional().transform(val => {
    if (typeof val === 'boolean') return val
    if (typeof val === 'string') {
      return val === 'true' ? true : val === 'false' ? false : undefined
    }
    return undefined
  }),
  search: z.string().optional(),
  limit: z.union([z.string(), z.number()]).optional().transform(val => {
    if (typeof val === 'number') return val
    if (typeof val === 'string') return parseInt(val) || 20
    return 20
  }),
  offset: z.union([z.string(), z.number()]).optional().transform(val => {
    if (typeof val === 'number') return val
    if (typeof val === 'string') return parseInt(val) || 0
    return 0
  }),
  orderBy: z.enum(['fullName', 'email', 'createdAt', 'lastLoginAt']).optional().default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc')
})

type ListQuery = z.infer<typeof listQuerySchema>

// 👥 Plugin para rutas de lista de usuarios
async function listRoutePlugin(fastify: FastifyInstance): Promise<void> {
  
  // 📋 GET / - Listar usuarios con filtros (admin)
  fastify.get<{ Querystring: ListQuery }>('/', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get a list of users with filters (admin only)',
      tags: ['Users'],
      querystring: {
        type: 'object',
        properties: {
          role: { 
            type: 'string', 
            enum: Object.values(UserRole),
            description: 'Filter by user role' 
          },
          workspace: { 
            type: 'string', 
            enum: Object.values(WorkspaceType),
            description: 'Filter by user workspace' 
          },
          isActive: { 
            type: ['string', 'boolean'],
            enum: ['true', 'false', true, false],
            description: 'Filter by active status' 
          },
          search: { 
            type: 'string',
            description: 'Search in full name and email' 
          },
          limit: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 100, 
            default: 20,
            description: 'Number of users to return' 
          },
          offset: { 
            type: 'integer', 
            minimum: 0, 
            default: 0,
            description: 'Number of users to skip' 
          },
          orderBy: { 
            type: 'string', 
            enum: ['fullName', 'email', 'createdAt', 'lastLoginAt'],
            default: 'createdAt',
            description: 'Field to order by' 
          },
          orderDirection: { 
            type: 'string', 
            enum: ['asc', 'desc'],
            default: 'desc',
            description: 'Order direction' 
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
                users: {
                  type: 'array',
                  items: {
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
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' }
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
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: ListQuery }>, reply: FastifyReply) => {
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

      // 🔐 Verificar que es administrador
      if (user.role !== 'administrador') {
        return reply.status(403).send({
          success: false,
          error: 'Access denied',
          details: 'Only administrators can list users'
        })
      }

      // 📋 Validar query parameters
      const validationResult = listQuerySchema.safeParse(request.query)
      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid query parameters',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        })
      }

      const filters = validationResult.data

      // 📊 Obtener usuarios
      const result = await userService.getUsers(filters)

      // 📋 Formatear respuesta
      const formattedUsers = result.users.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        workspace: user.workspace,
        isActive: user.isActive,
        documentsCount: user.documentsCount,
        lastActivity: user.lastActivity?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }))

      // ✅ Respuesta exitosa
      return reply.status(200).send({
        success: true,
        message: `Found ${result.total} users`,
        data: {
          users: formattedUsers,
          pagination: {
            total: result.total,
            limit: filters.limit || 20,
            offset: filters.offset || 0,
            hasMore: result.hasMore
          }
        }
      })

    } catch (error: any) {
      console.error('❌ List users error:', error)

      // 🚨 Error de base de datos
      if (error.message.includes('Database') || error.message.includes('Prisma')) {
        return reply.status(500).send({
          success: false,
          error: 'Database error',
          details: 'Failed to retrieve users from database'
        })
      }

      // 🚨 Error general
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        details: 'An unexpected error occurred while retrieving users'
      })
    }
  })

  // 📊 GET /stats - Estadísticas de usuarios
  fastify.get('/stats', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get user statistics (admin only)',
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
                total: { type: 'number' },
                active: { type: 'number' },
                byRole: { type: 'object' },
                byWorkspace: { type: 'object' },
                recent: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 🔐 Verificar autenticación y permisos
      const user = (request as any).user
      if (!user?.id || user.role !== 'administrador') {
        return reply.status(403).send({
          success: false,
          error: 'Access denied',
          details: 'Only administrators can view user statistics'
        })
      }

      const stats = await userService.getUserStats()

      return reply.status(200).send({
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats
      })

    } catch (error: any) {
      console.error('❌ User stats error:', error)
      
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        details: 'Failed to retrieve user statistics'
      })
    }
  })
}

// 🎯 Exportar como plugin de Fastify
export const listRoute = fp(listRoutePlugin, {
  name: 'user-list-routes'
})
