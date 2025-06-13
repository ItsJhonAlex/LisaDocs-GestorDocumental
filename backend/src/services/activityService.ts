import { prisma } from '../config/database'
import { FastifyRequest } from 'fastify'

// 📊 Tipos de actividad soportados
export type ActivityAction = 
  | 'uploaded' 
  | 'downloaded' 
  | 'deleted' 
  | 'archived' 
  | 'status_changed'
  | 'viewed'
  | 'updated'
  | 'created'

// 📋 Interface para crear actividad
interface CreateActivityParams {
  documentId: string
  userId: string
  action: ActivityAction
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// 📊 Interface para filtros de actividad
interface ActivityFilters {
  documentId?: string
  userId?: string
  action?: ActivityAction
  dateFrom?: Date
  dateTo?: Date
  workspace?: string
  limit?: number
  offset?: number
}

// 🏗️ Servicio de actividad de documentos
export class ActivityService {
  
  // 📝 Registrar actividad de documento
  async logActivity(params: CreateActivityParams): Promise<void> {
    try {
      await prisma.documentActivity.create({
        data: {
          documentId: params.documentId,
          userId: params.userId,
          action: params.action,
          details: params.details || {},
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          createdAt: new Date()
        }
      })

      console.log('✅ Activity logged:', {
        documentId: params.documentId,
        userId: params.userId,
        action: params.action
      })
    } catch (error) {
      console.error('❌ Error logging activity:', error)
      // No fallar la operación principal si falla el log
    }
  }

  // 📝 Helper para extraer info de request
  logFromRequest(
    documentId: string,
    userId: string,
    action: ActivityAction,
    request: FastifyRequest,
    details?: Record<string, any>
  ): Promise<void> {
    return this.logActivity({
      documentId,
      userId,
      action,
      details,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']
    })
  }

  // 📊 Obtener actividades con filtros
  async getActivities(filters: ActivityFilters = {}) {
    const {
      documentId,
      userId,
      action,
      dateFrom,
      dateTo,
      workspace,
      limit = 50,
      offset = 0
    } = filters

    // 🔍 Construir filtros where
    const whereClause: any = {}

    if (documentId) whereClause.documentId = documentId
    if (userId) whereClause.userId = userId
    if (action) whereClause.action = action
    
    if (dateFrom || dateTo) {
      whereClause.createdAt = {}
      if (dateFrom) whereClause.createdAt.gte = dateFrom
      if (dateTo) whereClause.createdAt.lte = dateTo
    }

    // 🔍 Si hay filtro de workspace, filtrar por documentos del workspace
    if (workspace) {
      whereClause.document = {
        workspace: workspace
      }
    }

    // 📊 Obtener actividades y conteo total
    const [activities, total] = await Promise.all([
      prisma.documentActivity.findMany({
        where: whereClause,
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
              fileName: true,
              workspace: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.documentActivity.count({
        where: whereClause
      })
    ])

    return {
      activities: activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        createdAt: activity.createdAt,
        user: activity.user,
        document: activity.document
      })),
      total,
      hasMore: total > offset + limit
    }
  }

  // 📊 Obtener estadísticas de actividad
  async getActivityStats(dateFrom?: Date, dateTo?: Date) {
    const whereClause: any = {}
    
    if (dateFrom || dateTo) {
      whereClause.createdAt = {}
      if (dateFrom) whereClause.createdAt.gte = dateFrom
      if (dateTo) whereClause.createdAt.lte = dateTo
    }

    // 📊 Estadísticas por acción
    const actionStats = await prisma.documentActivity.groupBy({
      by: ['action'],
      where: whereClause,
      _count: true,
      orderBy: {
        _count: {
          action: 'desc'
        }
      }
    })

    // 📊 Actividad por día (últimos 30 días)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyActivity = await prisma.$queryRaw`
      SELECT 
        DATE(created_at AT TIME ZONE 'UTC') as date,
        action,
        COUNT(*)::int as count
      FROM document_activities 
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at AT TIME ZONE 'UTC'), action
      ORDER BY date DESC
    ` as Array<{ date: Date; action: string; count: number }>

    // 👥 Usuarios más activos
    const topUsers = await prisma.documentActivity.groupBy({
      by: ['userId'],
      where: whereClause,
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    })

    // 📄 Documentos más activos
    const topDocuments = await prisma.documentActivity.groupBy({
      by: ['documentId'],
      where: whereClause,
      _count: true,
      orderBy: {
        _count: {
          documentId: 'desc'
        }
      },
      take: 10
    })

    return {
      actionStats: actionStats.map(stat => ({
        action: stat.action,
        count: stat._count
      })),
      dailyActivity,
      topUsers: topUsers.map(user => ({
        userId: user.userId,
        count: user._count
      })),
      topDocuments: topDocuments.map(doc => ({
        documentId: doc.documentId,
        count: doc._count
      }))
    }
  }

  // 📊 Obtener actividad reciente (para dashboard)
  async getRecentActivity(limit: number = 20) {
    const activities = await prisma.documentActivity.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        document: {
          select: {
            id: true,
            title: true,
            fileName: true,
            workspace: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      createdAt: activity.createdAt,
      user: activity.user,
      document: activity.document,
      description: this.generateActivityDescription(activity.action, activity.user.fullName, activity.document.title)
    }))
  }

  // 📝 Generar descripción legible de la actividad
  private generateActivityDescription(action: string, userName: string, documentTitle: string): string {
    const actionMap: Record<string, string> = {
      uploaded: 'subió el documento',
      downloaded: 'descargó el documento',
      deleted: 'eliminó el documento',
      archived: 'archivó el documento',
      status_changed: 'cambió el estado del documento',
      viewed: 'visualizó el documento',
      updated: 'actualizó el documento',
      created: 'creó el documento'
    }

    const actionText = actionMap[action] || `realizó la acción ${action} en el documento`
    return `${userName} ${actionText} "${documentTitle}"`
  }
}

// 🏭 Instancia singleton del servicio
export const activityService = new ActivityService() 