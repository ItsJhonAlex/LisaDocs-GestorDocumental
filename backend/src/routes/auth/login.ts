import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loginSchema, LoginInput } from '../../schemas/auth';
import { authService } from '../../services/authService';

/**
 * 🔑 POST /auth/login - Login de usuarios
 * Permite a los usuarios autenticarse en el sistema
 */
export async function loginRoute(fastify: FastifyInstance) {
  
  fastify.post<{
    Body: LoginInput
  }>('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email'
          },
          password: {
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
  }, async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
    
    try {
      // 🔍 Validar datos de entrada
      const validationResult = loginSchema.safeParse(request.body);
      
      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          )
        });
      }

      const credentials = validationResult.data;

      // 🔐 Intentar login
      const result = await authService.login(credentials);

      if (!result.success) {
        const statusCode = result.error?.code === 'INVALID_CREDENTIALS' ? 401 : 400;
        
        return reply.status(statusCode).send({
          success: false,
          message: result.message,
          error: result.error
        });
      }

      // ✅ Login exitoso
      fastify.log.info({
        userId: result.data?.user.id,
        email: result.data?.user.email,
        role: result.data?.user.role,
        workspace: result.data?.user.workspace
      }, '✅ Usuario logueado exitosamente');

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
      }, '🚨 Error en login');

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
