// 🎯 Utilidades de logging compatibles con Windows

// 📊 Símbolos compatibles para logging limpio
export const LogSymbols = {
  success: '[SUCCESS]',
  error: '[ERROR]',
  warning: '[WARN]',
  info: '[INFO]',
  debug: '[DEBUG]',
  
  // 🎯 Símbolos específicos para eventos
  server: '[SERVER]',
  auth: '[AUTH]',
  user: '[USER]',
  workspace: '[WORKSPACE]',
  document: '[DOCUMENT]',
  notification: '[NOTIFICATION]',
  admin: '[ADMIN]',
  
  // 🚀 Estados de operación
  start: '[START]',
  complete: '[COMPLETE]',
  register: '[REGISTER]',
  update: '[UPDATE]',
  delete: '[DELETE]',
  create: '[CREATE]',
  
  // 📊 Tipos de workspace
  cam: '[CAM]',
  ampp: '[AMPP]',
  presidencia: '[PRESIDENCIA]',
  intendencia: '[INTENDENCIA]',
  comisiones: '[COMISIONES-CF]'
} as const

// 🎨 Función para formatear mensajes de log
export function formatLogMessage(symbol: string, message: string, details?: any): string {
  let formatted = `${symbol} ${message}`
  
  if (details) {
    formatted += ` - ${typeof details === 'string' ? details : JSON.stringify(details, null, 2)}`
  }
  
  return formatted
}

// 📝 Funciones de logging específicas
export const LogMessages = {
  // 🚀 Servidor
  serverStart: (port: number, host: string) => 
    formatLogMessage(LogSymbols.server, `LisaDocs API Server started successfully!`, {
      port,
      host,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      docs: `http://localhost:${port}/docs`
    }),
  
  // 🔐 Autenticación
  authMiddleware: () => 
    formatLogMessage(LogSymbols.auth, 'Authentication middleware registered successfully'),
  
  // 👥 Usuarios
  userRoutes: (routes: any) => 
    formatLogMessage(LogSymbols.user, 'User routes registered successfully', { routes }),
  
  // 🏢 Workspaces
  workspaceRoutes: (workspace: string, routes: string[]) => 
    formatLogMessage(LogSymbols.workspace, `${workspace} workspace routes registered`, {
      workspace,
      routes
    }),
  
  workspaceRoutesComplete: (routes: any) =>
    formatLogMessage(LogSymbols.workspace, 'Workspace routes registered successfully', { routes }),
  
  // 📧 Notificaciones
  notificationRoutes: () =>
    formatLogMessage(LogSymbols.notification, 'Notification routes registered successfully'),
  
  // 📄 Documentos
  documentRoutes: () =>
    formatLogMessage(LogSymbols.document, 'Document routes registered successfully'),
  
  // ⚙️ Admin
  adminRoutes: () =>
    formatLogMessage(LogSymbols.admin, 'Admin routes registered successfully'),
  
  // 🔧 Desarrollo
  hotReload: () =>
    formatLogMessage(LogSymbols.info, 'Development mode: Hot reload enabled')
}

export default LogSymbols 