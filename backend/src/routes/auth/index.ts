import { FastifyInstance } from 'fastify';
import { loginRoute } from './login';
import { registerRoute } from './register';
import { refreshRoute } from './refresh';
import { logoutRoute } from './logout';
import { profileRoutes } from './profile';

/**
 * 🔐 Router principal de autenticación
 * Organiza todas las rutas de auth con middleware y validaciones
 */
export async function authRoutes(fastify: FastifyInstance) {
  // 🔑 POST /login - Login de usuarios
  await fastify.register(loginRoute);
  
  // 👤 POST /register - Registro (solo admin)  
  await fastify.register(registerRoute);
  
  // 🔄 POST /refresh - Renovar tokens
  await fastify.register(refreshRoute);
  
  // 🔓 POST /logout - Cerrar sesión
  await fastify.register(logoutRoute);
  
  // 📋 GET/PUT /profile - Gestión de perfil
  await fastify.register(profileRoutes);

  // 🛡️ Hook global para logging de auth
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/api/auth')) {
      const clientIP = request.headers['x-forwarded-for'] || request.ip;
      const userAgent = request.headers['user-agent'];
      
      fastify.log.info({
        method: request.method,
        url: request.url,
        clientIP,
        userAgent: userAgent?.substring(0, 100) // Truncar user agent
      }, '🔐 Auth request');
    }
  });

  // 🚨 Hook para manejar errores de auth
  fastify.setErrorHandler(async (error, request, reply) => {
    if (request.url.startsWith('/api/auth')) {
      fastify.log.error({
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method
      }, '🚨 Auth error');

      // Respuesta genérica para no exponer detalles internos
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: {
          code: 'INTERNAL_ERROR'
        }
      });
    }
    
    throw error; // Re-lanzar si no es una ruta de auth
  });

  // 📢 Log de éxito
  fastify.log.info({
    message: '[AUTH] Authentication routes registered successfully',
    routes: {
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register', 
      refresh: 'POST /api/auth/refresh',
      logout: 'POST /api/auth/logout',
      profile: 'GET/PUT /api/auth/profile'
    }
  });
}
