import { UserRole, WorkspaceType } from '../generated/prisma'
import { userService } from './userService'

// 📋 Interfaces para el servicio de permisos
export interface UserCapabilities {
  documents: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    archive: boolean
    download: boolean
  }
  users: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
  admin: {
    manageUsers: boolean
    viewAuditLogs: boolean
    systemSettings: boolean
  }
  workspaces: {
    viewAll: boolean
    manageAll: boolean
    viewOwnWorkspace: boolean
    manageOwnWorkspace: boolean
  }
}

export interface WorkspaceAccess {
  hasAccess: boolean
  permissions: string[]
  reason?: string
}

export interface PermissionMatrix {
  roles: string[]
  workspaces: string[]
  permissions: Record<string, UserCapabilities>
}

// 🔐 Servicio de permisos
export class PermissionService {

  /**
   * 🎯 Obtener capacidades de un usuario por rol y workspace
   */
  async getUserCapabilities(userId: string): Promise<UserCapabilities> {
    try {
      const user = await userService.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      return this.generateCapabilitiesFromRole(user.role, user.workspace)

    } catch (error) {
      console.error('❌ Error getting user capabilities:', error)
      throw new Error(`Failed to get user capabilities: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🔍 Verificar si un usuario puede acceder a un workspace específico
   */
  async checkWorkspaceAccess(userId: string, workspace: WorkspaceType): Promise<WorkspaceAccess> {
    try {
      const user = await userService.getUserById(userId)
      if (!user) {
        return {
          hasAccess: false,
          permissions: [],
          reason: 'User not found'
        }
      }

      // 🔐 Administradores tienen acceso a todo
      if (user.role === 'administrador') {
        return {
          hasAccess: true,
          permissions: ['read', 'write', 'delete', 'manage_users', 'view_stats', 'archive', 'audit']
        }
      }

      // 👑 Presidente y vicepresidente tienen acceso a todo
      if (['presidente', 'vicepresidente'].includes(user.role)) {
        return {
          hasAccess: true,
          permissions: ['read', 'write', 'view_stats', 'archive', 'audit']
        }
      }

      // 👤 Los usuarios tienen acceso a su propio workspace
      if (user.workspace === workspace) {
        const permissions = this.getWorkspacePermissions(user.role, workspace)
        return {
          hasAccess: true,
          permissions
        }
      }

      // 📝 Secretarios tienen acceso de lectura a otros workspaces
      if (['secretario_cam', 'secretario_ampp', 'secretario_cf'].includes(user.role)) {
        return {
          hasAccess: true,
          permissions: ['read']
        }
      }

      // 🏢 Intendente tiene acceso de lectura limitado
      if (user.role === 'intendente') {
        return {
          hasAccess: true,
          permissions: ['read']
        }
      }

      // 👥 Miembros CF solo acceden a comisiones_cf
      if (user.role === 'cf_member') {
        if (workspace === 'comisiones_cf') {
          return {
            hasAccess: true,
            permissions: ['read', 'write']
          }
        }
        return {
          hasAccess: false,
          permissions: [],
          reason: 'CF members can only access comisiones_cf workspace'
        }
      }

      return {
        hasAccess: false,
        permissions: [],
        reason: 'Insufficient permissions for this workspace'
      }

    } catch (error) {
      console.error('❌ Error checking workspace access:', error)
      return {
        hasAccess: false,
        permissions: [],
        reason: 'Error checking permissions'
      }
    }
  }

  /**
   * 🔐 Verificar si un usuario puede realizar una acción específica
   */
  async canUserPerformAction(
    userId: string, 
    action: string, 
    resource: string = 'documents',
    targetWorkspace?: WorkspaceType
  ): Promise<boolean> {
    try {
      const capabilities = await this.getUserCapabilities(userId)
      
      // 🔍 Verificar acceso al workspace si se especifica
      if (targetWorkspace) {
        const workspaceAccess = await this.checkWorkspaceAccess(userId, targetWorkspace)
        if (!workspaceAccess.hasAccess) {
          return false
        }
      }

      // 🎯 Verificar capacidad específica
      switch (resource) {
        case 'documents':
          return (capabilities.documents as any)[action] || false
        case 'users':
          return (capabilities.users as any)[action] || false
        case 'admin':
          return (capabilities.admin as any)[action] || false
        case 'workspaces':
          return (capabilities.workspaces as any)[action] || false
        default:
          return false
      }

    } catch (error) {
      console.error('❌ Error checking user action:', error)
      return false
    }
  }

  /**
   * 🔍 Validar combinación rol-workspace
   */
  validateRoleWorkspaceCombination(role: UserRole, workspace: WorkspaceType): {
    valid: boolean
    reason?: string
  } {
    // 🔐 Administradores pueden estar en cualquier workspace
    if (role === 'administrador') {
      return { valid: true }
    }

    // 👑 Presidente y vicepresidente deben estar en presidencia
    if (['presidente', 'vicepresidente'].includes(role)) {
      if (workspace !== 'presidencia') {
        return {
          valid: false,
          reason: 'Presidents and vice-presidents must be assigned to "presidencia" workspace'
        }
      }
      return { valid: true }
    }

    // 📝 Secretarios deben estar en su workspace correspondiente
    if (role === 'secretario_cam' && workspace !== 'cam') {
      return {
        valid: false,
        reason: 'CAM secretaries must be assigned to "cam" workspace'
      }
    }

    if (role === 'secretario_ampp' && workspace !== 'ampp') {
      return {
        valid: false,
        reason: 'AMPP secretaries must be assigned to "ampp" workspace'
      }
    }

    if (role === 'secretario_cf' && workspace !== 'comisiones_cf') {
      return {
        valid: false,
        reason: 'CF secretaries must be assigned to "comisiones_cf" workspace'
      }
    }

    // 🏢 Intendente debe estar en intendencia
    if (role === 'intendente' && workspace !== 'intendencia') {
      return {
        valid: false,
        reason: 'Intendants must be assigned to "intendencia" workspace'
      }
    }

    // 👥 Miembros CF deben estar en comisiones_cf
    if (role === 'cf_member' && workspace !== 'comisiones_cf') {
      return {
        valid: false,
        reason: 'CF members must be assigned to "comisiones_cf" workspace'
      }
    }

    return { valid: true }
  }

  /**
   * 📊 Generar matriz completa de permisos del sistema
   */
  generatePermissionsMatrix(): PermissionMatrix {
    const roles = [
      'administrador', 'presidente', 'vicepresidente', 
      'secretario_cam', 'secretario_ampp', 'secretario_cf',
      'intendente', 'cf_member'
    ]

    const workspaces = [
      'presidencia', 'intendencia', 'cam', 'ampp', 'comisiones_cf'
    ]

    const permissions: Record<string, UserCapabilities> = {}

    roles.forEach(role => {
      workspaces.forEach(workspace => {
        const key = `${role}_${workspace}`
        permissions[key] = this.generateCapabilitiesFromRole(role as UserRole, workspace as WorkspaceType)
      })
    })

    return {
      roles,
      workspaces,
      permissions
    }
  }

  /**
   * 🎯 Generar capacidades específicas por rol y workspace
   */
  private generateCapabilitiesFromRole(role: UserRole, workspace: WorkspaceType): UserCapabilities {
    const baseCapabilities: UserCapabilities = {
      documents: {
        create: false,
        read: false,
        update: false,
        delete: false,
        archive: false,
        download: false
      },
      users: {
        create: false,
        read: false,
        update: false,
        delete: false
      },
      admin: {
        manageUsers: false,
        viewAuditLogs: false,
        systemSettings: false
      },
      workspaces: {
        viewAll: false,
        manageAll: false,
        viewOwnWorkspace: false,
        manageOwnWorkspace: false
      }
    }

    switch (role) {
      case 'administrador':
        return {
          documents: {
            create: true,
            read: true,
            update: true,
            delete: true,
            archive: true,
            download: true
          },
          users: {
            create: true,
            read: true,
            update: true,
            delete: true
          },
          admin: {
            manageUsers: true,
            viewAuditLogs: true,
            systemSettings: true
          },
          workspaces: {
            viewAll: true,
            manageAll: true,
            viewOwnWorkspace: true,
            manageOwnWorkspace: true
          }
        }

      case 'presidente':
      case 'vicepresidente':
        return {
          documents: {
            create: true,
            read: true,
            update: true,
            delete: false,
            archive: true,
            download: true
          },
          users: {
            create: false,
            read: true,
            update: false,
            delete: false
          },
          admin: {
            manageUsers: false,
            viewAuditLogs: true,
            systemSettings: false
          },
          workspaces: {
            viewAll: true,
            manageAll: false,
            viewOwnWorkspace: true,
            manageOwnWorkspace: true
          }
        }

      case 'secretario_cam':
      case 'secretario_ampp':
      case 'secretario_cf':
        return {
          documents: {
            create: true,
            read: true,
            update: true,
            delete: false,
            archive: true,
            download: true
          },
          users: {
            create: false,
            read: false,
            update: false,
            delete: false
          },
          admin: {
            manageUsers: false,
            viewAuditLogs: false,
            systemSettings: false
          },
          workspaces: {
            viewAll: false,
            manageAll: false,
            viewOwnWorkspace: true,
            manageOwnWorkspace: true
          }
        }

      case 'intendente':
        return {
          documents: {
            create: true,
            read: true,
            update: true,
            delete: false,
            archive: false,
            download: true
          },
          users: {
            create: false,
            read: false,
            update: false,
            delete: false
          },
          admin: {
            manageUsers: false,
            viewAuditLogs: false,
            systemSettings: false
          },
          workspaces: {
            viewAll: false,
            manageAll: false,
            viewOwnWorkspace: true,
            manageOwnWorkspace: true
          }
        }

      case 'cf_member':
        return {
          documents: {
            create: true,
            read: true,
            update: false,
            delete: false,
            archive: false,
            download: true
          },
          users: {
            create: false,
            read: false,
            update: false,
            delete: false
          },
          admin: {
            manageUsers: false,
            viewAuditLogs: false,
            systemSettings: false
          },
          workspaces: {
            viewAll: false,
            manageAll: false,
            viewOwnWorkspace: true,
            manageOwnWorkspace: false
          }
        }

      default:
        return baseCapabilities
    }
  }

  /**
   * 🔍 Obtener permisos específicos para un workspace
   */
  private getWorkspacePermissions(role: UserRole, workspace: WorkspaceType): string[] {
    const capabilities = this.generateCapabilitiesFromRole(role, workspace)
    const permissions: string[] = []

    // 📄 Permisos de documentos
    if (capabilities.documents.read) permissions.push('read')
    if (capabilities.documents.create) permissions.push('create')
    if (capabilities.documents.update) permissions.push('update')
    if (capabilities.documents.delete) permissions.push('delete')
    if (capabilities.documents.archive) permissions.push('archive')
    if (capabilities.documents.download) permissions.push('download')

    // 👥 Permisos de usuarios
    if (capabilities.users.read) permissions.push('view_users')
    if (capabilities.users.create) permissions.push('create_users')
    if (capabilities.users.update) permissions.push('update_users')

    // 🔐 Permisos de administración
    if (capabilities.admin.viewAuditLogs) permissions.push('audit')
    if (capabilities.admin.manageUsers) permissions.push('manage_users')
    if (capabilities.admin.systemSettings) permissions.push('system_settings')

    return permissions
  }

  /**
   * 🛡️ Verificar si un usuario puede realizar operaciones administrativas
   */
  async canPerformAdminAction(userId: string, action: 'create_user' | 'delete_user' | 'view_audit' | 'system_config'): Promise<boolean> {
    try {
      const user = await userService.getUserById(userId)
      if (!user) return false

      const capabilities = await this.getUserCapabilities(userId)

      switch (action) {
        case 'create_user':
        case 'delete_user':
          return capabilities.users.create && capabilities.users.delete
        case 'view_audit':
          return capabilities.admin.viewAuditLogs
        case 'system_config':
          return capabilities.admin.systemSettings
        default:
          return false
      }

    } catch (error) {
      console.error('❌ Error checking admin action:', error)
      return false
    }
  }
}

// 🎯 Instancia singleton del servicio
export const permissionService = new PermissionService()
