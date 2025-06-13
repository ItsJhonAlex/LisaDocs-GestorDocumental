import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { authRoutes } from './auth'
import { documentRoutes } from './documents'
import { userRoutes } from './users'
import { workspaceRoutes } from './workspaces'
import { reportsRoutes } from './reports'

// 🚀 Plugin principal para todas las rutas de la API
export async function routes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  
  // 🔐 Rutas de autenticación
  await fastify.register(authRoutes, { prefix: '/auth' })
  
  // 📄 Rutas de documentos
  await fastify.register(documentRoutes, { prefix: '' })
  
  // 👥 Rutas de usuarios
  await fastify.register(userRoutes, { prefix: '' })
  
  // 🏢 Rutas de workspaces
  await fastify.register(workspaceRoutes, { prefix: '' })
  
  // 📊 Rutas de reportes
  await fastify.register(reportsRoutes, { prefix: '' })

  // 🎯 Log de rutas registradas
  fastify.log.info({
    modules: {
      auth: 'Authentication routes registered at /api/auth',
      documents: 'Document routes registered at /api/documents',
      users: 'User routes registered at /api/users',
      workspaces: 'Workspace routes registered at /api/workspaces',
      reports: 'Report routes registered at /api/reports'
    }
  }, '🚀 All API routes registered successfully')
}
