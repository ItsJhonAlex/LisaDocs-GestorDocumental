import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { appConfig } from '../config/app'

// 📊 Interface para el contexto de logging
export interface LogContext {
  requestId: string
  method: string
  url: string
  userAgent?: string
  ip: string
  userId?: string
  startTime: number
  responseTime?: number
  statusCode?: number
  contentLength?: number
}

// 📝 Interface para structured logging
export interface StructuredLog {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context: LogContext
  timestamp: string
  environment: string
  service: string
  version: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// 🎯 Plugin de logging para Fastify
export async function loggingMiddleware(fastify: FastifyInstance): Promise<void> {
  
  // 🔧 Decorar request con contexto de logging
  fastify.decorateRequest('logContext', {} as LogContext)
  
  // 📊 Hook para inicializar logging en cada request
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now()
    const requestId = generateRequestId()
    
    // 🏷️ Crear contexto de logging
    const logContext: LogContext = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      startTime
    }
    
    // 🔗 Agregar contexto al request
    ;(request as any).logContext = logContext
    ;(request as any).startTime = startTime
    
    // 📝 Log de request incoming
    fastify.log.info({
      ...logContext,
      type: 'request_start'
    }, `📥 ${request.method} ${request.url} - ${request.ip}`)
  })
  
  // 📊 Hook para logging en respuestas
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const logContext = (request as any).logContext as LogContext
    const responseTime = Date.now() - logContext.startTime
    
    // 📊 Actualizar contexto con datos de respuesta
    logContext.responseTime = responseTime
    logContext.statusCode = reply.statusCode
    logContext.contentLength = reply.getHeader('content-length') as number || 0
    
    // 👤 Agregar información del usuario si está disponible
    const user = (request as any).user
    if (user) {
      logContext.userId = user.id
    }
    
    // 📝 Determinar nivel de log basado en status code y tiempo de respuesta
    const logLevel = getLogLevel(reply.statusCode, responseTime)
    const logMessage = formatResponseMessage(logContext)
    
    // 🎯 Log estructurado
    const structuredLog: StructuredLog = {
      level: logLevel,
      message: logMessage,
      context: logContext,
      timestamp: new Date().toISOString(),
      environment: appConfig.server.environment,
      service: appConfig.app.name,
      version: appConfig.app.version
    }
    
    // 📊 Log con el nivel apropiado
    fastify.log[logLevel](structuredLog, logMessage)
    
    // ⚠️ Alertas especiales para casos críticos
    if (reply.statusCode >= 500) {
      fastify.log.error({
        ...structuredLog,
        type: 'server_error'
      }, `🚨 Server Error: ${request.method} ${request.url} - ${reply.statusCode}`)
    } else if (responseTime > 5000) { // Más de 5 segundos
      fastify.log.warn({
        ...structuredLog,
        type: 'slow_response'
      }, `🐌 Slow Response: ${request.method} ${request.url} - ${responseTime}ms`)
    }
  })
  
  // ❌ Hook para logging de errores
  fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    const logContext = (request as any).logContext as LogContext
    
    const structuredLog: StructuredLog = {
      level: 'error',
      message: `❌ Request Error: ${error.message}`,
      context: {
        ...logContext,
        responseTime: Date.now() - logContext.startTime,
        statusCode: reply.statusCode || 500
      },
      timestamp: new Date().toISOString(),
      environment: appConfig.server.environment,
      service: appConfig.app.name,
      version: appConfig.app.version,
      error: {
        name: error.name,
        message: error.message,
        stack: appConfig.server.isDevelopment ? error.stack : undefined
      }
    }
    
    fastify.log.error(structuredLog, `❌ ${error.name}: ${error.message}`)
  })
  
  // 🎯 Decorar instancia con funciones de logging personalizadas
  fastify.decorate('logWithContext', logWithContext)
  fastify.decorate('logError', logError)
  fastify.decorate('logAudit', logAudit)
}

// 🔧 Funciones auxiliares

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getLogLevel(statusCode: number, responseTime: number): 'debug' | 'info' | 'warn' | 'error' {
  if (statusCode >= 500) return 'error'
  if (statusCode >= 400) return 'warn'
  if (responseTime > 2000) return 'warn' // Más de 2 segundos
  if (statusCode >= 300) return 'info'
  return 'info'
}

function formatResponseMessage(context: LogContext): string {
  const { method, url, statusCode, responseTime, ip } = context
  const emoji = getStatusEmoji(statusCode!)
  
  return `${emoji} ${method} ${url} - ${statusCode} - ${responseTime}ms - ${ip}`
}

function getStatusEmoji(statusCode: number): string {
  if (statusCode >= 500) return '💥'
  if (statusCode >= 400) return '⚠️'
  if (statusCode >= 300) return '🔄'
  if (statusCode >= 200) return '✅'
  return '📝'
}

// 🎯 Funciones de logging personalizadas

function logWithContext(
  this: FastifyInstance,
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  context: Partial<LogContext> = {}
): void {
  const structuredLog: Partial<StructuredLog> = {
    level,
    message,
    context: context as LogContext,
    timestamp: new Date().toISOString(),
    environment: appConfig.server.environment,
    service: appConfig.app.name,
    version: appConfig.app.version
  }
  
  this.log[level](structuredLog, message)
}

function logError(
  this: FastifyInstance,
  error: Error,
  context: Partial<LogContext> = {},
  additionalInfo: Record<string, any> = {}
): void {
  const structuredLog: StructuredLog = {
    level: 'error',
    message: `Error: ${error.message}`,
    context: context as LogContext,
    timestamp: new Date().toISOString(),
    environment: appConfig.server.environment,
    service: appConfig.app.name,
    version: appConfig.app.version,
    error: {
      name: error.name,
      message: error.message,
      stack: appConfig.server.isDevelopment ? error.stack : undefined
    }
  }
  
  // 📊 Agregar información adicional
  Object.assign(structuredLog, additionalInfo)
  
  this.log.error(structuredLog, `❌ ${error.name}: ${error.message}`)
}

function logAudit(
  this: FastifyInstance,
  action: string,
  userId: string,
  details: Record<string, any> = {},
  context: Partial<LogContext> = {}
): void {
  const auditLog = {
    level: 'info' as const,
    message: `🔍 Audit: ${action}`,
    context: {
      ...context,
      userId,
      type: 'audit'
    },
    audit: {
      action,
      userId,
      details,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString(),
    environment: appConfig.server.environment,
    service: appConfig.app.name,
    version: appConfig.app.version
  }
  
  this.log.info(auditLog, `🔍 Audit: ${action} by user ${userId}`)
}

// 🏷️ Extender tipos de Fastify
declare module 'fastify' {
  export interface FastifyInstance {
    logWithContext(
      level: 'debug' | 'info' | 'warn' | 'error',
      message: string,
      context?: Partial<LogContext>
    ): void
    logError(
      error: Error,
      context?: Partial<LogContext>,
      additionalInfo?: Record<string, any>
    ): void
    logAudit(
      action: string,
      userId: string,
      details?: Record<string, any>,
      context?: Partial<LogContext>
    ): void
  }
  
  export interface FastifyRequest {
    logContext: LogContext
    startTime: number
  }
}

// 📊 Configuración de logging específica
export const loggingConfig = {
  // 🎯 Patrones de URLs a excluir del logging detallado
  excludePatterns: [
    '/health',
    '/metrics',
    '/favicon.ico'
  ],
  
  // ⏱️ Umbrales de tiempo para alertas
  timeThresholds: {
    slow: 2000,    // 2 segundos
    verySlow: 5000 // 5 segundos
  },
  
  // 📊 Configuración de sampling
  sampling: {
    enabled: appConfig.server.isProduction,
    rate: 0.1, // 10% en producción
    alwaysLogErrors: true
  }
}

// 📦 Exportaciones
export default loggingMiddleware
