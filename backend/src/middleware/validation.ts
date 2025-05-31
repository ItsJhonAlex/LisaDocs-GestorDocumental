import { FastifyRequest, FastifyReply } from 'fastify'
import { z, ZodError, ZodSchema } from 'zod'
import { createError } from './errorHandler'

// 📋 Interfaces para validación
export interface ValidationOptions {
  body?: ZodSchema
  querystring?: ZodSchema
  params?: ZodSchema
  headers?: ZodSchema
  sanitize?: boolean
  stripUnknown?: boolean
  abortEarly?: boolean
}

export interface ValidatedRequest<T = any> extends FastifyRequest {
  validatedBody?: T
  validatedQuery?: any
  validatedParams?: any
  validatedHeaders?: any
}

// 🛡️ Middleware principal de validación
export const validate = (options: ValidationOptions) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validatedRequest = request as ValidatedRequest

      // 📋 Validar body
      if (options.body) {
        try {
          validatedRequest.validatedBody = await validateField(
            request.body,
            options.body,
            'body',
            options
          )
        } catch (error) {
          throw createValidationError(error as ZodError, 'body')
        }
      }

      // 🔍 Validar querystring
      if (options.querystring) {
        try {
          validatedRequest.validatedQuery = await validateField(
            request.query,
            options.querystring,
            'query',
            options
          )
        } catch (error) {
          throw createValidationError(error as ZodError, 'query')
        }
      }

      // 🎯 Validar params
      if (options.params) {
        try {
          validatedRequest.validatedParams = await validateField(
            request.params,
            options.params,
            'params',
            options
          )
        } catch (error) {
          throw createValidationError(error as ZodError, 'params')
        }
      }

      // 📨 Validar headers
      if (options.headers) {
        try {
          validatedRequest.validatedHeaders = await validateField(
            request.headers,
            options.headers,
            'headers',
            options
          )
        } catch (error) {
          throw createValidationError(error as ZodError, 'headers')
        }
      }

    } catch (error) {
      throw error // Re-lanzar para que lo maneje el errorHandler
    }
  }
}

// 🔧 Función auxiliar para validar campos individuales
async function validateField(
  data: any,
  schema: ZodSchema,
  fieldName: string,
  options: ValidationOptions
): Promise<any> {
  try {
    // 🧹 Sanitizar datos si está habilitado
    const sanitizedData = options.sanitize ? sanitizeData(data, fieldName) : data

    // ✅ Validar con Zod
    const result = schema.parse(sanitizedData)

    return result

  } catch (error) {
    if (error instanceof ZodError) {
      throw error
    }
    throw new Error(`Validation failed for ${fieldName}: ${(error as Error).message}`)
  }
}

// 🧹 Función de sanitización de datos
function sanitizeData(data: any, fieldName: string): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sanitized = Array.isArray(data) ? [...data] : { ...data }

  // 🔍 Sanitizar strings
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key])
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // 🔄 Recursivo para objetos anidados
      sanitized[key] = sanitizeData(sanitized[key], `${fieldName}.${key}`)
    }
  })

  return sanitized
}

// 🧹 Sanitizar strings individuales
function sanitizeString(value: string): string {
  return value
    .trim() // Eliminar espacios al inicio y final
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .replace(/[<>]/g, '') // Eliminar caracteres básicos de XSS
}

// ❌ Crear error de validación formateado
function createValidationError(zodError: ZodError, fieldName: string) {
  const validationErrors = zodError.errors.map(error => ({
    field: `${fieldName}.${error.path.join('.')}`,
    message: error.message,
    code: error.code,
    expected: getExpectedValue(error),
    received: getReceivedValue(error)
  }))

  return createError.validation(
    `Validation failed for ${fieldName}`,
    validationErrors
  )
}

// 📋 Obtener valor esperado del error de Zod
function getExpectedValue(error: any): string {
  switch (error.code) {
    case 'invalid_type':
      return error.expected
    case 'too_small':
      return `minimum ${error.minimum}`
    case 'too_big':
      return `maximum ${error.maximum}`
    case 'invalid_string':
      return error.validation
    case 'invalid_enum_value':
      return `one of: ${error.options.join(', ')}`
    default:
      return 'valid value'
  }
}

// 📋 Obtener valor recibido del error de Zod (type-safe)
function getReceivedValue(error: any): string {
  // ✅ Verificar si el error tiene la propiedad 'received'
  if ('received' in error && error.received !== undefined) {
    return typeof error.received === 'string' ? error.received : String(error.received)
  }
  
  // 🔍 Para errores de tipo específico, extraer el valor de otras propiedades
  switch (error.code) {
    case 'invalid_type':
      return error.received || 'unknown'
    case 'invalid_enum_value':
      return error.received || 'unknown'
    case 'too_small':
    case 'too_big':
      return 'received' in error ? String(error.received) : 'unknown'
    default:
      return 'unknown'
  }
}

// 📊 Schemas de validación comunes y reutilizables
export const commonSchemas = {
  // 🆔 Identificadores
  uuid: z.string().uuid('Invalid UUID format'),
  id: z.string().min(1, 'ID is required'),
  
  // 📧 Email
  email: z.string().email('Invalid email format').toLowerCase(),
  
  // 🔐 Contraseña
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one digit'),
  
  // 📱 Teléfono
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must not exceed 20 characters'),
  
  // 🌐 URL
  url: z.string().url('Invalid URL format'),
  
  // 📅 Fechas
  dateString: z.string().datetime('Invalid date format (ISO 8601 required)'),
  date: z.coerce.date(),
  
  // 🔢 Números
  positiveInt: z.number().int().positive('Must be a positive integer'),
  nonNegativeInt: z.number().int().min(0, 'Must be a non-negative integer'),
  
  // 📄 Texto
  shortText: z.string().min(1).max(100).trim(),
  mediumText: z.string().min(1).max(500).trim(),
  longText: z.string().min(1).max(2000).trim(),
  
  // 🏷️ Nombres
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'Name can only contain letters and spaces')
    .trim(),
  
  // 🔍 Búsqueda
  searchQuery: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must not exceed 100 characters')
    .trim(),
  
  // 📊 Paginación
  pagination: z.object({
    limit: z.string()
      .optional()
      .default('20')
      .transform(val => parseInt(val))
      .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
    offset: z.string()
      .optional()
      .default('0')
      .transform(val => parseInt(val))
      .refine(val => val >= 0, 'Offset must be non-negative')
  }),
  
  // 🗂️ Ordenamiento
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),
  
  // 🏷️ Tags
  tags: z.array(z.string().min(1).max(30)).max(10, 'Maximum 10 tags allowed'),
  
  // 🎨 Metadatos
  metadata: z.record(z.any()).optional(),
  
  // 📍 Roles y permisos
  userRole: z.enum(['administrador', 'presidente', 'vicepresidente', 'secretarios', 'intendente', 'cf_member']),
  workspaceType: z.enum(['presidencia', 'intendencia', 'cam', 'ampp', 'comisiones_cf']),
  
  // 📄 Estados de documentos
  documentStatus: z.enum(['draft', 'pending_review', 'approved', 'rejected', 'archived']),
  
  // 🔔 Tipos de notificaciones
  notificationType: z.enum(['info', 'success', 'warning', 'error', 'announcement', 'reminder', 'task', 'alert']),
  notificationPriority: z.enum(['low', 'normal', 'high', 'urgent'])
}

// 🎯 Validadores específicos para diferentes entidades
export const validators = {
  // 👤 Usuario
  createUser: {
    body: z.object({
      fullName: commonSchemas.name,
      email: commonSchemas.email,
      password: commonSchemas.password,
      role: commonSchemas.userRole,
      workspace: commonSchemas.workspaceType,
      phone: commonSchemas.phone.optional(),
      metadata: commonSchemas.metadata
    })
  },
  
  updateUser: {
    params: z.object({
      id: commonSchemas.uuid
    }),
    body: z.object({
      fullName: commonSchemas.name.optional(),
      email: commonSchemas.email.optional(),
      phone: commonSchemas.phone.optional(),
      role: commonSchemas.userRole.optional(),
      workspace: commonSchemas.workspaceType.optional(),
      metadata: commonSchemas.metadata
    })
  },
  
  // 📄 Documento
  createDocument: {
    body: z.object({
      title: z.string().min(3).max(500).trim(),
      description: z.string().max(2000).trim().optional(),
      content: commonSchemas.longText.optional(),
      status: commonSchemas.documentStatus.default('draft'),
      workspace: commonSchemas.workspaceType,
      tags: commonSchemas.tags.optional(),
      metadata: commonSchemas.metadata,
      isPublic: z.boolean().default(false),
      expiresAt: commonSchemas.dateString.optional()
    })
  },
  
  // 🔍 Búsqueda
  search: {
    querystring: z.object({
      q: commonSchemas.searchQuery,
      type: z.enum(['users', 'documents', 'all']).default('all'),
      workspace: commonSchemas.workspaceType.optional(),
      status: commonSchemas.documentStatus.optional(),
      ...commonSchemas.pagination.shape,
      ...commonSchemas.sorting.shape
    })
  },
  
  // 📧 Notificación
  createNotification: {
    body: z.object({
      title: z.string().min(1).max(200).trim(),
      content: z.string().min(1).max(1000).trim(),
      type: commonSchemas.notificationType,
      priority: commonSchemas.notificationPriority.default('normal'),
      recipients: z.object({
        type: z.enum(['all', 'role', 'workspace', 'specific', 'custom']),
        roles: z.array(commonSchemas.userRole).optional(),
        workspaces: z.array(commonSchemas.workspaceType).optional(),
        userIds: z.array(commonSchemas.uuid).optional(),
        excludeUsers: z.array(commonSchemas.uuid).optional()
      }),
      delivery: z.object({
        immediate: z.boolean().default(true),
        email: z.boolean().default(false),
        browser: z.boolean().default(true),
        scheduledAt: commonSchemas.dateString.optional()
      }).optional(),
      metadata: commonSchemas.metadata,
      expiresAt: commonSchemas.dateString.optional(),
      actionRequired: z.boolean().default(false),
      actionUrl: commonSchemas.url.optional(),
      actionText: z.string().max(50).optional(),
      category: z.string().max(50).optional(),
      tags: commonSchemas.tags.optional()
    })
  },
  
  // 🔐 Autenticación
  login: {
    body: z.object({
      email: commonSchemas.email,
      password: z.string().min(1, 'Password is required'),
      rememberMe: z.boolean().default(false)
    })
  },
  
  changePassword: {
    body: z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: commonSchemas.password,
      confirmPassword: z.string().min(1, 'Password confirmation is required')
    }).refine(
      data => data.newPassword === data.confirmPassword,
      {
        message: 'New password and confirmation do not match',
        path: ['confirmPassword']
      }
    )
  },
  
  // 📊 Reportes
  generateReport: {
    body: z.object({
      type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
      format: z.enum(['json', 'csv', 'pdf']).default('json'),
      startDate: commonSchemas.dateString.optional(),
      endDate: commonSchemas.dateString.optional(),
      includeCharts: z.boolean().default(true),
      filters: z.object({
        workspace: commonSchemas.workspaceType.optional(),
        status: commonSchemas.documentStatus.optional(),
        userRole: commonSchemas.userRole.optional()
      }).optional()
    })
  },
  
  // 🎯 Parámetros ID
  idParam: {
    params: z.object({
      id: commonSchemas.uuid
    })
  },
  
  // 📋 Listados con filtros
  listWithFilters: {
    querystring: z.object({
      ...commonSchemas.pagination.shape,
      ...commonSchemas.sorting.shape,
      status: z.string().optional(),
      type: z.string().optional(),
      workspace: commonSchemas.workspaceType.optional(),
      role: commonSchemas.userRole.optional(),
      startDate: commonSchemas.dateString.optional(),
      endDate: commonSchemas.dateString.optional(),
      search: commonSchemas.searchQuery.optional()
    })
  }
}

// 🛠️ Utilidades adicionales para validación
export const validationUtils = {
  // 🔍 Validar si un valor existe en una enum
  isValidEnum: <T extends Record<string, string>>(enumObject: T, value: string): value is T[keyof T] => {
    return Object.values(enumObject).includes(value as T[keyof T])
  },
  
  // 📧 Validar email de forma simple
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  // 🆔 Validar UUID
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  },
  
  // 📱 Sanitizar número de teléfono
  sanitizePhone: (phone: string): string => {
    return phone.replace(/[^\d+]/g, '')
  },
  
  // 🔢 Validar rango numérico
  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max
  },
  
  // 📅 Validar fecha futura
  isFutureDate: (date: string | Date): boolean => {
    const targetDate = typeof date === 'string' ? new Date(date) : date
    return targetDate > new Date()
  },
  
  // 🔒 Validar fortaleza de contraseña
  validatePasswordStrength: (password: string): {
    isValid: boolean
    score: number
    suggestions: string[]
  } => {
    let score = 0
    const suggestions: string[] = []
    
    if (password.length >= 8) score += 1
    else suggestions.push('Use at least 8 characters')
    
    if (/[a-z]/.test(password)) score += 1
    else suggestions.push('Include lowercase letters')
    
    if (/[A-Z]/.test(password)) score += 1
    else suggestions.push('Include uppercase letters')
    
    if (/\d/.test(password)) score += 1
    else suggestions.push('Include numbers')
    
    if (/[^a-zA-Z0-9]/.test(password)) score += 1
    else suggestions.push('Include special characters')
    
    return {
      isValid: score >= 4,
      score,
      suggestions
    }
  }
}

// 🎯 Middleware de validación rápida para casos comunes
export const quickValidate = {
  idParam: validate(validators.idParam),
  listWithFilters: validate(validators.listWithFilters),
  createUser: validate(validators.createUser),
  updateUser: validate(validators.updateUser),
  createDocument: validate(validators.createDocument),
  createNotification: validate(validators.createNotification),
  login: validate(validators.login),
  changePassword: validate(validators.changePassword),
  search: validate(validators.search),
  generateReport: validate(validators.generateReport)
}
