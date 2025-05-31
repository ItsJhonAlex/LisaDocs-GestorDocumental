import { FastifyRequest, FastifyReply, FastifyError } from 'fastify'
import { auditService } from '../services/auditService'

// 📋 Interfaces para el manejo de errores
export interface CustomError extends Error {
  statusCode?: number
  code?: string
  validation?: any[]
  details?: string
  isOperational?: boolean
}

export interface ErrorResponse {
  success: false
  error: string
  statusCode: number
  timestamp: string
  path: string
  requestId?: string
  details?: string
  validation?: any[]
  stack?: string
}

// 🔧 Tipos de errores personalizados
export class ValidationError extends Error implements CustomError {
  statusCode = 400
  code = 'VALIDATION_ERROR'
  isOperational = true
  validation: any[]

  constructor(message: string, validation: any[] = []) {
    super(message)
    this.name = 'ValidationError'
    this.validation = validation
  }
}

export class AuthenticationError extends Error implements CustomError {
  statusCode = 401
  code = 'AUTHENTICATION_ERROR'
  isOperational = true

  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error implements CustomError {
  statusCode = 403
  code = 'AUTHORIZATION_ERROR'
  isOperational = true

  constructor(message: string = 'Access denied') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends Error implements CustomError {
  statusCode = 404
  code = 'NOT_FOUND_ERROR'
  isOperational = true

  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error implements CustomError {
  statusCode = 409
  code = 'CONFLICT_ERROR'
  isOperational = true

  constructor(message: string = 'Resource conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class BusinessLogicError extends Error implements CustomError {
  statusCode = 422
  code = 'BUSINESS_LOGIC_ERROR'
  isOperational = true

  constructor(message: string) {
    super(message)
    this.name = 'BusinessLogicError'
  }
}

export class ExternalServiceError extends Error implements CustomError {
  statusCode = 502
  code = 'EXTERNAL_SERVICE_ERROR'
  isOperational = true

  constructor(message: string = 'External service error') {
    super(message)
    this.name = 'ExternalServiceError'
  }
}

export class RateLimitError extends Error implements CustomError {
  statusCode = 429
  code = 'RATE_LIMIT_ERROR'
  isOperational = true

  constructor(message: string = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
  }
}

// 🛡️ Middleware principal de manejo de errores
export const errorHandler = (
  error: FastifyError | CustomError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // 🏷️ Generar ID único para el error
  const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // 📊 Determinar el código de estado y categoría del error
  const statusCode = getErrorStatusCode(error)
  const errorCategory = getErrorCategory(error)
  const isOperational = isOperationalError(error)
  
  // 📝 Crear respuesta de error estructurada
  const errorResponse: ErrorResponse = {
    success: false,
    error: sanitizeErrorMessage(error.message),
    statusCode,
    timestamp: new Date().toISOString(),
    path: request.url,
    requestId: errorId
  }

  // 📋 Agregar detalles adicionales según el tipo de error
  if (error instanceof ValidationError && error.validation) {
    errorResponse.validation = error.validation
  }

  if ((error as CustomError).details) {
    errorResponse.details = (error as CustomError).details
  }

  // 🚨 Incluir stack trace solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack
  }

  // 📝 Log del error con contexto completo
  logError(error, {
    errorId,
    statusCode,
    category: errorCategory,
    isOperational,
    request: {
      method: request.method,
      url: request.url,
      headers: sanitizeHeaders(request.headers),
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: (request as any).user?.id
    }
  })

  // 🔔 Enviar alertas para errores críticos
  if (statusCode >= 500 || !isOperational) {
    sendCriticalErrorAlert(error, errorId, request)
  }

  // 📊 Registrar evento de auditoría
  if ((request as any).user?.id) {
    auditService.logAuditAction(
      (request as any).user.id,
      'error_occurred',
      {
        errorId,
        errorType: error.name,
        statusCode,
        path: request.url,
        message: error.message
      },
      {
        level: statusCode >= 500 ? 'error' : 'warning',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] as string
      }
    ).catch(() => {
      // Ignorar errores de auditoría para no crear bucles
    })
  }

  // 🔄 Enviar respuesta al cliente
  reply.status(statusCode).send(errorResponse)
}

// 🔧 Funciones auxiliares

function getErrorStatusCode(error: FastifyError | CustomError): number {
  // Errores de Fastify
  if ('statusCode' in error && error.statusCode) {
    return error.statusCode
  }

  // Errores personalizados
  if ((error as CustomError).statusCode) {
    return (error as CustomError).statusCode!
  }

  // Errores específicos de validación
  if (error.name === 'ValidationError') {
    return 400
  }

  // Errores de base de datos
  if (error.message.includes('Unique constraint')) {
    return 409 // Conflict
  }

  if (error.message.includes('Foreign key constraint')) {
    return 422 // Unprocessable Entity
  }

  if (error.message.includes('Not found')) {
    return 404
  }

  // Error interno por defecto
  return 500
}

function getErrorCategory(error: FastifyError | CustomError): string {
  if (error instanceof ValidationError) return 'validation'
  if (error instanceof AuthenticationError) return 'authentication'
  if (error instanceof AuthorizationError) return 'authorization'
  if (error instanceof NotFoundError) return 'not_found'
  if (error instanceof ConflictError) return 'conflict'
  if (error instanceof BusinessLogicError) return 'business_logic'
  if (error instanceof ExternalServiceError) return 'external_service'
  if (error instanceof RateLimitError) return 'rate_limit'

  // Categorías por patrón de mensaje
  if (error.message.includes('Unauthorized')) return 'authentication'
  if (error.message.includes('Forbidden')) return 'authorization'
  if (error.message.includes('validation')) return 'validation'
  if (error.message.includes('database')) return 'database'
  if (error.message.includes('network')) return 'network'
  if (error.message.includes('timeout')) return 'timeout'

  return 'system'
}

function isOperationalError(error: FastifyError | CustomError): boolean {
  if ((error as CustomError).isOperational !== undefined) {
    return (error as CustomError).isOperational!
  }

  // Considerar operacionales los errores de cliente (4xx)
  const statusCode = getErrorStatusCode(error)
  return statusCode >= 400 && statusCode < 500
}

function sanitizeErrorMessage(message: string): string {
  // 🔒 Sanitizar información sensible de los mensajes de error
  return message
    .replace(/password[=:\s]+[^\s]+/gi, 'password=***')
    .replace(/token[=:\s]+[^\s]+/gi, 'token=***')
    .replace(/key[=:\s]+[^\s]+/gi, 'key=***')
    .replace(/secret[=:\s]+[^\s]+/gi, 'secret=***')
}

function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers }
  
  // 🔒 Eliminar headers sensibles
  delete sanitized.authorization
  delete sanitized.cookie
  delete sanitized['x-api-key']
  delete sanitized['x-access-token']
  
  return sanitized
}

function logError(error: FastifyError | CustomError, context: any): void {
  const logLevel = context.statusCode >= 500 ? 'error' : 'warn'
  const logData = {
    errorId: context.errorId,
    name: error.name,
    message: error.message,
    statusCode: context.statusCode,
    category: context.category,
    isOperational: context.isOperational,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    request: context.request,
    timestamp: new Date().toISOString()
  }

  if (logLevel === 'error') {
    console.error('🚨 ERROR:', JSON.stringify(logData, null, 2))
  } else {
    console.warn('⚠️ WARNING:', JSON.stringify(logData, null, 2))
  }

  // TODO: Integrar con sistema de logging externo (Winston, etc.)
}

async function sendCriticalErrorAlert(
  error: FastifyError | CustomError, 
  errorId: string, 
  request: FastifyRequest
): Promise<void> {
  try {
    // TODO: Implementar sistema de alertas críticas
    console.error(`🚨 CRITICAL ERROR ALERT: ${errorId}`, {
      error: error.message,
      url: request.url,
      method: request.method,
      userId: (request as any).user?.id,
      timestamp: new Date().toISOString()
    })

    // Aquí se podría integrar con servicios como:
    // - Slack notifications
    // - Email alerts
    // - PagerDuty
    // - Discord webhooks
    // - Teams notifications

  } catch (alertError) {
    console.error('❌ Failed to send critical error alert:', alertError)
  }
}

// 🔄 Handler para errores no capturados
export const uncaughtErrorHandler = (error: Error): void => {
  console.error('🚨 UNCAUGHT ERROR:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  })

  // TODO: Implementar notificación crítica inmediata
  
  // Dar tiempo para que se envíen los logs
  setTimeout(() => {
    process.exit(1)
  }, 1000)
}

// 🔄 Handler para promesas rechazadas no manejadas
export const unhandledRejectionHandler = (reason: any, promise: Promise<any>): void => {
  console.error('🚨 UNHANDLED PROMISE REJECTION:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
    timestamp: new Date().toISOString()
  })

  // TODO: Implementar notificación crítica inmediata

  // Dar tiempo para que se envíen los logs
  setTimeout(() => {
    process.exit(1)
  }, 1000)
}

// 🎯 Middleware para manejar errores 404
export const notFoundHandler = (request: FastifyRequest, reply: FastifyReply) => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: `Route ${request.method} ${request.url} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: request.url
  }

  reply.status(404).send(errorResponse)
}

// 📊 Funciones utilitarias para crear errores específicos
export const createError = {
  validation: (message: string, validation?: any[]) => new ValidationError(message, validation),
  authentication: (message?: string) => new AuthenticationError(message),
  authorization: (message?: string) => new AuthorizationError(message),
  notFound: (message?: string) => new NotFoundError(message),
  conflict: (message?: string) => new ConflictError(message),
  businessLogic: (message: string) => new BusinessLogicError(message),
  externalService: (message?: string) => new ExternalServiceError(message),
  rateLimit: (message?: string) => new RateLimitError(message)
}
