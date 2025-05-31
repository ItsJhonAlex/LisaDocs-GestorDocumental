import { prisma } from '../config/database'
import { WorkspaceType, UserRole, DocumentStatus } from '../generated/prisma'
import { userService } from './userService'
import { permissionService } from './permissionService'
import { documentService } from './documentService'

// 📋 Interfaces para el servicio de workspaces
export interface WorkspaceInfo {
  id: string
  name: string
  description: string
  documentsCount: number
  usersCount: number
  hasAccess: boolean
  bucket?: string
}

export interface WorkspaceDetails extends WorkspaceInfo {
  recentDocuments: any[]
  stats: WorkspaceStats
  permissions: string[]
}

export interface WorkspaceStats {
  totalDocuments: number
  documentsByStatus: Record<DocumentStatus, number>
  totalUsers: number
  usersByRole: Record<string, number>
  storageUsed: string
  recentActivity: any[]
}

export interface WorkspaceUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
  lastActivity?: Date
}

// 🏢 Servicio de workspaces
export class WorkspaceService {

  /**
   * 🏢 Obtener información de todos los workspaces
   */
  async getAllWorkspacesInfo(userId: string): Promise<{
    workspaces: WorkspaceInfo[]
  }> {
    try {
      const user = await userService.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const workspaces: WorkspaceInfo[] = []

      // 📊 Información básica de cada workspace
      const workspaceDefinitions = this.getWorkspaceDefinitions()

      for (const [workspaceId, definition] of Object.entries(workspaceDefinitions)) {
        const workspace = workspaceId as WorkspaceType

        // 🔍 Verificar si el usuario tiene acceso
        const hasAccess = await this.hasWorkspaceAccess(userId, workspace)

        // 📊 Contar documentos y usuarios
        const [documentsCount, usersCount] = await Promise.all([
          prisma.document.count({ where: { workspace } }),
          prisma.user.count({ where: { workspace, isActive: true } })
        ])

        workspaces.push({
          id: workspace,
          name: definition.name,
          description: definition.description,
          documentsCount: hasAccess ? documentsCount : 0,
          usersCount: hasAccess ? usersCount : 0,
          hasAccess,
          bucket: definition.bucket
        })
      }

      return { workspaces }

    } catch (error) {
      console.error('❌ Error getting workspaces info:', error)
      throw new Error(`Failed to get workspaces info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🏢 Obtener detalles específicos de un workspace
   */
  async getWorkspaceDetails(workspace: WorkspaceType, userId: string): Promise<WorkspaceDetails> {
    try {
      // ✅ Verificar acceso
      const hasAccess = await this.hasWorkspaceAccess(userId, workspace)
      if (!hasAccess) {
        throw new Error('Access denied to workspace')
      }

      const definition = this.getWorkspaceDefinitions()[workspace]
      if (!definition) {
        throw new Error('Workspace not found')
      }

      // 📊 Obtener estadísticas y datos
      const [stats, recentDocuments, permissions] = await Promise.all([
        this.getWorkspaceStats(workspace),
        this.getRecentDocuments(workspace, 5),
        this.getUserWorkspacePermissions(userId, workspace)
      ])

      return {
        id: workspace,
        name: definition.name,
        description: definition.description,
        documentsCount: stats.totalDocuments,
        usersCount: stats.totalUsers,
        hasAccess: true,
        bucket: definition.bucket,
        recentDocuments,
        stats,
        permissions
      }

    } catch (error) {
      console.error('❌ Error getting workspace details:', error)
      throw new Error(`Failed to get workspace details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📊 Obtener estadísticas del workspace
   */
  async getWorkspaceStats(workspace: WorkspaceType): Promise<WorkspaceStats> {
    try {
      const [
        totalDocuments,
        documentsByStatus,
        totalUsers,
        usersByRole,
        recentActivity,
        storageSum
      ] = await Promise.all([
        // Total de documentos
        prisma.document.count({ where: { workspace } }),
        
        // Documentos por estado
        prisma.document.groupBy({
          by: ['status'],
          where: { workspace },
          _count: true
        }),
        
        // Total de usuarios activos
        prisma.user.count({ 
          where: { workspace, isActive: true } 
        }),
        
        // Usuarios por rol
        prisma.user.groupBy({
          by: ['role'],
          where: { workspace, isActive: true },
          _count: true
        }),
        
        // Actividad reciente
        this.getRecentActivity(workspace, 10),
        
        // Suma de tamaños de archivos
        prisma.document.aggregate({
          where: { workspace },
          _sum: { fileSize: true }
        })
      ])

      // 📈 Formatear estadísticas por estado
      const statusStats = documentsByStatus.reduce((acc: Record<DocumentStatus, number>, item: { status: DocumentStatus; _count: number }) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<DocumentStatus, number>)

      // 📈 Formatear estadísticas por rol
      const roleStats = usersByRole.reduce((acc: Record<string, number>, item: { role: string; _count: number }) => {
        acc[item.role] = item._count
        return acc
      }, {} as Record<string, number>)

      // 📏 Formatear tamaño de almacenamiento
      const totalSizeBytes = Number(storageSum._sum.fileSize || 0)
      const storageUsed = this.formatFileSize(totalSizeBytes)

      return {
        totalDocuments,
        documentsByStatus: statusStats,
        totalUsers,
        usersByRole: roleStats,
        storageUsed,
        recentActivity
      }

    } catch (error) {
      console.error('❌ Error getting workspace stats:', error)
      throw new Error(`Failed to get workspace stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 👥 Obtener usuarios del workspace
   */
  async getWorkspaceUsers(workspace: WorkspaceType): Promise<{
    users: WorkspaceUser[]
    total: number
  }> {
    try {
      const users = await prisma.user.findMany({
        where: { workspace, isActive: true },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true
        },
        orderBy: { fullName: 'asc' }
      })

      const formattedUsers: WorkspaceUser[] = users.map((user: {
        id: string
        fullName: string
        email: string
        role: UserRole
        isActive: boolean
        lastLoginAt: Date | null
      }) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastActivity: user.lastLoginAt || undefined
      }))

      return {
        users: formattedUsers,
        total: users.length
      }

    } catch (error) {
      console.error('❌ Error getting workspace users:', error)
      throw new Error(`Failed to get workspace users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🔐 Verificar si un usuario tiene acceso a un workspace
   */
  async hasWorkspaceAccess(userId: string, workspace: WorkspaceType): Promise<boolean> {
    try {
      const workspaceAccess = await permissionService.checkWorkspaceAccess(userId, workspace)
      return workspaceAccess.hasAccess

    } catch (error) {
      console.error('❌ Error checking workspace access:', error)
      return false
    }
  }

  /**
   * 🔍 Obtener permisos del usuario en el workspace
   */
  async getUserWorkspacePermissions(userId: string, workspace: WorkspaceType): Promise<string[]> {
    try {
      const workspaceAccess = await permissionService.checkWorkspaceAccess(userId, workspace)
      return workspaceAccess.permissions

    } catch (error) {
      console.error('❌ Error getting user workspace permissions:', error)
      return []
    }
  }

  /**
   * 📄 Obtener documentos recientes del workspace
   */
  private async getRecentDocuments(workspace: WorkspaceType, limit: number = 5): Promise<any[]> {
    try {
      const documents = await prisma.document.findMany({
        where: { workspace },
        include: {
          createdByUser: {
            select: {
              id: true,
              fullName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return documents.map((doc: {
        id: string
        title: string
        status: any
        fileSize: bigint
        createdAt: Date
        createdByUser: {
          id: string
          fullName: string
          role: UserRole
        }
      }) => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        fileSize: Number(doc.fileSize),
        createdAt: doc.createdAt.toISOString(),
        createdBy: {
          id: doc.createdByUser.id,
          fullName: doc.createdByUser.fullName,
          role: doc.createdByUser.role
        }
      }))

    } catch (error) {
      console.error('❌ Error getting recent documents:', error)
      return []
    }
  }

  /**
   * 📊 Obtener actividad reciente del workspace
   */
  private async getRecentActivity(workspace: WorkspaceType, limit: number = 10): Promise<any[]> {
    try {
      // TODO: Implementar actividad desde DocumentActivity
      // Por ahora retornamos actividad básica desde documentos
      const activities = await prisma.document.findMany({
        where: { workspace },
        include: {
          createdByUser: {
            select: {
              fullName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return activities.map((doc: {
        id: string
        title: string
        createdAt: Date
        createdByUser: {
          fullName: string
          role: UserRole
        }
      }) => ({
        id: `doc_${doc.id}`,
        type: 'document_created',
        description: `Document "${doc.title}" was created`,
        user: {
          fullName: doc.createdByUser.fullName,
          role: doc.createdByUser.role
        },
        createdAt: doc.createdAt.toISOString()
      }))

    } catch (error) {
      console.error('❌ Error getting recent activity:', error)
      return []
    }
  }

  /**
   * 🏢 Obtener definiciones de workspaces
   */
  private getWorkspaceDefinitions(): Record<string, {
    name: string
    description: string
    bucket: string
  }> {
    return {
      cam: {
        name: 'CAM',
        description: 'Cámara de Comercio - Gestión de documentos comerciales y empresariales',
        bucket: 'lisadocs-cam'
      },
      ampp: {
        name: 'AMPP',
        description: 'Asociación de Municipalidades - Documentos municipales y administrativos',
        bucket: 'lisadocs-ampp'
      },
      presidencia: {
        name: 'Presidencia',
        description: 'Presidencia - Documentos ejecutivos y de alta dirección',
        bucket: 'lisadocs-presidencia'
      },
      intendencia: {
        name: 'Intendencia',
        description: 'Intendencia - Documentos de gestión territorial y administrativa',
        bucket: 'lisadocs-intendencia'
      },
      comisiones_cf: {
        name: 'Comisiones CF',
        description: 'Comisiones de Fiscalización - Documentos de control y supervisión',
        bucket: 'lisadocs-comisiones-cf'
      }
    }
  }

  /**
   * 📏 Formatear tamaño de archivo
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const size = (bytes / Math.pow(1024, i)).toFixed(2)
    
    return `${size} ${sizes[i]}`
  }
}

// 🎯 Instancia singleton del servicio
export const workspaceService = new WorkspaceService()
