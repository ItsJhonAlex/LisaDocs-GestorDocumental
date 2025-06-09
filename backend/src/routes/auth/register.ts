import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerSchema, RegisterInput } from '../../schemas/auth';
import { authService } from '../../services/authService';
import { verifyAccessToken, extractTokenFromHeader } from '../../utils/jwt';

/**
 * 👤 POST /auth/register - Registro de usuarios (solo admin)
 * Permite a los administradores crear nuevos usuarios en el sistema
 */
export async function registerRoute(fastify: FastifyInstance) {
  
  fastify.post<{
    Body: RegisterInput
  }>('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'fullName', 'role', 'workspace', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email'
          },
          fullName: {
            type: 'string',
            minLength: 2,
            maxLength: 255
          },
          role: {
            type: 'string',
            enum: [
              'administrador', 'presidente', 'vicepresidente', 
              'secretario_cam', 'secretario_ampp', 'secretario_cf', 
              'intendente', 'cf_member'
            ]
          },
          workspace: {
            type: 'string',
            enum: ['presidencia', 'intendencia', 'cam', 'ampp', 'comisiones_cf']
          },
          password: {
            type: 'string',
            minLength: 8,
            maxLength: 128
          }
        }
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
                    isActive: { type: 'boolean' }
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
            error: { type: 'object' }
          }
        },
        403: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
    
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

      // 🛡️ Verificar que el usuario autenticado es admin
      if (decodedToken.role !== 'administrador') {
        return reply.status(403).send({
          success: false,
          message: 'Solo los administradores pueden registrar usuarios',
          error: {
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        });
      }

      // 🔍 Validar datos de entrada
      const validationResult = registerSchema.safeParse(request.body);
      
      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          )
        });
      }

      const registerData = validationResult.data;

      // 👤 Intentar registro
      const result = await authService.register(registerData, decodedToken.userId);

      if (!result.success) {
        const statusCode = result.error?.code === 'EMAIL_ALREADY_EXISTS' ? 409 : 400;
        
        return reply.status(statusCode).send({
          success: false,
          message: result.message,
          error: result.error
        });
      }

      // ✅ Registro exitoso
      fastify.log.info({
        adminId: decodedToken.userId,
        newUserId: result.data?.user.id,
        newUserEmail: result.data?.user.email,
        newUserRole: result.data?.user.role,
        newUserWorkspace: result.data?.user.workspace
      }, '✅ Usuario registrado exitosamente por admin');

      return reply.status(201).send({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      fastify.log.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        body: request.body
      }, '🚨 Error en registro');

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
