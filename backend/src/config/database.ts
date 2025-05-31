import { PrismaClient } from '@prisma/client'

// 🎯 Singleton de Prisma Client
declare global {
  var __prisma: PrismaClient | undefined
}

// 🔧 Configuración de Prisma
const createPrismaClient = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const client = new PrismaClient({
    // 📊 Configuración de logging
    log: isDevelopment 
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
    
    // ⚡ Configuraciones de rendimiento
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // 🔗 Middleware para logging personalizado
  if (isDevelopment) {
    client.$use(async (params: any, next: any) => {
      const before = Date.now()
      const result = await next(params)
      const after = Date.now()
      
      console.log(`🔍 Query ${params.model}.${params.action} took ${after - before}ms`)
      return result
    })
  }

  return client
}

// ✨ Crear instancia singleton
export const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// 🧪 Función para conectar a la base de datos
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // 🏥 Verificar salud de la conexión
    await prisma.$queryRaw`SELECT 1`
    console.log('🏥 Database health check passed')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 🔌 Función para desconectar de la base de datos
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
    throw new Error(`Failed to disconnect from database: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 🧼 Función para limpiar la base de datos (solo en testing)
export async function cleanDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Database cleaning is only allowed in test environment')
  }

  try {
    // 🗑️ Eliminar todos los registros en orden inverso de dependencias
    await prisma.documentActivity.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.document.deleteMany()
    await prisma.user.deleteMany()
    await prisma.rolePermission.deleteMany()
    await prisma.systemSetting.deleteMany()
    
    console.log('🧼 Database cleaned successfully')
  } catch (error) {
    console.error('❌ Database cleaning failed:', error)
    throw new Error(`Failed to clean database: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 🏥 Función para verificar la salud de la base de datos
export async function checkDatabaseHealth(): Promise<{
  connected: boolean
  latency: number
  version: string
}> {
  try {
    const start = Date.now()
    
    // 📊 Obtener información de la base de datos
    const [result] = await prisma.$queryRaw<[{ version: string }]>`SELECT version() as version`
    
    const latency = Date.now() - start
    
    return {
      connected: true,
      latency,
      version: result.version || 'Unknown'
    }
  } catch (error) {
    console.error('❌ Database health check failed:', error)
    return {
      connected: false,
      latency: -1,
      version: 'Unknown'
    }
  }
}

// 📊 Función para obtener estadísticas de la base de datos
export async function getDatabaseStats(): Promise<{
  tables: Record<string, number>
  totalRecords: number
}> {
  try {
    const [
      usersCount,
      documentsCount,
      activitiesCount,
      notificationsCount,
      permissionsCount,
      settingsCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.documentActivity.count(),
      prisma.notification.count(),
      prisma.rolePermission.count(),
      prisma.systemSetting.count()
    ])

    const tables = {
      users: usersCount,
      documents: documentsCount,
      documentActivities: activitiesCount,
      notifications: notificationsCount,
      rolePermissions: permissionsCount,
      systemSettings: settingsCount
    }

    const totalRecords = Object.values(tables).reduce((sum, count) => sum + count, 0)

    return {
      tables,
      totalRecords
    }
  } catch (error) {
    console.error('❌ Failed to get database stats:', error)
    throw new Error(`Failed to get database stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 🔧 Configuración de base de datos para compatibilidad
export const databaseConfig = {
  // 🧪 Función de test para verificar conexión
  test: async (): Promise<void> => {
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      throw new Error(`Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
  
  // 📊 Obtener instancia de Prisma
  getInstance: () => prisma,
  
  // 🏥 Verificar salud
  healthCheck: checkDatabaseHealth,
  
  // 📈 Obtener estadísticas
  getStats: getDatabaseStats,
  
  // 🔗 Conectar
  connect: connectDatabase,
  
  // 🔌 Desconectar
  disconnect: disconnectDatabase,
  
  // 🧼 Limpiar (solo testing)
  clean: cleanDatabase
}

// 🎯 Exportaciones principales
export default prisma
export { PrismaClient } from '@prisma/client'
