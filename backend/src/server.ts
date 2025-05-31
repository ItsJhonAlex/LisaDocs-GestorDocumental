import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import jwt from '@fastify/jwt'
import staticFiles from '@fastify/static'
import path from 'path'
import { authRoutes } from './routes/auth'

// Configuración del servidor
const app = Fastify({
  logger: true
})

// Función principal de configuración
async function buildServer() {
  try {
    // ===== PLUGINS =====
    
    // CORS para el frontend
    await app.register(cors, {
      origin: [
        'http://localhost:5173', // Vite dev server
        'http://localhost:3000', // Por si cambiamos puerto
      ],
      credentials: true
    })

    // JWT para autenticación
    const jwtSecret = process.env.JWT_SECRET || 'tu-super-secreto-jwt-development-key'
    await app.register(jwt, {
      secret: jwtSecret
    })

    // Multipart para upload de archivos
    await app.register(multipart, {
      limits: {
        fileSize: (process.env.MAX_FILE_SIZE_MB ? parseInt(process.env.MAX_FILE_SIZE_MB) : 50) * 1024 * 1024 // MB a bytes
      }
    })

    // Servir archivos estáticos (uploads)
    await app.register(staticFiles, {
      root: path.join(process.cwd(), 'uploads'),
      prefix: '/uploads/'
    })

    // ===== HOOKS =====
    
    // Hook de autenticación (se ejecutará para rutas protegidas)
    app.decorate('authenticate', async function(request: any, reply: any) {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    })

    // ===== RUTAS =====
    
    // Ruta de salud
    app.get('/health', async (request, reply) => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'lisadocs-backend'
      }
    })

    // Ruta de prueba
    app.get('/', async (request, reply) => {
      return { 
        message: '🚀 LisaDocs API - Sistema de Gestión Documental',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          auth: '/api/auth/*',
          documents: '/api/documents/*',
          users: '/api/users/*'
        }
      }
    })

    // 🔐 Registrar rutas de autenticación
    await app.register(authRoutes, { prefix: '/api' })
    
    // TODO: Registrar otras rutas cuando las creemos
    // await app.register(documentRoutes, { prefix: '/api/documents' })
    // await app.register(userRoutes, { prefix: '/api/users' })

    return app

  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

// Función de inicio del servidor
async function start() {
  try {
    const server = await buildServer()
    
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001
    const HOST = process.env.HOST || '0.0.0.0'

    await server.listen({ port: PORT, host: HOST })
    
    console.log(`
🚀 LisaDocs Backend iniciado correctamente!

📋 Información del servidor:
   - URL: http://localhost:${PORT}
   - Entorno: ${process.env.NODE_ENV || 'development'}
   - Host: ${HOST}
   
🔗 Endpoints disponibles:
   - Health Check: http://localhost:${PORT}/health
   - API Base: http://localhost:${PORT}/
   - Uploads: http://localhost:${PORT}/uploads/
   
🎯 Frontend: http://localhost:5173
📊 Prisma Studio: pnpm run db:studio
    `)

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error)
    process.exit(1)
  }
}

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
  console.log('⏹️  Cerrando servidor...')
  await app.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('⏹️  Cerrando servidor...')
  await app.close()
  process.exit(0)
})

// Iniciar servidor
if (require.main === module) {
  start()
}

export { buildServer, start }