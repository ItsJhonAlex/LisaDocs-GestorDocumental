import { prisma } from '../config/database'
import { userService } from './userService'
import { auditService } from './auditService'

// 📋 Interfaces para el servicio de notificaciones
export interface Notification {
  id: string
  title: string
  content: string
  type: NotificationType
  priority: NotificationPriority
  status: NotificationStatus
  recipientCount: number
  readCount: number
  createdBy: string
  createdAt: Date
  expiresAt?: Date
  metadata?: Record<string, any>
  actionRequired: boolean
  actionUrl?: string
  actionText?: string
  category?: string
  tags?: string[]
}

export interface UserNotification {
  id: string
  notificationId: string
  userId: string
  isRead: boolean
  readAt?: Date
  isArchived: boolean
  archivedAt?: Date
  deliveryMethod: string[]
  deliveredAt?: Date
  actionTaken: boolean
  actionTakenAt?: Date
  notification: Notification
}

export interface NotificationTemplate {
  id: string
  name: string
  description: string
  title: string
  content: string
  type: NotificationType
  priority: NotificationPriority
  variables: string[]
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'reminder' | 'task' | 'alert'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed' | 'expired'

// 📧 Servicio de notificaciones
export class NotificationService {

  /**
   * 📧 Crear notificación individual
   */
  async createNotification(data: {
    title: string
    content: string
    type: NotificationType
    priority?: NotificationPriority
    recipients: {
      type: string
      roles?: string[]
      workspaces?: string[]
      userIds?: string[]
      excludeUsers?: string[]
    }
    delivery?: {
      immediate?: boolean
      email?: boolean
      browser?: boolean
      scheduledAt?: string
    }
    metadata?: Record<string, any>
    expiresAt?: string
    actionRequired?: boolean
    actionUrl?: string
    actionText?: string
    category?: string
    tags?: string[]
    createdBy: string
  }): Promise<{
    notificationId: string
    status: string
    recipientCount: number
    deliveryStatus: Record<string, any>
    scheduledAt?: string
  }> {
    try {
      // 👥 Resolver destinatarios
      const recipients = await this.resolveRecipients(data.recipients)
      
      // 📧 Crear notificación en la base de datos
      const notification = await prisma.notification.create({
        data: {
          title: data.title,
          content: data.content,
          type: data.type,
          priority: data.priority || 'normal',
          status: data.delivery?.scheduledAt ? 'scheduled' : 'sent',
          recipientCount: recipients.length,
          readCount: 0,
          createdBy: data.createdBy,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
          metadata: data.metadata || {},
          actionRequired: data.actionRequired || false,
          actionUrl: data.actionUrl,
          actionText: data.actionText,
          category: data.category,
          tags: data.tags || [],
          createdAt: new Date()
        }
      })

      // 📨 Crear notificaciones individuales para cada destinatario
      const userNotifications = recipients.map(userId => ({
        notificationId: notification.id,
        userId,
        isRead: false,
        isArchived: false,
        deliveryMethod: this.getDeliveryMethods(data.delivery),
        actionTaken: false,
        createdAt: new Date()
      }))

      await prisma.userNotification.createMany({
        data: userNotifications
      })

      // 🚀 Enviar notificaciones inmediatas
      let deliveryStatus = {}
      if (data.delivery?.immediate !== false && !data.delivery?.scheduledAt) {
        deliveryStatus = await this.deliverNotifications(notification.id, data.delivery)
      }

      // 📝 Log de auditoría
      await auditService.logAuditAction(
        data.createdBy,
        'notification_created',
        {
          notificationId: notification.id,
          type: data.type,
          recipientCount: recipients.length,
          priority: data.priority
        },
        { level: 'info' }
      )

      return {
        notificationId: notification.id,
        status: notification.status,
        recipientCount: recipients.length,
        deliveryStatus,
        scheduledAt: data.delivery?.scheduledAt
      }

    } catch (error) {
      console.error('❌ Error creating notification:', error)
      throw new Error(`Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📧 Crear notificaciones en lote
   */
  async createBulkNotifications(data: {
    notifications: Array<{
      title: string
      content: string
      type: NotificationType
      priority?: NotificationPriority
      recipients: {
        type: string
        roles?: string[]
        workspaces?: string[]
        userIds?: string[]
        excludeUsers?: string[]
      }
    }>
    batchOptions?: {
      delayBetween?: number
      failurePolicy?: string
      retryAttempts?: number
    }
    createdBy: string
  }): Promise<{
    batchId: string
    totalCount: number
    successCount: number
    failureCount: number
    status: string
    results: any[]
    estimatedCompletion: string
  }> {
    try {
      const batchId = `batch_${Date.now()}`
      const results: any[] = []
      let successCount = 0
      let failureCount = 0

      // 📊 Procesar notificaciones en lote
      for (let i = 0; i < data.notifications.length; i++) {
        try {
          // ⏱️ Delay entre notificaciones si se especifica
          if (i > 0 && data.batchOptions?.delayBetween) {
            await new Promise(resolve => setTimeout(resolve, data.batchOptions!.delayBetween))
          }

          const result = await this.createNotification({
            ...data.notifications[i],
            createdBy: data.createdBy
          })

          results.push({
            index: i,
            success: true,
            notificationId: result.notificationId,
            recipientCount: result.recipientCount
          })
          successCount++

        } catch (error) {
          console.error(`❌ Error creating notification ${i}:`, error)
          
          results.push({
            index: i,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          failureCount++

          // 🛑 Política de fallos
          if (data.batchOptions?.failurePolicy === 'stop') {
            break
          }
        }
      }

      // 📝 Log de auditoría del lote
      await auditService.logAuditAction(
        data.createdBy,
        'bulk_notifications_created',
        {
          batchId,
          totalCount: data.notifications.length,
          successCount,
          failureCount
        },
        { level: failureCount > 0 ? 'warning' : 'info' }
      )

      return {
        batchId,
        totalCount: data.notifications.length,
        successCount,
        failureCount,
        status: failureCount === 0 ? 'completed' : 'partial',
        results,
        estimatedCompletion: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Error creating bulk notifications:', error)
      throw new Error(`Failed to create bulk notifications: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📢 Crear anuncio del sistema
   */
  async createSystemAnnouncement(data: {
    title: string
    content: string
    priority?: string
    scope?: string
    targetWorkspaces?: string[]
    targetRoles?: string[]
    publishAt?: string
    expiresAt?: string
    pinned?: boolean
    allowComments?: boolean
    requireAcknowledgment?: boolean
    createdBy: string
  }): Promise<{
    announcementId: string
    status: string
    recipientCount: number
    publishAt?: string
    expiresAt?: string
  }> {
    try {
      // 👥 Determinar destinatarios basado en el scope
      let recipients: {
        type: string
        roles?: string[]
        workspaces?: string[]
      }

      switch (data.scope) {
        case 'system':
          recipients = { type: 'all' }
          break
        case 'workspace':
          recipients = { type: 'workspace', workspaces: data.targetWorkspaces }
          break
        case 'role':
          recipients = { type: 'role', roles: data.targetRoles }
          break
        default:
          recipients = { type: 'all' }
      }

      // 📢 Crear como notificación especial de anuncio
      const result = await this.createNotification({
        title: data.title,
        content: data.content,
        type: 'announcement',
        priority: (data.priority as NotificationPriority) || 'normal',
        recipients,
        delivery: {
          immediate: !data.publishAt,
          email: true,
          browser: true,
          scheduledAt: data.publishAt
        },
        metadata: {
          scope: data.scope,
          pinned: data.pinned,
          allowComments: data.allowComments,
          requireAcknowledgment: data.requireAcknowledgment,
          isSystemAnnouncement: true
        },
        expiresAt: data.expiresAt,
        category: 'system_announcement',
        createdBy: data.createdBy
      })

      return {
        announcementId: result.notificationId,
        status: result.status,
        recipientCount: result.recipientCount,
        publishAt: data.publishAt,
        expiresAt: data.expiresAt
      }

    } catch (error) {
      console.error('❌ Error creating system announcement:', error)
      throw new Error(`Failed to create system announcement: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ⏰ Crear recordatorio
   */
  async createReminder(data: {
    title: string
    content: string
    reminderAt: string
    repeatOptions?: {
      enabled?: boolean
      interval?: string
      count?: number
      endDate?: string
    }
    recipients: {
      type: string
      roles?: string[]
      workspaces?: string[]
      userIds?: string[]
    }
    actionRequired?: boolean
    actionUrl?: string
    actionText?: string
    createdBy: string
  }): Promise<{
    reminderId: string
    status: string
    nextExecution: string
    recipientCount: number
    repeatCount?: number
  }> {
    try {
      // ⏰ Crear recordatorio base
      const result = await this.createNotification({
        title: data.title,
        content: data.content,
        type: 'reminder',
        priority: 'normal',
        recipients: data.recipients,
        delivery: {
          immediate: false,
          email: true,
          browser: true,
          scheduledAt: data.reminderAt
        },
        metadata: {
          isReminder: true,
          repeatOptions: data.repeatOptions,
          originalSchedule: data.reminderAt
        },
        actionRequired: data.actionRequired,
        actionUrl: data.actionUrl,
        actionText: data.actionText,
        category: 'reminder',
        createdBy: data.createdBy
      })

      // 📅 Configurar repeticiones si están habilitadas
      let repeatCount = 0
      if (data.repeatOptions?.enabled && data.repeatOptions.count) {
        repeatCount = await this.scheduleRepeatingReminder(
          result.notificationId,
          data.reminderAt,
          data.repeatOptions
        )
      }

      return {
        reminderId: result.notificationId,
        status: 'scheduled',
        nextExecution: data.reminderAt,
        recipientCount: result.recipientCount,
        repeatCount: repeatCount > 0 ? repeatCount : undefined
      }

    } catch (error) {
      console.error('❌ Error creating reminder:', error)
      throw new Error(`Failed to create reminder: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📄 Crear notificación desde plantilla
   */
  async createFromTemplate(data: {
    templateId: string
    variables?: Record<string, any>
    recipients: {
      type: string
      roles?: string[]
      workspaces?: string[]
      userIds?: string[]
    }
    priority?: string
    delivery?: {
      immediate?: boolean
      email?: boolean
      browser?: boolean
      scheduledAt?: string
    }
    createdBy: string
  }): Promise<{
    notificationId: string
    templateUsed: string
    status: string
    recipientCount: number
  }> {
    try {
      // 📄 Obtener plantilla
      const template = await this.getNotificationTemplate(data.templateId)
      if (!template) {
        throw new Error('Notification template not found')
      }

      // 🔄 Procesar variables en el contenido
      const processedTitle = this.processTemplateVariables(template.title, data.variables || {})
      const processedContent = this.processTemplateVariables(template.content, data.variables || {})

      // 📧 Crear notificación desde plantilla
      const result = await this.createNotification({
        title: processedTitle,
        content: processedContent,
        type: template.type,
        priority: (data.priority as NotificationPriority) || template.priority,
        recipients: data.recipients,
        delivery: data.delivery,
        metadata: {
          templateId: data.templateId,
          templateName: template.name,
          variables: data.variables
        },
        category: 'template',
        createdBy: data.createdBy
      })

      return {
        notificationId: result.notificationId,
        templateUsed: template.name,
        status: result.status,
        recipientCount: result.recipientCount
      }

    } catch (error) {
      console.error('❌ Error creating notification from template:', error)
      throw new Error(`Failed to create notification from template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📋 Obtener notificaciones del usuario
   */
  async getUserNotifications(
    userId: string,
    filters: {
      isRead?: boolean
      isArchived?: boolean
      type?: string
      priority?: string
      category?: string
      startDate?: string
      endDate?: string
      limit?: number
      offset?: number
    }
  ): Promise<{
    notifications: UserNotification[]
    total: number
    unreadCount: number
    hasMore: boolean
  }> {
    try {
      // 🔍 Construir filtros
      const where: any = { userId }
      
      if (filters.isRead !== undefined) where.isRead = filters.isRead
      if (filters.isArchived !== undefined) where.isArchived = filters.isArchived
      
      const notificationWhere: any = {}
      if (filters.type) notificationWhere.type = filters.type
      if (filters.priority) notificationWhere.priority = filters.priority
      if (filters.category) notificationWhere.category = filters.category
      if (filters.startDate) notificationWhere.createdAt = { gte: new Date(filters.startDate) }
      if (filters.endDate) {
        notificationWhere.createdAt = {
          ...notificationWhere.createdAt,
          lte: new Date(filters.endDate)
        }
      }

      if (Object.keys(notificationWhere).length > 0) {
        where.notification = notificationWhere
      }

      const limit = filters.limit || 50
      const offset = filters.offset || 0

      // 📊 Obtener notificaciones y conteos
      const [notifications, total, unreadCount] = await Promise.all([
        prisma.userNotification.findMany({
          where,
          include: {
            notification: true
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.userNotification.count({ where }),
        prisma.userNotification.count({
          where: { userId, isRead: false, isArchived: false }
        })
      ])

      // 📋 Formatear notificaciones
      const formattedNotifications: UserNotification[] = notifications.map((un: any) => ({
        id: un.id,
        notificationId: un.notificationId,
        userId: un.userId,
        isRead: un.isRead,
        readAt: un.readAt || undefined,
        isArchived: un.isArchived,
        archivedAt: un.archivedAt || undefined,
        deliveryMethod: Array.isArray(un.deliveryMethod) ? un.deliveryMethod : [],
        deliveredAt: un.deliveredAt || undefined,
        actionTaken: un.actionTaken,
        actionTakenAt: un.actionTakenAt || undefined,
        notification: {
          id: un.notification.id,
          title: un.notification.title,
          content: un.notification.content,
          type: un.notification.type as NotificationType,
          priority: un.notification.priority as NotificationPriority,
          status: un.notification.status as NotificationStatus,
          recipientCount: un.notification.recipientCount,
          readCount: un.notification.readCount,
          createdBy: un.notification.createdBy,
          createdAt: un.notification.createdAt,
          expiresAt: un.notification.expiresAt || undefined,
          metadata: un.notification.metadata as Record<string, any>,
          actionRequired: un.notification.actionRequired,
          actionUrl: un.notification.actionUrl || undefined,
          actionText: un.notification.actionText || undefined,
          category: un.notification.category || undefined,
          tags: Array.isArray(un.notification.tags) ? un.notification.tags : []
        }
      }))

      return {
        notifications: formattedNotifications,
        total,
        unreadCount,
        hasMore: offset + limit < total
      }

    } catch (error) {
      console.error('❌ Error getting user notifications:', error)
      throw new Error(`Failed to get user notifications: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ✅ Marcar notificación como leída
   */
  async markAsRead(notificationId: string, userId: string): Promise<{
    success: boolean
    readAt: string
  }> {
    try {
      const readAt = new Date()

      await prisma.userNotification.updateMany({
        where: {
          notificationId,
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt
        }
      })

      // 📊 Actualizar contador de leídos en la notificación
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          readCount: {
            increment: 1
          }
        }
      })

      return {
        success: true,
        readAt: readAt.toISOString()
      }

    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
      throw new Error(`Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📊 Obtener estadísticas de notificaciones
   */
  async getNotificationStatistics(period: string): Promise<{
    overview: Record<string, any>
    trends: any[]
    topTypes: any[]
    deliveryStats: Record<string, any>
    userEngagement: Record<string, any>
  }> {
    try {
      const periodDays = this.getPeriodInDays(period)
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

      // 📊 Overview general
      const [totalNotifications, totalRecipients, averageReadRate] = await Promise.all([
        prisma.notification.count({
          where: { createdAt: { gte: startDate } }
        }),
        prisma.userNotification.count({
          where: { createdAt: { gte: startDate } }
        }),
        this.calculateAverageReadRate(startDate)
      ])

      const overview = {
        totalNotifications,
        totalRecipients,
        averageReadRate,
        period,
        averageNotificationsPerDay: Math.round(totalNotifications / periodDays)
      }

      // 📈 Tendencias (simuladas por ahora)
      const trends = await this.getNotificationTrends(startDate)

      // 🎯 Tipos más usados
      const topTypes = await this.getTopNotificationTypes(startDate)

      // 📨 Estadísticas de entrega
      const deliveryStats = await this.getDeliveryStatistics(startDate)

      // 👥 Engagement de usuarios
      const userEngagement = await this.getUserEngagementStats(startDate)

      return {
        overview,
        trends,
        topTypes,
        deliveryStats,
        userEngagement
      }

    } catch (error) {
      console.error('❌ Error getting notification statistics:', error)
      throw new Error(`Failed to get notification statistics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 🔧 Métodos privados auxiliares

  private async resolveRecipients(recipients: {
    type: string
    roles?: string[]
    workspaces?: string[]
    userIds?: string[]
    excludeUsers?: string[]
  }): Promise<string[]> {
    let userIds: string[] = []

    switch (recipients.type) {
      case 'all':
        const allUsers = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true }
        })
        userIds = allUsers.map((u: any) => u.id)
        break

      case 'role':
        if (recipients.roles && recipients.roles.length > 0) {
          const roleUsers = await prisma.user.findMany({
            where: {
              isActive: true,
              role: { in: recipients.roles }
            },
            select: { id: true }
          })
          userIds = roleUsers.map((u: any) => u.id)
        }
        break

      case 'workspace':
        if (recipients.workspaces && recipients.workspaces.length > 0) {
          const workspaceUsers = await prisma.user.findMany({
            where: {
              isActive: true,
              workspace: { in: recipients.workspaces }
            },
            select: { id: true }
          })
          userIds = workspaceUsers.map((u: any) => u.id)
        }
        break

      case 'specific':
        userIds = recipients.userIds || []
        break

      default:
        throw new Error(`Unsupported recipient type: ${recipients.type}`)
    }

    // 🚫 Excluir usuarios específicos
    if (recipients.excludeUsers && recipients.excludeUsers.length > 0) {
      userIds = userIds.filter(id => !recipients.excludeUsers!.includes(id))
    }

    return [...new Set(userIds)] // Eliminar duplicados
  }

  private getDeliveryMethods(delivery?: {
    immediate?: boolean
    email?: boolean
    browser?: boolean
    scheduledAt?: string
  }): string[] {
    const methods: string[] = []
    
    if (delivery?.browser !== false) methods.push('browser')
    if (delivery?.email) methods.push('email')
    
    return methods
  }

  private async deliverNotifications(notificationId: string, delivery?: any): Promise<Record<string, any>> {
    // TODO: Implementar entrega real (email, browser push, etc.)
    return {
      browser: { status: 'delivered', count: 0 },
      email: { status: 'delivered', count: 0 }
    }
  }

  private async scheduleRepeatingReminder(notificationId: string, startDate: string, options: any): Promise<number> {
    // TODO: Implementar programación de recordatorios repetitivos
    return options.count || 0
  }

  private async getNotificationTemplate(templateId: string): Promise<NotificationTemplate | null> {
    // TODO: Implementar cuando tengamos la tabla de plantillas
    return null
  }

  private processTemplateVariables(content: string, variables: Record<string, any>): string {
    let processedContent = content
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), String(value))
    })
    
    return processedContent
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

  private async calculateAverageReadRate(startDate: Date): Promise<number> {
    // TODO: Implementar cálculo real
    return 75.5 // Porcentaje simulado
  }

  private async getNotificationTrends(startDate: Date): Promise<any[]> {
    // TODO: Implementar tendencias reales
    return []
  }

  private async getTopNotificationTypes(startDate: Date): Promise<any[]> {
    const topTypes = await prisma.notification.groupBy({
      by: ['type'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      orderBy: { _count: { type: 'desc' } },
      take: 10
    })

    return topTypes.map((item: any) => ({
      type: item.type,
      count: item._count,
      percentage: 0 // TODO: Calcular porcentaje real
    }))
  }

  private async getDeliveryStatistics(startDate: Date): Promise<Record<string, any>> {
    // TODO: Implementar estadísticas reales de entrega
    return {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      pending: 0
    }
  }

  private async getUserEngagementStats(startDate: Date): Promise<Record<string, any>> {
    // TODO: Implementar estadísticas reales de engagement
    return {
      totalUsers: 0,
      activeUsers: 0,
      averageReadTime: 0,
      engagementRate: 0
    }
  }
}

// 🎯 Instancia singleton del servicio
export const notificationService = new NotificationService()
