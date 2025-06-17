import { prisma } from '../config/database'
import { UserRole, WorkspaceType, User } from '../generated/prisma'
import { VALIDATION_CONFIG, SECURITY_CONFIG } from '../config/constants'
import bcrypt from 'bcryptjs'

// 📋 Tipos para el servicio de usuarios
export interface CreateUserData {
  email: string
  fullName: string
  role: UserRole
  workspace: WorkspaceType
  password: string
  isActive?: boolean
  preferences?: Record<string, any>
}

export interface UpdateUserData {
  fullName?: string
  role?: UserRole
  workspace?: WorkspaceType
  isActive?: boolean
  preferences?: Record<string, any>
}

export interface UpdatePasswordData {
  currentPassword: string
  newPassword: string
}

export interface UserListFilters {
  role?: UserRole
  workspace?: WorkspaceType
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
  orderBy?: 'fullName' | 'email' | 'createdAt' | 'lastLoginAt'
  orderDirection?: 'asc' | 'desc'
}

export interface UserWithStats extends User {
  documentsCount: number
  lastActivity?: Date
}

// 🚀 Servicio de usuarios
export class UserService {

  /**
   * 👤 Crear nuevo usuario
   */
  async createUser(userData: CreateUserData, createdByUserId: string): Promise<User> {
    try {
      // ✅ Validar datos
      await this.validateUserData(userData)

      // 🔐 Hash de la contraseña
      const hashedPassword = await bcrypt.hash(userData.password, SECURITY_CONFIG.PASSWORD.BCRYPT_ROUNDS || 12)

      // 💾 Crear usuario
      const user = await prisma.user.create({
        data: {
          email: userData.email.toLowerCase().trim(),
          fullName: userData.fullName.trim(),
          role: userData.role,
          workspace: userData.workspace,
          passwordHash: hashedPassword,
          isActive: userData.isActive ?? true,
          preferences: userData.preferences || {},
        }
      })

      // 📊 Log de actividad
      console.log(`✅ User created: ${user.email} by admin: ${createdByUserId}`)

      return user

    } catch (error) {
      console.error('❌ Error creating user:', error)
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📋 Obtener lista de usuarios con filtros
   */
  async getUsers(filters: UserListFilters = {}): Promise<{
    users: UserWithStats[]
    total: number
    hasMore: boolean
  }> {
    try {
      const {
        role,
        workspace,
        isActive,
        search,
        limit = 20,
        offset = 0,
        orderBy = 'createdAt',
        orderDirection = 'desc'
      } = filters

      // 🔍 Construir filtros
      const where: any = {}

      if (role) where.role = role
      if (workspace) where.workspace = workspace
      if (isActive !== undefined) where.isActive = isActive

      // 🔍 Búsqueda de texto
      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }

      // 📊 Obtener total y usuarios
      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          include: {
            _count: {
              select: {
                documents: true
              }
            }
          },
          orderBy: { [orderBy]: orderDirection },
          skip: offset,
          take: limit
        })
      ])

      // 📋 Formatear usuarios con estadísticas
      const usersWithStats: UserWithStats[] = users.map((user: {
        id: string
        fullName: string
        email: string
        role: UserRole
        workspace: WorkspaceType
        passwordHash: string | null
        isActive: boolean
        preferences: any
        createdAt: Date
        updatedAt: Date
        lastLoginAt: Date | null
        _count: {
          documents: number
        }
      }) => ({
        ...user,
        documentsCount: user._count.documents,
        lastActivity: user.lastLoginAt || undefined
      }))

      return {
        users: usersWithStats,
        total,
        hasMore: offset + limit < total
      }

    } catch (error) {
      console.error('❌ Error getting users:', error)
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 👤 Obtener usuario por ID
   */
  async getUserById(id: string): Promise<UserWithStats | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              documents: true,
              documentActivities: true,
              notifications: true
            }
          }
        }
      })

      if (!user) return null

      return {
        ...user,
        documentsCount: user._count.documents,
        lastActivity: user.lastLoginAt || undefined
      }

    } catch (error) {
      console.error('❌ Error getting user by ID:', error)
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📧 Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      })
    } catch (error) {
      console.error('❌ Error getting user by email:', error)
      throw new Error(`Failed to get user by email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ✏️ Actualizar usuario
   */
  async updateUser(id: string, updateData: UpdateUserData, updatedByUserId: string): Promise<User> {
    try {
      // 📄 Verificar que el usuario existe
      const existingUser = await this.getUserById(id)
      if (!existingUser) {
        throw new Error('User not found')
      }

      // ✅ Validar datos si se proporcionan
      if (updateData.fullName) {
        if (updateData.fullName.trim().length < VALIDATION_CONFIG.USER.NAME_MIN_LENGTH) {
          throw new Error(`Full name must be at least ${VALIDATION_CONFIG.USER.NAME_MIN_LENGTH} characters`)
        }
      }

      // 💾 Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(updateData.fullName && { fullName: updateData.fullName.trim() }),
          ...(updateData.role && { role: updateData.role }),
          ...(updateData.workspace && { workspace: updateData.workspace }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          ...(updateData.preferences && { preferences: updateData.preferences }),
          updatedAt: new Date()
        }
      })

      // 📊 Log de actividad
      console.log(`✅ User updated: ${updatedUser.email} by: ${updatedByUserId}`)

      return updatedUser

    } catch (error) {
      console.error('❌ Error updating user:', error)
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🔐 Cambiar contraseña
   */
  async changePassword(userId: string, passwordData: UpdatePasswordData): Promise<void> {
    try {
      // 📄 Obtener usuario
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || !user.passwordHash) {
        throw new Error('User not found or invalid')
      }

      // ✅ Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.passwordHash)
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect')
      }

      // ✅ Validar nueva contraseña
      if (passwordData.newPassword.length < SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
        throw new Error(`Password must be at least ${SECURITY_CONFIG.PASSWORD.MIN_LENGTH} characters`)
      }

      // 🔐 Hash nueva contraseña
      const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, SECURITY_CONFIG.PASSWORD.BCRYPT_ROUNDS || 12)

      // 💾 Actualizar contraseña
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: hashedNewPassword,
          updatedAt: new Date()
        }
      })

      console.log(`✅ Password changed for user: ${user.email}`)

    } catch (error) {
      console.error('❌ Error changing password:', error)
      throw new Error(`Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🔐 Cambiar contraseña como administrador (sin verificar contraseña actual del usuario)
   */
  async adminChangePassword(userId: string, newPassword: string): Promise<void> {
    try {
      // 📄 Obtener usuario
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // ✅ Validar nueva contraseña
      if (newPassword.length < SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
        throw new Error(`Password must be at least ${SECURITY_CONFIG.PASSWORD.MIN_LENGTH} characters`)
      }

      // 🔐 Hash nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, SECURITY_CONFIG.PASSWORD.BCRYPT_ROUNDS || 12)

      // 💾 Actualizar contraseña
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: hashedNewPassword,
          updatedAt: new Date()
        }
      })

      console.log(`✅ Password changed by admin for user: ${user.email}`)

    } catch (error) {
      console.error('❌ Error changing password by admin:', error)
      throw new Error(`Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ❌ Desactivar usuario (soft delete)
   */
  async deactivateUser(id: string, deactivatedByUserId: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })

      console.log(`✅ User deactivated: ${user.email} by: ${deactivatedByUserId}`)
      return user

    } catch (error) {
      console.error('❌ Error deactivating user:', error)
      throw new Error(`Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ✅ Reactivar usuario
   */
  async reactivateUser(id: string, reactivatedByUserId: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          isActive: true,
          updatedAt: new Date()
        }
      })

      console.log(`✅ User reactivated: ${user.email} by: ${reactivatedByUserId}`)
      return user

    } catch (error) {
      console.error('❌ Error reactivating user:', error)
      throw new Error(`Failed to reactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🗑️ Eliminar usuario
   */
  async deleteUser(id: string, deletedByUserId: string): Promise<void> {
    try {
      // 🔍 Verificar que el usuario existe
      const user = await this.getUserById(id)
      if (!user) {
        throw new Error('User not found')
      }

      // 🚫 Validaciones de seguridad
      if (user.id === deletedByUserId) {
        throw new Error('Cannot delete yourself')
      }

      // 🔐 Administradores no pueden eliminar otros administradores
      const deletedByUser = await this.getUserById(deletedByUserId)
      if (deletedByUser?.role === 'administrador' && user.role === 'administrador') {
        throw new Error('Cannot delete another administrator')
      }

      // 📄 Verificar si tiene documentos activos
      const activeDocumentsCount = await prisma.document.count({
        where: {
          createdBy: id,
          status: {
            not: 'archived'
          }
        }
      })

      if (activeDocumentsCount > 0) {
        throw new Error(`User has ${activeDocumentsCount} active documents. Archive or reassign documents first.`)
      }

             // 🗑️ Eliminar usuario usando transacción
       await prisma.$transaction(async (tx) => {
         // 1. Eliminar documentos del usuario (si los hay archivados)
         await tx.document.deleteMany({
           where: { 
             createdBy: id,
             status: 'archived' 
           }
         })

        // 2. Eliminar actividades del usuario
        await tx.documentActivity.deleteMany({
          where: { userId: id }
        })

        // 3. Eliminar notificaciones del usuario
        await tx.notification.deleteMany({
          where: { userId: id }
        })

        // 4. Finalmente eliminar el usuario
        await tx.user.delete({
          where: { id }
        })
      })

      // 📊 Log de actividad
      console.log(`🗑️ User deleted: ${user.email} by admin: ${deletedByUserId}`)

    } catch (error) {
      console.error('❌ Error deleting user:', error)
      
      if (error instanceof Error) {
        throw error // Re-lanzar errores conocidos con su mensaje específico
      }
      
      throw new Error(`Failed to delete user: Unknown error`)
    }
  }

  /**
   * 📊 Obtener estadísticas de usuarios
   */
  async getUserStats(): Promise<{
    total: number
    active: number
    byRole: Record<UserRole, number>
    byWorkspace: Record<WorkspaceType, number>
    recent: number
  }> {
    try {
      const [
        total,
        active,
        byRole,
        byWorkspace,
        recent
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: true
        }),
        prisma.user.groupBy({
          by: ['workspace'],
          _count: true
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
            }
          }
        })
      ])

      // 📈 Formatear resultados
      const roleStats = byRole.reduce((acc: Record<UserRole, number>, item: { role: UserRole; _count: number }) => {
        acc[item.role] = item._count
        return acc
      }, {} as Record<UserRole, number>)

      const workspaceStats = byWorkspace.reduce((acc: Record<WorkspaceType, number>, item: { workspace: WorkspaceType; _count: number }) => {
        acc[item.workspace] = item._count
        return acc
      }, {} as Record<WorkspaceType, number>)

      return {
        total,
        active,
        byRole: roleStats,
        byWorkspace: workspaceStats,
        recent
      }

    } catch (error) {
      console.error('❌ Error getting user stats:', error)
      throw new Error(`Failed to get user stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ✅ Validar datos de usuario
   */
  private async validateUserData(userData: CreateUserData): Promise<void> {
    // 📧 Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format')
    }

    if (userData.email.length > VALIDATION_CONFIG.USER.EMAIL_MAX_LENGTH) {
      throw new Error(`Email cannot exceed ${VALIDATION_CONFIG.USER.EMAIL_MAX_LENGTH} characters`)
    }

    // 👤 Validar nombre
    if (userData.fullName.trim().length < VALIDATION_CONFIG.USER.NAME_MIN_LENGTH) {
      throw new Error(`Full name must be at least ${VALIDATION_CONFIG.USER.NAME_MIN_LENGTH} characters`)
    }

    if (userData.fullName.length > VALIDATION_CONFIG.USER.NAME_MAX_LENGTH) {
      throw new Error(`Full name cannot exceed ${VALIDATION_CONFIG.USER.NAME_MAX_LENGTH} characters`)
    }

    // 🔐 Validar contraseña
    if (userData.password.length < SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
      throw new Error(`Password must be at least ${SECURITY_CONFIG.PASSWORD.MIN_LENGTH} characters`)
    }

    if (userData.password.length > SECURITY_CONFIG.PASSWORD.MAX_LENGTH) {
      throw new Error(`Password cannot exceed ${SECURITY_CONFIG.PASSWORD.MAX_LENGTH} characters`)
    }

    // 📧 Verificar que el email no existe
    const existingUser = await this.getUserByEmail(userData.email)
    if (existingUser) {
      throw new Error('Email already exists')
    }
  }
}

// 🎯 Instancia singleton del servicio
export const userService = new UserService()
