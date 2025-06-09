import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { updateProfileSchema, UpdateProfileInput } from '../../schemas/auth';
import { authService } from '../../services/authService';
import { verifyAccessToken, extractTokenFromHeader } from '../../utils/jwt';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

/**
 * 📋 GET/PUT /auth/profile - Gestión de perfil de usuario
 * Permite obtener y actualizar el perfil del usuario autenticado
 */
export async function profileRoutes(fastify: FastifyInstance) {
  
  // 📋 GET /auth/profile - Obtener perfil del usuario
  fastify.get('/profile', {
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
                id: { type: 'string' },
                email: { type: 'string' },
                fullName: { type: 'string' },
                role: { type: 'string' },
                workspace: { type: 'string' },
                isActive: { type: 'boolean' },
                lastLoginAt: { type: 'string', nullable: true },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                preferences: {
                  type: 'object',
                  properties: {
                    theme: { type: 'string' },
                    language: { type: 'string' },
                    notifications: { type: 'object' },
                    dashboard: { type: 'object' }
                  }
                },
                permissions: {
                  type: 'object',
                  properties: {
                    canView: { type: 'array', items: { type: 'string' } },
                    canDownload: { type: 'array', items: { type: 'string' } },
                    canArchive: { type: 'array', items: { type: 'string' } },
                    canManage: { type: 'array', items: { type: 'string' } }
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
            message: { type: 'string' },
            error: { type: 'object' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    
    try {
      // 🔐 Verificar autenticación
      const token = extractTokenFromHeader(request.headers.authorization);
      
      if (!token) {
        return reply.status(401).send({
          success: false,
          message: 'Token de autenticación requerido',
          error: {
            code: 'MISSING_TOKEN'
          }
        });
      }

      let decodedToken;
      try {
        decodedToken = verifyAccessToken(token);
      } catch (error) {
        return reply.status(401).send({
          success: false,
          message: 'Token inválido o expirado',
          error: {
            code: 'INVALID_TOKEN'
          }
        });
      }

      // 👤 Obtener perfil completo
      const userProfile = await authService.getUserProfile(decodedToken.userId);

      if (!userProfile) {
        return reply.status(404).send({
          success: false,
          message: 'Usuario no encontrado o inactivo',
          error: {
            code: 'USER_NOT_FOUND'
          }
        });
      }

      // 📊 Obtener información adicional del usuario
      const fullUser = await prisma.user.findUnique({
        where: { id: decodedToken.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          workspace: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          preferences: true
        }
      });

      if (!fullUser) {
        return reply.status(404).send({
          success: false,
          message: 'Usuario no encontrado',
          error: {
            code: 'USER_NOT_FOUND'
          }
        });
      }

      // ✅ Perfil obtenido exitosamente
      fastify.log.info({
        userId: userProfile.id,
        email: userProfile.email,
        role: userProfile.role
      }, '✅ Perfil obtenido exitosamente');

      return reply.status(200).send({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: {
          ...fullUser,
          permissions: userProfile.permissions
        }
      });

    } catch (error) {
      fastify.log.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, '🚨 Error obteniendo perfil');

      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: {
          code: 'INTERNAL_ERROR'
        }
      });
    }
  });

  // 📝 PUT /auth/profile - Actualizar perfil del usuario
  fastify.put<{
    Body: UpdateProfileInput
  }>('/profile', {
    schema: {
      body: {
        type: 'object',
        properties: {
          fullName: {
            type: 'string',
            minLength: 2,
            maxLength: 255
          },
          preferences: {
            type: 'object',
            properties: {
              theme: {
                type: 'string',
                enum: ['light', 'dark']
              },
              language: {
                type: 'string',
                enum: ['es', 'en']
              },
              notifications: {
                type: 'object',
                properties: {
                  email: { type: 'boolean' },
                  browser: { type: 'boolean' },
                  mobile: { type: 'boolean' }
                }
              },
              dashboard: {
                type: 'object',
                properties: {
                  defaultView: {
                    type: 'string',
                    enum: ['my_documents', 'all_workspaces', 'my_workspace']
                  },
                  itemsPerPage: {
                    type: 'integer',
                    minimum: 10,
                    maximum: 100
                  },
                  showThumbnails: { type: 'boolean' }
                }
              }
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
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: UpdateProfileInput }>, reply: FastifyReply) => {
    
    try {
      // 🔐 Verificar autenticación
      const token = extractTokenFromHeader(request.headers.authorization);
      
      if (!token) {
        return reply.status(401).send({
          success: false,
          message: 'Token de autenticación requerido',
          error: {
            code: 'MISSING_TOKEN'
          }
        });
      }

      let decodedToken;
      try {
        decodedToken = verifyAccessToken(token);
      } catch (error) {
        return reply.status(401).send({
          success: false,
          message: 'Token inválido o expirado',
          error: {
            code: 'INVALID_TOKEN'
          }
        });
      }

      // 🔍 Validar datos de entrada
      const validationResult = updateProfileSchema.safeParse(request.body);
      
      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          )
        });
      }

      const updateData = validationResult.data;

      // 📝 Actualizar perfil
      const updatedUser = await prisma.user.update({
        where: { id: decodedToken.userId },
        data: {
          ...(updateData.fullName && { fullName: updateData.fullName }),
          ...(updateData.preferences && { preferences: updateData.preferences }),
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          workspace: true,
          isActive: true,
          preferences: true,
          updatedAt: true
        }
      });

      // ✅ Perfil actualizado exitosamente
      fastify.log.info({
        userId: updatedUser.id,
        email: updatedUser.email,
        updatedFields: Object.keys(updateData)
      }, '✅ Perfil actualizado exitosamente');

      return reply.status(200).send({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedUser
      });

    } catch (error) {
      fastify.log.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        body: request.body
      }, '🚨 Error actualizando perfil');

      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: {
          code: 'INTERNAL_ERROR'
        }
      });
    }
  });
} 