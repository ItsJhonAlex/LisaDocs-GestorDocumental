import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { verifyAccessToken, extractTokenFromHeader } from '../../utils/jwt';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

// 📋 Schema para cambio de contraseña
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'La contraseña debe tener al menos una minúscula, una mayúscula y un número')
});

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * 🔑 POST /change-password - Cambiar contraseña del usuario
 */
export async function changePasswordRoutes(fastify: FastifyInstance) {
  
  fastify.post<{
    Body: ChangePasswordInput
  }>('/change-password', {
    schema: {
      body: {
        type: 'object',
        properties: {
          currentPassword: { 
            type: 'string',
            minLength: 1
          },
          newPassword: { 
            type: 'string',
            minLength: 8
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
  }, async (request: FastifyRequest<{ Body: ChangePasswordInput }>, reply: FastifyReply) => {
    
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
      const validationResult = changePasswordSchema.safeParse(request.body);
      
      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          )
        });
      }

      const { currentPassword, newPassword } = validationResult.data;

      // 👤 Obtener usuario actual
      const user = await prisma.user.findUnique({
        where: { id: decodedToken.userId },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          fullName: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return reply.status(401).send({
          success: false,
          message: 'Usuario no encontrado o inactivo',
          error: {
            code: 'USER_NOT_FOUND'
          }
        });
      }

      // 🔍 Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash || '');
      
      if (!isCurrentPasswordValid) {
        fastify.log.warn({
          userId: user.id,
          email: user.email,
          ip: request.ip
        }, '⚠️ Intento de cambio de contraseña con contraseña actual incorrecta');
        
        return reply.status(400).send({
          success: false,
          message: 'La contraseña actual es incorrecta',
          error: {
            code: 'INVALID_CURRENT_PASSWORD'
          }
        });
      }

      // 🚫 Verificar que la nueva contraseña sea diferente
      const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash || '');
      
      if (isSamePassword) {
        return reply.status(400).send({
          success: false,
          message: 'La nueva contraseña debe ser diferente a la actual',
          error: {
            code: 'SAME_PASSWORD'
          }
        });
      }

      // 🔐 Hashear nueva contraseña
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // 💾 Actualizar contraseña en la base de datos
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedNewPassword,
          updatedAt: new Date()
        }
      });

      // ✅ Contraseña cambiada exitosamente
      fastify.log.info({
        userId: user.id,
        email: user.email,
        ip: request.ip,
        userAgent: request.headers['user-agent']?.substring(0, 100)
      }, '✅ Contraseña cambiada exitosamente');

      return reply.status(200).send({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });

    } catch (error) {
      fastify.log.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: request.body ? 'masked' : 'unknown'
      }, '🚨 Error cambiando contraseña');

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