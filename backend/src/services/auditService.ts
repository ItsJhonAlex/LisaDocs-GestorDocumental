import { prisma } from '../config/database'
import { userService } from './userService'

// 📋 Interfaces para el servicio de auditoría
export interface AuditLogEntry {
  id: string
  userId: string
  action: string
  resource?: string
  resourceId?: string
  workspace?: string
  level: 'info' | 'warning' | 'error'
  ipAddress?: string
  userAgent?: string
  details: Record<string, any>
  createdAt: Date
  user?: {
    id: string
    fullName: string
    email: string
    role: string
  }
}

// 🔧 Interfaces para tipos de Prisma
interface PrismaDocumentActivity {
  id: string
  userId: string
  documentId: string
  action: string
  ipAddress: string | null
  userAgent: string | null
  details: any
  createdAt: Date
  user?: {
    id: string
    fullName: string
    email: string
    role: string
  } | null
}

interface PrismaGroupByLevel {
  action: string
  _count: number
}

interface PrismaGroupByAction {
  action: string
  _count: number
}

interface PrismaGroupByWorkspace {
  action: string
  _count: number
}

export interface AuditLogFilters {
  startDate?: string
  endDate?: string
  userId?: string
  action?: string
  workspace?: string
  level?: 'info' | 'warning' | 'error'
  limit?: number
  offset?: number
}

export interface SecurityEvent {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  isResolved: boolean
  resolution?: string
  reviewedBy?: string
  reviewedAt?: Date
  metadata: Record<string, any>
  createdAt: Date
}

export interface UserActivity {
  user: {
    id: string
    fullName: string
    email: string
    role: string
    workspace: string
  }
  activity: AuditLogEntry[]
  statistics: {
    totalActions: number
    actionsByType: Record<string, number>
    lastActivity: Date
    averageSessionLength: number
    loginCount: number
    documentsCreated: number
    documentsAccessed: number
  }
  riskAssessment: {
    score: number
    level: 'low' | 'medium' | 'high'
    factors: string[]
    recommendations: string[]
  }
}

// 🔍 Servicio de auditoría
export class AuditService {

  /**
   * 📊 Obtener logs de auditoría con filtros
   */
  async getAuditLogs(filters: AuditLogFilters): Promise<{
    logs: AuditLogEntry[]
    total: number
    hasMore: boolean
    summary: Record<string, any>
  }> {
    try {
      const {
        startDate,
        endDate,
        userId,
        action,
        workspace,
        level,
        limit = 100,
        offset = 0
      } = filters

      // 🔍 Construir filtros para Prisma
      const where: any = {}

      if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
      if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) }
      if (userId) where.userId = userId
      if (action) where.action = { contains: action, mode: 'insensitive' }
      // Note: workspace filtering will be handled through document relationship
      // Note: level filtering is not available in documentActivity table

      // 📊 Obtener logs y total
      const [logs, total] = await Promise.all([
        prisma.documentActivity.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true
              }
            },
            document: {
              select: {
                id: true,
                title: true,
                workspace: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.documentActivity.count({ where })
      ])

      // 📈 Generar resumen
      const summary = await this.generateLogsSummary(where)

      // 📋 Formatear logs
      const formattedLogs: AuditLogEntry[] = logs.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        resource: 'document',
        resourceId: log.documentId,
        workspace: log.document?.workspace,
        level: 'info', // Default level since not stored in documentActivity
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        details: log.details as Record<string, any>,
        createdAt: log.createdAt,
        user: log.user ? {
          id: log.user.id,
          fullName: log.user.fullName,
          email: log.user.email,
          role: log.user.role
        } : undefined
      }))

      return {
        logs: formattedLogs,
        total,
        hasMore: offset + limit < total,
        summary
      }

    } catch (error) {
      console.error('❌ Error getting audit logs:', error)
      throw new Error(`Failed to get audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 👤 Obtener actividad específica de un usuario
   */
  async getUserActivity(userId: string, days: number = 30, includeDetails: boolean = true): Promise<UserActivity> {
    try {
      // 📄 Obtener información del usuario
      const user = await userService.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      // 📊 Obtener actividad del usuario
      const activity = await prisma.documentActivity.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        include: {
          document: {
            select: {
              workspace: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: includeDetails ? 500 : 50
      })

      // 📈 Calcular estadísticas
      const statistics = await this.calculateUserStatistics(userId, activity, days)

      // 🛡️ Evaluación de riesgo
      const riskAssessment = await this.assessUserRisk(userId, activity, statistics)

      // 📋 Formatear actividad
      const formattedActivity: AuditLogEntry[] = activity.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        resource: 'document',
        resourceId: log.documentId,
        workspace: log.document?.workspace,
        level: 'info',
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        details: log.details as Record<string, any>,
        createdAt: log.createdAt
      }))

      return {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          workspace: user.workspace
        },
        activity: formattedActivity,
        statistics,
        riskAssessment
      }

    } catch (error) {
      console.error('❌ Error getting user activity:', error)
      throw new Error(`Failed to get user activity: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🔒 Obtener eventos de seguridad
   */
  async getSecurityEvents(filters: {
    severity?: string
    startDate?: string
    endDate?: string
    resolved?: string
    limit?: string
  }): Promise<{
    events: SecurityEvent[]
    summary: Record<string, any>
    recommendations: string[]
  }> {
    try {
      // TODO: Implementar cuando tengamos la tabla SecurityEvent
      // Por ahora simulamos datos
      
      const events: SecurityEvent[] = [
        {
          id: '1',
          type: 'failed_login_attempts',
          severity: 'medium',
          title: 'Múltiples intentos de login fallidos',
          description: 'Usuario con 5 intentos fallidos consecutivos',
          userId: 'user123',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          isResolved: false,
          metadata: { attempts: 5, lastAttempt: new Date() },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: '2',
          type: 'unusual_access_pattern',
          severity: 'high',
          title: 'Patrón de acceso inusual',
          description: 'Acceso desde ubicación geográfica no habitual',
          userId: 'user456',
          ipAddress: '203.0.113.0',
          userAgent: 'Mozilla/5.0...',
          isResolved: true,
          resolution: 'Verificado con el usuario - acceso legítimo',
          reviewedBy: 'admin',
          reviewedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          metadata: { location: 'País extranjero' },
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        }
      ]

      const summary = {
        total: events.length,
        unresolved: events.filter(e => !e.isResolved).length,
        bySeverity: {
          low: events.filter(e => e.severity === 'low').length,
          medium: events.filter(e => e.severity === 'medium').length,
          high: events.filter(e => e.severity === 'high').length,
          critical: events.filter(e => e.severity === 'critical').length
        }
      }

      const recommendations = [
        'Implementar autenticación de dos factores',
        'Configurar alertas para accesos desde IPs desconocidas',
        'Revisar políticas de contraseñas',
        'Monitorear patrones de acceso inusuales'
      ]

      return { events, summary, recommendations }

    } catch (error) {
      console.error('❌ Error getting security events:', error)
      throw new Error(`Failed to get security events: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📊 Generar reporte de auditoría
   */
  async generateAuditReport(options: {
    type?: string
    format?: string
    startDate?: string
    endDate?: string
    includeCharts?: string
  }, userId: string): Promise<{
    report: Record<string, any>
    downloadUrl: string
    expiresAt: string
  }> {
    try {
      const {
        type = 'daily',
        format = 'json',
        startDate,
        endDate,
        includeCharts = 'true'
      } = options

      // 📊 Generar reporte basado en el tipo
      const report = await this.buildAuditReport(type, startDate, endDate, includeCharts === 'true')

      // 🔗 Generar URL de descarga
      const reportId = `audit_report_${Date.now()}`
      const downloadUrl = `/admin/audit/reports/download/${reportId}`
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas

      // 📝 Log de generación de reporte
      await this.logAuditAction(userId, 'audit_report_generated', {
        reportType: type,
        format,
        reportId
      })

      return {
        report,
        downloadUrl,
        expiresAt
      }

    } catch (error) {
      console.error('❌ Error generating audit report:', error)
      throw new Error(`Failed to generate audit report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ✅ Marcar evento como revisado
   */
  async markEventAsReviewed(
    eventId: string,
    reviewedBy: string,
    resolution: string,
    reviewNotes?: string
  ): Promise<{
    eventId: string
    resolution: string
    reviewedBy: string
    reviewedAt: string
  }> {
    try {
      // TODO: Implementar cuando tengamos la tabla SecurityEvent
      // Por ahora simulamos
      
      const reviewedAt = new Date().toISOString()

      // 📝 Log de revisión
      await this.logAuditAction(reviewedBy, 'security_event_reviewed', {
        eventId,
        resolution,
        reviewNotes
      })

      return {
        eventId,
        resolution,
        reviewedBy,
        reviewedAt
      }

    } catch (error) {
      console.error('❌ Error marking event as reviewed:', error)
      throw new Error(`Failed to mark event as reviewed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📈 Obtener estadísticas de auditoría
   */
  async getAuditStatistics(period: string, groupBy: string): Promise<{
    overview: Record<string, any>
    trends: any[]
    topUsers: any[]
    topActions: any[]
    securityMetrics: Record<string, any>
  }> {
    try {
      const periodDays = this.getPeriodInDays(period)
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

      // 📊 Overview general
      const [totalLogs, uniqueUsersData, uniqueActionsData] = await Promise.all([
        prisma.documentActivity.count({
          where: { createdAt: { gte: startDate } }
        }),
        prisma.documentActivity.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: startDate } },
          _count: true
        }),
        prisma.documentActivity.groupBy({
          by: ['action'],
          where: { createdAt: { gte: startDate } },
          _count: true
        })
      ])

      const totalUsers = uniqueUsersData.length
      const totalActions = uniqueActionsData.length

      const overview = {
        totalLogs,
        totalUsers,
        totalActions,
        period,
        averageLogsPerDay: Math.round(totalLogs / periodDays)
      }

      // 📈 Tendencias temporales
      const trends = await this.getAuditTrends(startDate, groupBy)

      // 👥 Usuarios más activos
      const topUsers = await this.getTopActiveUsers(startDate, 10)

      // 🎯 Acciones más frecuentes
      const topActions = await this.getTopActions(startDate, 10)

      // 🔒 Métricas de seguridad
      const securityMetrics = await this.getSecurityMetrics(startDate)

      return {
        overview,
        trends,
        topUsers,
        topActions,
        securityMetrics
      }

    } catch (error) {
      console.error('❌ Error getting audit statistics:', error)
      throw new Error(`Failed to get audit statistics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📝 Registrar acción de auditoría
   */
  async logAuditAction(
    userId: string,
    action: string,
    details: Record<string, any> = {},
    options: {
      resource?: string
      resourceId?: string
      workspace?: string
      level?: 'info' | 'warning' | 'error'
      ipAddress?: string
      userAgent?: string
    } = {}
  ): Promise<void> {
    try {
      // Solo registrar si hay un documento asociado (ya que documentActivity requiere documentId)
      if (options.resourceId && options.resource === 'document') {
        await prisma.documentActivity.create({
          data: {
            userId,
            documentId: options.resourceId,
            action,
            ipAddress: options.ipAddress,
            userAgent: options.userAgent,
            details: details,
            createdAt: new Date()
          }
        })
      }
      // Para otras acciones sin documento, las registramos en el log pero no en BD
      else {
        console.log(`📝 Audit action logged: ${action} by user ${userId}`, {
          ...details,
          ...options
        })
      }

    } catch (error) {
      console.error('❌ Error logging audit action:', error)
      // No re-lanzar error para no interrumpir la operación principal
    }
  }

  // 📊 Métodos privados para generar estadísticas

  private async generateLogsSummary(where: any): Promise<Record<string, any>> {
    const [
      byAction,
      recentActions
    ] = await Promise.all([
      prisma.documentActivity.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      prisma.documentActivity.findMany({
        where,
        include: {
          document: {
            select: {
              workspace: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ])

    // Generar estadísticas por workspace desde los documentos
    const workspaceStats: Record<string, number> = {}
    recentActions.forEach(activity => {
      const workspace = activity.document?.workspace || 'unknown'
      workspaceStats[workspace] = (workspaceStats[workspace] || 0) + 1
    })

    return {
      byLevel: {
        info: recentActions.length, // Todas las actividades se consideran 'info'
        warning: 0,
        error: 0
      },
      topActions: byAction.map((item: PrismaGroupByAction) => ({
        action: item.action,
        count: item._count
      })),
      byWorkspace: workspaceStats
    }
  }

  private async calculateUserStatistics(userId: string, activity: any[], days: number) {
    // 📊 Calcular estadísticas del usuario
    const actionsByType = activity.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const loginCount = activity.filter(log => log.action === 'user_login').length
    const documentsCreated = activity.filter(log => log.action === 'document_created').length
    const documentsAccessed = activity.filter(log => log.action === 'document_accessed').length

    const lastActivity = activity.length > 0 ? activity[0].createdAt : new Date()
    const averageSessionLength = loginCount > 0 ? (days * 24 * 60) / loginCount : 0 // minutos

    return {
      totalActions: activity.length,
      actionsByType,
      lastActivity,
      averageSessionLength: Math.round(averageSessionLength),
      loginCount,
      documentsCreated,
      documentsAccessed
    }
  }

  private async assessUserRisk(userId: string, activity: any[], statistics: any) {
    // 🛡️ Evaluación básica de riesgo
    let score = 0
    const factors: string[] = []
    const recommendations: string[] = []

    // Factores de riesgo
    if (statistics.loginCount > 50) {
      score += 10
      factors.push('Alto número de logins')
    }

    if (activity.filter(log => log.level === 'error').length > 5) {
      score += 20
      factors.push('Múltiples errores en actividades')
    }

    if (statistics.averageSessionLength > 8 * 60) { // Más de 8 horas
      score += 15
      factors.push('Sesiones muy largas')
    }

    // Determinar nivel de riesgo
    let level: 'low' | 'medium' | 'high'
    if (score < 20) {
      level = 'low'
      recommendations.push('Continuar monitoreando actividad normal')
    } else if (score < 40) {
      level = 'medium'
      recommendations.push('Revisar patrones de actividad')
      recommendations.push('Verificar permisos de acceso')
    } else {
      level = 'high'
      recommendations.push('Investigación inmediata requerida')
      recommendations.push('Considerar restricción temporal de acceso')
    }

    return { score, level, factors, recommendations }
  }

  private async buildAuditReport(type: string, startDate?: string, endDate?: string, includeCharts: boolean = true) {
    // TODO: Implementar generación completa de reportes
    return {
      metadata: {
        type,
        generatedAt: new Date().toISOString(),
        period: { startDate, endDate },
        includeCharts
      },
      summary: {
        totalLogs: 1234,
        totalUsers: 45,
        topActions: ['user_login', 'document_created', 'document_viewed']
      },
      charts: includeCharts ? {
        activityOverTime: [],
        actionDistribution: [],
        userActivity: []
      } : null
    }
  }

  private getPeriodInDays(period: string): number {
    switch (period) {
      case '7d': return 7
      case '30d': return 30
      case '90d': return 90
      case '1y': return 365
      default: return 30
    }
  }

  private async getAuditTrends(startDate: Date, groupBy: string) {
    // TODO: Implementar tendencias reales
    return []
  }

  private async getTopActiveUsers(startDate: Date, limit: number) {
    // TODO: Implementar usuarios más activos
    return []
  }

  private async getTopActions(startDate: Date, limit: number) {
    // TODO: Implementar acciones más frecuentes
    return []
  }

  private async getSecurityMetrics(startDate: Date) {
    // TODO: Implementar métricas de seguridad
    return {
      failedLogins: 0,
      suspiciousActivity: 0,
      securityIncidents: 0
    }
  }
}

// 🎯 Instancia singleton del servicio
export const auditService = new AuditService()
