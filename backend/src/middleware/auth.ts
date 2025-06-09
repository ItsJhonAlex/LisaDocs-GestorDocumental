import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { verifyAccessToken, extractTokenFromHeader, isTokenBlacklisted } from '../utils/jwt';
import { authService } from '../services/authService';
import { AuthenticatedUser } from '../types/auth';
import { LogMessages } from '../utils/logger';

// Extender el tipo de Request para incluir user y authToken
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
    authUser?: AuthenticatedUser;
    authToken?: string;
  }
  
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * 🔐 Middleware de autenticación JWT principal
 */
async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Extraer token del header
    const token = extractTokenFromHeader(request.headers.authorization);

    if (!token) {
      return reply.status(401).send({
        success: false,
        message: 'Token de acceso requerido',
        error: {
          code: 'NO_TOKEN_PROVIDED'
        }
      });
    }

    // Verificar si el token está en la blacklist
    if (isTokenBlacklisted(token)) {
      return reply.status(401).send({
        success: false,
        message: 'Token inválido o expirado',
        error: {
          code: 'TOKEN_BLACKLISTED'
        }
      });
    }

    // Verificar y decodificar token
    const decoded = verifyAccessToken(token);

    // Obtener perfil completo del usuario
    const userProfile = await authService.getUserProfile(decoded.userId);

    if (!userProfile) {
      return reply.status(401).send({
        success: false,
        message: 'Usuario no encontrado o inactivo',
        error: {
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Agregar user (alias para compatibilidad) y authUser al request
    request.user = userProfile;
    request.authUser = userProfile;
    request.authToken = token;

  } catch (error) {
    let errorMessage = 'Token inválido';
    let errorCode = 'INVALID_TOKEN';

    if (error instanceof Error) {
      if (error.message.includes('expirado')) {
        errorMessage = 'Token expirado';
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.message.includes('inválido')) {
        errorMessage = 'Token inválido';
        errorCode = 'INVALID_TOKEN';
      }
    }

    return reply.status(401).send({
      success: false,
      message: errorMessage,
      error: {
        code: errorCode
      }
    });
  }
}

/**
 * 🎯 Plugin principal de autenticación para Fastify
 */
export const authMiddleware = fp(async function authPlugin(fastify: FastifyInstance) {
  // 🔧 Decorar la instancia de Fastify con el método authenticate
  fastify.decorate('authenticate', authenticate);
  
  // 📝 Log de éxito
  fastify.log.info(LogMessages.authMiddleware());
}, {
  name: 'auth-middleware',
  dependencies: []
});

/**
 * 👑 Middleware opcional de autenticación (no falla si no hay token)
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const token = extractTokenFromHeader(request.headers.authorization);

    if (token && !isTokenBlacklisted(token)) {
      const decoded = verifyAccessToken(token);
      const userProfile = await authService.getUserProfile(decoded.userId);

      if (userProfile) {
        request.authUser = userProfile;
        request.authToken = token;
      }
    }
    
    // No hacer nada si no hay token o es inválido
  } catch (error) {
    // Ignorar errores en autenticación opcional
  }
}

/**
 * 🔒 Middleware para verificar rol específico
 */
export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.authUser) {
      return reply.status(401).send({
        success: false,
        message: 'Autenticación requerida',
        error: {
          code: 'NOT_AUTHENTICATED'
        }
      });
    }

    if (!allowedRoles.includes(request.authUser.role)) {
      return reply.status(403).send({
        success: false,
        message: 'Permisos insuficientes',
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          details: `Se requiere uno de estos roles: ${allowedRoles.join(', ')}`
        }
      });
    }
  };
}

/**
 * 🏢 Middleware para verificar acceso a workspace
 */
export function requireWorkspaceAccess(
  action: 'view' | 'download' | 'upload' | 'archive' | 'manage' = 'view'
) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.authUser) {
      return reply.status(401).send({
        success: false,
        message: 'Autenticación requerida',
        error: {
          code: 'NOT_AUTHENTICATED'
        }
      });
    }

    const workspace = (request.params as any)?.workspace || 
                     (request.body as any)?.workspace ||
                     (request.query as any)?.workspace;

    if (!workspace) {
      return reply.status(400).send({
        success: false,
        message: 'Workspace requerido',
        error: {
          code: 'WORKSPACE_REQUIRED'
        }
      });
    }

    const hasAccess = await authService.canUserPerformAction(
      request.authUser.id,
      action,
      workspace
    );

    if (!hasAccess) {
      return reply.status(403).send({
        success: false,
        message: `Sin permisos para ${action} en el workspace ${workspace}`,
        error: {
          code: 'WORKSPACE_ACCESS_DENIED',
          details: {
            action,
            workspace,
            userRole: request.authUser.role,
            userWorkspace: request.authUser.workspace
          }
        }
      });
    }
  };
}

/**
 * 👤 Middleware para verificar que es el mismo usuario o admin
 */
export function requireSelfOrAdmin() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.authUser) {
      return reply.status(401).send({
        success: false,
        message: 'Autenticación requerida',
        error: {
          code: 'NOT_AUTHENTICATED'
        }
      });
    }

    const targetUserId = (request.params as any)?.userId || 
                        (request.params as any)?.id;

    const isAdmin = request.authUser.role === 'administrador';
    const isSelf = request.authUser.id === targetUserId;

    if (!isAdmin && !isSelf) {
      return reply.status(403).send({
        success: false,
        message: 'Solo puedes acceder a tu propia información o ser administrador',
        error: {
          code: 'ACCESS_DENIED'
        }
      });
    }
  };
}

/**
 * 📊 Middleware para logging de actividades autenticadas
 */
export async function activityLogMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.authUser) {
    // TODO: Implementar logging de actividades
    const activity = {
      userId: request.authUser.id,
      action: request.method,
      path: request.url,
      timestamp: new Date(),
      ip: request.ip,
      userAgent: request.headers['user-agent']
    };

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Activity:', activity);
    }
  }
}

/**
 * ⏱️ Middleware para rate limiting por usuario
 */
const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitByUser(maxRequests: number = 100, windowMs: number = 60000) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.authUser) return; // Solo aplicar rate limit a usuarios autenticados

    const userId = request.authUser.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    const userLimit = userRequestCounts.get(userId);

    if (!userLimit || userLimit.resetTime < windowStart) {
      // Nuevo periodo o usuario
      userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return;
    }

    if (userLimit.count >= maxRequests) {
      return reply.status(429).send({
        success: false,
        message: 'Demasiadas solicitudes. Intenta de nuevo más tarde',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            maxRequests,
            windowMs,
            retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
          }
        }
      });
    }

    userLimit.count++;
  };
}
