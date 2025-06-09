import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logoutSchema, LogoutInput } from '../../schemas/auth';
import { authService } from '../../services/authService';
import { extractTokenFromHeader } from '../../utils/jwt';

/**
 * 🔓 POST /auth/logout - Cerrar sesión
 * Permite a los usuarios cerrar sesión invalidando sus tokens
 */
export async function logoutRoute(fastify: FastifyInstance) {
  
  fastify.post<{
    Body: LogoutInput
  }>('/logout', {
    schema: {
      body: {
        type: 'object',
        properties: {
          token: {
            type: 'string'
          },
          refreshToken: {
            type: 'string'
          },
          logoutAll: {
            type: 'boolean',
            default: false
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
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
  }, async (request: FastifyRequest<{ Body: LogoutInput }>, reply: FastifyReply) => {
    
    try {
      // 🔍 Obtener token del header Authorization si no se envió en el body
      const headerToken = extractTokenFromHeader(request.headers.authorization);
      const bodyToken = request.body?.token;
      const refreshToken = request.body?.refreshToken;

      const accessToken = bodyToken || headerToken || undefined;

      // ✅ Validar que tengamos al menos un token
      if (!accessToken && !refreshToken) {
        return reply.status(400).send({
          success: false,
          message: 'Se requiere al menos un token (access o refresh)',
          errors: ['token: Se requiere al menos un token (access o refresh)']
        });
      }

      // 🔍 Validar usando el schema (opcional, para tener consistencia)
      const logoutData = {
        token: accessToken,
        refreshToken: refreshToken,
        logoutAll: request.body?.logoutAll || false
      };

      const validationResult = logoutSchema.safeParse(logoutData);
      
      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          )
        });
      }

      // 🔓 Procesar logout
      const result = await authService.logout(logoutData);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: result.message,
          error: {
            code: 'LOGOUT_ERROR'
          }
        });
      }

      // ✅ Logout exitoso
      fastify.log.info({
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        logoutAll: logoutData.logoutAll,
        userAgent: request.headers['user-agent']?.substring(0, 100)
      }, '✅ Usuario deslogueado exitosamente');

      return reply.status(200).send({
        success: true,
        message: result.message
      });

    } catch (error) {
      fastify.log.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        hasToken: !!request.body?.token,
        hasRefreshToken: !!request.body?.refreshToken
      }, '🚨 Error en logout');

      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: {
          code: 'INTERNAL_ERROR'
        }
      });
    }
  });

  // 🔓 Endpoint alternativo: DELETE /logout para RESTful
  fastify.delete('/logout', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
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
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    
    try {
      // 🔍 Obtener token del header
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

      // 🔓 Logout solo con access token
      const result = await authService.logout({ token });

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: result.message,
          error: {
            code: 'LOGOUT_ERROR'
          }
        });
      }

      // ✅ Logout exitoso
      fastify.log.info({
        method: 'DELETE',
        userAgent: request.headers['user-agent']?.substring(0, 100)
      }, '✅ Usuario deslogueado exitosamente (DELETE)');

      return reply.status(200).send({
        success: true,
        message: result.message
      });

    } catch (error) {
      fastify.log.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        method: 'DELETE'
      }, '🚨 Error en logout (DELETE)');

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
