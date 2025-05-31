import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { refreshTokenSchema, RefreshTokenInput } from '../../schemas/auth';
import { authService } from '../../services/authService';

/**
 * 🔄 POST /auth/refresh - Renovar tokens
 * Permite renovar el access token usando un refresh token válido
 */
export async function refreshRoute(fastify: FastifyInstance) {
  
  fastify.post<{
    Body: RefreshTokenInput
  }>('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            minLength: 1
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
                    lastLoginAt: { type: 'string', nullable: true }
                  }
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'string' }
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
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: RefreshTokenInput }>, reply: FastifyReply) => {
    
    try {
      // 🔍 Validar datos de entrada
      const validationResult = refreshTokenSchema.safeParse(request.body);
      
      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          )
        });
      }

      const refreshData = validationResult.data;

      // 🔄 Intentar renovar tokens
      const result = await authService.refreshToken(refreshData);

      if (!result.success) {
        const statusCode = result.error?.code === 'INVALID_REFRESH_TOKEN' ? 401 : 400;
        
        return reply.status(statusCode).send({
          success: false,
          message: result.message,
          error: result.error
        });
      }

      // ✅ Renovación exitosa
      fastify.log.info({
        userId: result.data?.user.id,
        email: result.data?.user.email,
        role: result.data?.user.role,
        workspace: result.data?.user.workspace
      }, '✅ Tokens renovados exitosamente');

      return reply.status(200).send({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      fastify.log.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        body: request.body
      }, '🚨 Error en renovación de tokens');

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
