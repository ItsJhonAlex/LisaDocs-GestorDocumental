import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'

// 🔧 Configuración y utilidades
import prisma from './config/database'

// 🛡️ Middlewares
import { authMiddleware } from './middleware/auth'
import { errorHandler, notFoundHandler, uncaughtErrorHandler, unhandledRejectionHandler } from './middleware/errorHandler'
import { loggingMiddleware } from './middleware/logging'

// 🚦 Rutas principales
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { workspaceRoutes } from './routes/workspaces'
import { documentRoutes } from './routes/documents'
import { notificationRoutes } from './routes/notifications'
import { adminRoutes } from './routes/admin'

// 📊 Servicios
import { auditService } from './services/auditService'

// 📋 Interfaces del servidor
interface ServerContext {
  server: FastifyInstance
  isShuttingDown: boolean
}

// 🏭 Crear y configurar la instancia de Fastify
async function createServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      } : undefined
    },
    trustProxy: true,
    maxParamLength: 200,
    bodyLimit: parseInt(process.env.MAX_BODY_SIZE || '10485760'), // 10MB por defecto
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'), // 30 segundos
    keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT || '5000'), // 5 segundos
    connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT || '0'), // Sin timeout por defecto
  })

  // 🛡️ Configurar seguridad y CORS
  await server.register(cors, {
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',')
      
      // Permitir requests sin origin (mobile apps, etc.)
      if (!origin) return callback(null, true)
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        return callback(null, true)
      }
      
      return callback(new Error('Not allowed by CORS'), false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })

  // 📁 Configurar multipart para uploads
  await server.register(multipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: parseInt(process.env.MAX_FIELD_SIZE || '1048576'), // 1MB
      fields: 10,
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
      files: 5,
      headerPairs: 2000
    }
  })

  // 📝 Configurar logging
  await server.register(loggingMiddleware)

  // 🔐 Configurar autenticación
  await server.register(authMiddleware)

  // ❌ Configurar manejo de errores
  server.setErrorHandler(errorHandler)
  server.setNotFoundHandler(notFoundHandler)

  // 🏠 Ruta de salud del sistema
  server.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            environment: { type: 'string' },
            version: { type: 'string' },
            services: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: await checkDatabaseHealth(),
        cache: 'healthy', // TODO: Implementar verificación de cache
        storage: 'healthy' // TODO: Implementar verificación de storage
      }
    }

    return reply.code(200).send(healthStatus)
  })

  // 📊 Ruta de información del sistema
  server.get('/info', {
    schema: {
      description: 'System information endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' },
            environment: { type: 'string' },
            nodeVersion: { type: 'string' },
            documentation: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return reply.code(200).send({
      name: 'LisaDocs API',
      version: '1.0.0',
      description: 'Sistema de Gestión Documental - API REST',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      documentation: process.env.NODE_ENV === 'development' ? '/docs' : 'Contact administrator for documentation'
    })
  })

  // 🚦 Registrar todas las rutas principales
  await server.register(authRoutes, { prefix: '/api/auth' })
  await server.register(userRoutes, { prefix: '/api/users' })
  await server.register(workspaceRoutes, { prefix: '/api/workspaces' })
  await server.register(documentRoutes, { prefix: '/api/documents' })
  await server.register(notificationRoutes, { prefix: '/api/notifications' })
  await server.register(adminRoutes, { prefix: '/api/admin' })

  // 🎣 Hooks globales
  server.addHook('onRequest', async (request, reply) => {
    (request as any).startTime = Date.now()
  })

  server.addHook('onResponse', async (request, reply) => {
    const responseTime = Date.now() - ((request as any).startTime || Date.now())
    
    // 📊 Log de respuesta para requests largos
    if (responseTime > 1000) {
      server.log.warn({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime
      }, 'Slow request detected')
    }

    // 📝 Auditoría para endpoints sensibles
    if (isSensitiveEndpoint(request.url)) {
      const user = (request as any).user
      if (user) {
        auditService.logAuditAction(
          user.id,
          `${request.method.toLowerCase()}_${extractEndpointName(request.url)}`,
          {
            path: request.url,
            method: request.method,
            statusCode: reply.statusCode,
            responseTime,
            userAgent: request.headers['user-agent']
          },
          {
            level: reply.statusCode >= 400 ? 'warning' : 'info',
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'] as string
          }
        ).catch(() => {
          // Ignorar errores de auditoría
        })
      }
    }
  })

  server.addHook('onClose', async (instance) => {
    server.log.info('Server shutting down...')
    // TODO: Limpiar recursos, cerrar conexiones, etc.
  })

  return server
}

// 🔧 Funciones auxiliares

async function checkDatabaseHealth(): Promise<string> {
  try {
    // Verificación básica de conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`
    return 'healthy'
  } catch (error) {
    return 'unhealthy'
  }
}

function isSensitiveEndpoint(url: string): boolean {
  const sensitivePatterns = [
    '/api/auth',
    '/api/admin',
    '/api/users',
    '/api/notifications/create'
  ]
  
  return sensitivePatterns.some(pattern => url.includes(pattern))
}

function extractEndpointName(url: string): string {
  const segments = url.split('/').filter(Boolean)
  return segments.slice(-1)[0] || 'unknown'
}

// 🚀 Función principal para iniciar el servidor
async function startServer(): Promise<ServerContext> {
  try {
    // 🔧 Configurar manejadores de errores globales
    process.on('uncaughtException', uncaughtErrorHandler)
    process.on('unhandledRejection', unhandledRejectionHandler)

    // 🏗️ Crear servidor
    const server = await createServer()
    
    // 🚀 Iniciar servidor
    const port = parseInt(process.env.PORT || '3000')
    const host = process.env.HOST || '0.0.0.0'
    
    await server.listen({ 
      port, 
      host: process.env.NODE_ENV === 'production' ? host : 'localhost'
    })

    const context: ServerContext = {
      server,
      isShuttingDown: false
    }

    // 📢 Log de inicio exitoso
    server.log.info({
      port,
      host,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      docs: process.env.NODE_ENV === 'development' ? `http://localhost:${port}/docs` : null
    }, '🚀 LisaDocs API Server started successfully!')

    // 🛑 Configurar shutdown graceful
    const gracefulShutdown = async (signal: string) => {
      if (context.isShuttingDown) {
        server.log.warn(`Received ${signal} again, forcing exit...`)
        process.exit(1)
      }

      context.isShuttingDown = true
      server.log.info(`Received ${signal}, starting graceful shutdown...`)

      try {
        // ⏱️ Dar tiempo para que terminen las requests activas
        await server.close()
        server.log.info('✅ Server closed successfully')
        process.exit(0)
      } catch (error) {
        server.log.error(error, '❌ Error during graceful shutdown')
        process.exit(1)
      }
    }

    // 🎯 Registrar señales de shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    return context

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// 🎯 Función para desarrollo con hot reload
async function startDevelopmentServer(): Promise<void> {
  const context = await startServer()
  
  // 🔄 Watch para cambios en desarrollo
  if (process.env.NODE_ENV === 'development') {
    context.server.log.info('🔄 Development mode: Hot reload enabled')
    
    // TODO: Implementar hot reload si es necesario
    // Fastify no tiene hot reload built-in, se puede usar nodemon externamente
  }
}

// 🎯 Función para producción
async function startProductionServer(): Promise<void> {
  const context = await startServer()
  
  // 📊 Log de información de producción
  context.server.log.info({
    pid: process.pid,
    ppid: process.ppid,
    platform: process.platform,
    arch: process.arch,
    memory: process.memoryUsage(),
    versions: process.versions
  }, '📊 Production server information')

  // 🔍 Monitor de salud del proceso
  setInterval(() => {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      context.server.log.warn({
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
      }, '⚠️ High memory usage detected')
    }

    context.server.log.debug({
      uptime: Math.round(process.uptime()),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      }
    }, '📊 Process health check')
  }, 60000) // Cada minuto
}

// 🚀 Punto de entrada principal
async function main(): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'production') {
      await startProductionServer()
    } else {
      await startDevelopmentServer()
    }
  } catch (error) {
    console.error('💥 Fatal error starting application:', error)
    process.exit(1)
  }
}

// 🎯 Exportar para testing y uso externo
export { createServer, startServer, ServerContext }

// 🚀 Ejecutar si es el archivo principal
if (require.main === module) {
  main()
}