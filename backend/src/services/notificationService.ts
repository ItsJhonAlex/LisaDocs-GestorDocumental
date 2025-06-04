import { prisma } from '../config/database'
import { userService } from './userService'
import { auditService } from './auditService'
import { NotificationType, WorkspaceType, UserRole } from '../generated/prisma'

// 📋 Interfaces para el servicio de notificaciones (adaptadas al esquema real)
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  relatedDocumentId?: string
  isRead: boolean
  readAt?: Date
  expiresAt?: Date
  createdAt: Date
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

// Tipos extendidos para el servicio (que no están en Prisma)
export type ExtendedNotificationType = NotificationType | 'info' | 'success' | 'announcement' | 'reminder' | 'task' | 'alert'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed' | 'expired'

// 📧 Servicio de notificaciones
export class NotificationService {

  /**
   * 📧 Crear notificación individual
   */
  async createNotification(data: {
    title: string
    message: string
    type: NotificationType
    userId: string
    relatedDocumentId?: string
    expiresAt?: string
  }): Promise<{
    notificationId: string
    status: string
    recipientCount: number
  }> {
    try {
      // 📧 Crear notificación en la base de datos
      const notification = await prisma.notification.create({
        data: {
          title: data.title,
          message: data.message,
          type: data.type,
          userId: data.userId,
          relatedDocumentId: data.relatedDocumentId,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
          isRead: false,
          createdAt: new Date()
        }
      })

      return {
        notificationId: notification.id,
        status: 'sent',
        recipientCount: 1
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
      message: string
      type: NotificationType
      userId: string
      relatedDocumentId?: string
    }>
  }): Promise<{
    batchId: string
    totalCount: number
    successCount: number
    failureCount: number
    status: string
    results: any[]
  }> {
    try {
      const batchId = `batch_${Date.now()}`
      const results: any[] = []
      let successCount = 0
      let failureCount = 0

      // 📊 Procesar notificaciones en lote
      for (let i = 0; i < data.notifications.length; i++) {
        try {
          const result = await this.createNotification(data.notifications[i])

          results.push({
            index: i,
            success: true,
            notificationId: result.notificationId
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
        }
      }

      return {
        batchId,
        totalCount: data.notifications.length,
        successCount,
        failureCount,
        status: failureCount === 0 ? 'completed' : 'partial',
        results
      }

    } catch (error) {
      console.error('❌ Error creating bulk notifications:', error)
      throw new Error(`Failed to create bulk notifications: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📢 Crear anuncio del sistema (para todos los usuarios)
   */
  async createSystemAnnouncement(data: {
    title: string
    message: string
    targetWorkspaces?: WorkspaceType[]
    targetRoles?: UserRole[]
    expiresAt?: string
  }): Promise<{
    announcementId: string
    status: string
    recipientCount: number
  }> {
    try {
      // 👥 Obtener usuarios objetivo
      const where: any = { isActive: true }
      
      if (data.targetWorkspaces && data.targetWorkspaces.length > 0) {
        where.workspace = { in: data.targetWorkspaces }
      }
      
      if (data.targetRoles && data.targetRoles.length > 0) {
        where.role = { in: data.targetRoles }
      }

      const users = await prisma.user.findMany({
        where,
        select: { id: true }
      })

      // 📢 Crear notificaciones para todos los usuarios
      const notifications = users.map(user => ({
        title: data.title,
        message: data.message,
        type: 'system_message' as NotificationType,
        userId: user.id,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        isRead: false,
        createdAt: new Date()
      }))

      await prisma.notification.createMany({
        data: notifications
      })

      return {
        announcementId: `announcement_${Date.now()}`,
        status: 'sent',
        recipientCount: users.length
      }

    } catch (error) {
      console.error('❌ Error creating system announcement:', error)
      throw new Error(`Failed to create system announcement: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      // 🔍 Construir filtros para el esquema real
      const where: any = { userId }
      
      if (filters.isRead !== undefined) where.isRead = filters.isRead
      if (filters.type && ['document_uploaded', 'document_archived', 'system_message', 'warning'].includes(filters.type)) {
        where.type = filters.type as NotificationType
      }
      if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) }
      if (filters.endDate) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(filters.endDate)
        }
      }

      const limit = filters.limit || 50
      const offset = filters.offset || 0

      // 📊 Obtener notificaciones y conteos
      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            relatedDocument: {
              select: {
                id: true,
                title: true,
                fileName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: { userId, isRead: false }
        })
      ])

      // 📋 Formatear notificaciones para compatibilidad con las rutas
      const formattedNotifications: UserNotification[] = notifications.map((notification: any) => ({
        id: notification.id,
        notificationId: notification.id, // En el esquema real, no hay tabla separada
        userId: notification.userId,
        isRead: notification.isRead,
        readAt: notification.readAt || undefined,
        isArchived: false, // No existe en el esquema real
        archivedAt: undefined,
        deliveryMethod: ['browser'], // Simulado
        deliveredAt: notification.createdAt,
        actionTaken: false, // No existe en el esquema real
        actionTakenAt: undefined,
        notification: {
          id: notification.id,
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          relatedDocumentId: notification.relatedDocumentId || undefined,
          isRead: notification.isRead,
          readAt: notification.readAt || undefined,
          expiresAt: notification.expiresAt || undefined,
          createdAt: notification.createdAt
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

      const result = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt
        }
      })

      return {
        success: result.count > 0,
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
      const [totalNotifications, averageReadRate] = await Promise.all([
        prisma.notification.count({
          where: { createdAt: { gte: startDate } }
        }),
        this.calculateAverageReadRate(startDate)
      ])

      const overview = {
        totalNotifications,
        totalRecipients: totalNotifications, // En el esquema real, cada notificación tiene un destinatario
        averageReadRate,
        period,
        averageNotificationsPerDay: Math.round(totalNotifications / periodDays)
      }

      // 📈 Tendencias (simuladas por ahora)
      const trends = await this.getNotificationTrends(startDate)

      // 🎯 Tipos más usados
      const topTypes = await this.getTopNotificationTypes(startDate)

      // 📨 Estadísticas de entrega (simuladas)
      const deliveryStats = await this.getDeliveryStatistics(startDate)

      // 👥 Engagement de usuarios (simulado)
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
    const [total, read] = await Promise.all([
      prisma.notification.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.notification.count({
        where: { 
          createdAt: { gte: startDate },
          isRead: true
        }
      })
    ])

    return total > 0 ? Math.round((read / total) * 100 * 100) / 100 : 0
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

    const total = await prisma.notification.count({
      where: { createdAt: { gte: startDate } }
    })

    return topTypes.map((item: any) => ({
      type: item.type,
      count: item._count,
      percentage: total > 0 ? Math.round((item._count / total) * 100 * 100) / 100 : 0
    }))
  }

  private async getDeliveryStatistics(startDate: Date): Promise<Record<string, any>> {
    const total = await prisma.notification.count({
      where: { createdAt: { gte: startDate } }
    })

    return {
      totalSent: total,
      delivered: total, // Asumimos que todas se entregan
      failed: 0,
      pending: 0
    }
  }

  private async getUserEngagementStats(startDate: Date): Promise<Record<string, any>> {
    const [totalUsers, activeUsers, readRate] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.notification.findMany({
        where: { createdAt: { gte: startDate } },
        select: { userId: true },
        distinct: ['userId']
      }).then(result => result.length),
      this.calculateAverageReadRate(startDate)
    ])

    return {
      totalUsers,
      activeUsers,
      averageReadTime: 0, // No tenemos esta métrica
      engagementRate: readRate
    }
  }
}

// 🎯 Instancia singleton del servicio
export const notificationService = new NotificationService()
