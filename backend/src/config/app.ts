// 🎯 Configuración de la aplicación
export const appConfig = {
  // 🚀 Configuración del servidor
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3000'),
    environment: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test'
  },

  // 🔐 Configuración de autenticación
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600'), // 1 hora
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900') // 15 minutos
  },

  // 📁 Configuración de archivos
  files: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    maxFiles: parseInt(process.env.MAX_FILES || '5')
  },

  // 🛡️ Configuración de seguridad
  security: {
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
    enableCors: process.env.ENABLE_CORS !== 'false',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '15 minutes',
    enableTrustedProxy: process.env.ENABLE_TRUSTED_PROXY === 'true'
  },

  // 📊 Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enablePrettyPrint: process.env.LOG_PRETTY_PRINT === 'true',
    enableFileLogging: process.env.LOG_FILE_ENABLED === 'true',
    logFilePath: process.env.LOG_FILE_PATH || './logs/app.log',
    maxLogFileSize: process.env.LOG_MAX_FILE_SIZE || '10MB',
    maxLogFiles: parseInt(process.env.LOG_MAX_FILES || '5')
  },

  // 📧 Configuración de notificaciones
  notifications: {
    enableEmail: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enableBrowser: process.env.ENABLE_BROWSER_NOTIFICATIONS !== 'false',
    enablePush: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
    emailFrom: process.env.EMAIL_FROM || 'noreply@lisadocs.com',
    emailTemplatesPath: process.env.EMAIL_TEMPLATES_PATH || './templates/email'
  },

  // 🗄️ Configuración de caché
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    provider: process.env.CACHE_PROVIDER || 'memory', // memory, redis
    ttl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hora
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000'),
    redisUrl: process.env.REDIS_URL
  },

  // 📈 Configuración de métricas
  metrics: {
    enabled: process.env.METRICS_ENABLED === 'true',
    endpoint: process.env.METRICS_ENDPOINT || '/metrics',
    enablePrometheus: process.env.PROMETHEUS_ENABLED === 'true'
  },

  // 🏥 Configuración de health checks
  health: {
    endpoint: process.env.HEALTH_ENDPOINT || '/health',
    enableDetailedChecks: process.env.HEALTH_DETAILED === 'true',
    timeout: parseInt(process.env.HEALTH_TIMEOUT || '5000')
  },

  // 📖 Configuración de documentación
  docs: {
    enabled: process.env.DOCS_ENABLED !== 'false',
    endpoint: process.env.DOCS_ENDPOINT || '/docs',
    title: process.env.DOCS_TITLE || 'LisaDocs API',
    description: process.env.DOCS_DESCRIPTION || 'Sistema de Gestión Documental - API Documentation',
    version: process.env.API_VERSION || '1.0.0'
  },

  // 🎯 Configuración específica de la aplicación
  app: {
    name: 'LisaDocs',
    description: 'Sistema de Gestión Documental',
    version: process.env.APP_VERSION || '1.0.0',
    author: 'Jonathan Alejandro Rodriguez Lopes',
    contact: {
      name: 'Jonathan Rodriguez',
      email: 'itsjhonalex@gmail.com',
      url: 'https://github.com/ItsJhonAlex'
    },
    defaultWorkspace: 'general',
    supportedLanguages: ['es', 'en'],
    defaultLanguage: 'es',
    timezone: process.env.TZ || 'America/Argentina/Buenos_Aires'
  }
}

// 🏷️ Tipos de configuración
export type AppConfig = typeof appConfig

// ✅ Validación de configuración crítica
export function validateAppConfig(): void {
  const requiredEnvVars = ['JWT_SECRET']
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // 🔍 Validaciones adicionales
  if (appConfig.auth.jwtSecret === 'your-super-secret-jwt-key' && appConfig.server.isProduction) {
    throw new Error('JWT_SECRET must be set to a secure value in production')
  }

  if (appConfig.server.port < 1 || appConfig.server.port > 65535) {
    throw new Error('PORT must be a valid port number (1-65535)')
  }

  if (appConfig.files.maxFileSize > 100 * 1024 * 1024) { // 100MB
    console.warn('⚠️ MAX_FILE_SIZE is very large, consider reducing it for security')
  }
}

// 🎯 Configuración del entorno específico
export function getEnvironmentConfig() {
  return {
    isDevelopment: appConfig.server.isDevelopment,
    isProduction: appConfig.server.isProduction,
    isTest: appConfig.server.isTest,
    logLevel: appConfig.logging.level,
    enableDebug: appConfig.server.isDevelopment,
    enableMetrics: appConfig.metrics.enabled,
    enableDocs: appConfig.docs.enabled && !appConfig.server.isProduction
  }
}

// 🚀 Configuración de Fastify
export function getFastifyConfig() {
  return {
    logger: {
      level: appConfig.logging.level,
      transport: appConfig.server.isDevelopment && appConfig.logging.enablePrettyPrint ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      } : undefined
    },
    trustProxy: appConfig.security.enableTrustedProxy,
    bodyLimit: appConfig.files.maxFileSize,
    requestTimeout: 30000, // 30 segundos
    keepAliveTimeout: 5000,
    connectionTimeout: 0,
    maxParamLength: 200
  }
}

export default appConfig 