import { z } from 'zod';

// 🔧 Schema de validación para variables de entorno
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  
  // Server
  PORT: z.string().default('3001').transform(Number),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Security
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  
  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
  
  // File Upload
  MAX_FILE_SIZE_MB: z.string().default('50').transform(Number),
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,xls,xlsx,txt,jpg,png,gif'),
  
  // MinIO/S3
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.string().default('9000'),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET_NAME: z.string().default('lisadocs-documents'),
  MINIO_USE_SSL: z.string().default('false').transform(val => val === 'true'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
});

// 🚀 Validar y exportar variables de entorno
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Error de configuración de variables de entorno:', error);
    process.exit(1);
  }
}

export const env = validateEnv();

// 🔐 Configuración derivada
export const config = {
  // Server
  server: {
    port: env.PORT,
    host: env.HOST,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test'
  },
  
  // Database
  database: {
    url: env.DATABASE_URL
  },
  
  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN
  },
  
  // Security
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    corsOrigins: env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  },
  
  // Files
  files: {
    maxSizeMB: env.MAX_FILE_SIZE_MB,
    allowedTypes: env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim()),
    maxSizeBytes: env.MAX_FILE_SIZE_MB * 1024 * 1024
  },
  
  // Storage
  storage: {
    endpoint: env.MINIO_ENDPOINT,
    port: parseInt(env.MINIO_PORT),
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
    bucketName: env.MINIO_BUCKET_NAME,
    useSSL: env.MINIO_USE_SSL
  },
  
  // URLs
  urls: {
    frontend: env.FRONTEND_URL
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL
  }
};

export type Config = typeof config;
