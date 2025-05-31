import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { listRoute } from './list'
import { createRoute } from './create'
import { updateRoute } from './update'
import { profileRoute } from './profile'
import { permissionsRoute } from './permissions'

// 👥 Plugin principal para rutas de usuarios
export async function userRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  
  // 📋 GET /users - Listar usuarios con filtros (admin)
  // 📊 GET /users/stats - Estadísticas de usuarios (admin)
  await fastify.register(listRoute)
  
  // 👤 POST /users - Crear nuevo usuario (admin)
  await fastify.register(createRoute)
  
  // ✏️ PUT /users/:id - Actualizar usuario
  // 🔐 PUT /users/:id/password - Cambiar contraseña
  await fastify.register(updateRoute)
  
  // 👤 GET /users/profile - Obtener perfil del usuario autenticado
  // ✏️ PUT /users/profile - Actualizar perfil del usuario autenticado
  // 🔐 PUT /users/profile/password - Cambiar contraseña del usuario autenticado
  // 📊 GET /users/profile/activity - Actividad del usuario
  await fastify.register(profileRoute)
  
  // 🔍 GET /users/:id/permissions - Obtener permisos de un usuario
  // 🔍 GET /users/permissions/my - Obtener permisos del usuario autenticado
  // 📊 GET /users/permissions/matrix - Matriz de permisos del sistema (admin)
  await fastify.register(permissionsRoute)

  // 🎯 Información sobre las rutas registradas
  fastify.log.info({
    routes: {
      list: 'GET /api/users - List users with filters (admin)',
      stats: 'GET /api/users/stats - User statistics (admin)',
      create: 'POST /api/users - Create new user (admin)',
      updateUser: 'PUT /api/users/:id - Update user',
      changePassword: 'PUT /api/users/:id/password - Change user password',
      getProfile: 'GET /api/users/profile - Get current user profile',
      updateProfile: 'PUT /api/users/profile - Update current user profile',
      changeProfilePassword: 'PUT /api/users/profile/password - Change profile password',
      profileActivity: 'GET /api/users/profile/activity - User activity',
      getUserPermissions: 'GET /api/users/:id/permissions - Get user permissions',
      getMyPermissions: 'GET /api/users/permissions/my - Get current user permissions',
      permissionsMatrix: 'GET /api/users/permissions/matrix - Permissions matrix (admin)'
    }
  }, '👥 User routes registered successfully')
}
