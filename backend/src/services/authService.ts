import { PrismaClient } from '../generated/prisma';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  AuthErrorResponse,
  AuthenticatedUser,
  RefreshTokenData,
  LogoutData,
  LogoutResponse
} from '../types/auth';
import { hashPassword, verifyPassword, validateLisaDocsPassword } from '../utils/password';
import { generateTokenPair, verifyRefreshToken, blacklistToken } from '../utils/jwt';

const prisma = new PrismaClient();

/**
 * 🔐 Servicio de Autenticación - Lógica central del sistema
 */
export class AuthService {
  
  /**
   * 🔑 Login de usuario
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse | AuthErrorResponse> {
    try {
      const { email, password } = credentials;

      // Buscar usuario por email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return {
          success: false,
          message: 'Credenciales inválidas',
          error: {
            code: 'INVALID_CREDENTIALS'
          }
        };
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        return {
          success: false,
          message: 'Cuenta deshabilitada. Contacta al administrador',
          error: {
            code: 'ACCOUNT_DISABLED'
          }
        };
      }

      // Verificar password
      if (!user.passwordHash) {
        return {
          success: false,
          message: 'Cuenta sin password configurado. Contacta al administrador',
          error: {
            code: 'NO_PASSWORD_SET'
          }
        };
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      
      if (!isPasswordValid) {
        // TODO: Implementar límite de intentos fallidos
        return {
          success: false,
          message: 'Credenciales inválidas',
          error: {
            code: 'INVALID_CREDENTIALS'
          }
        };
      }

      // Generar tokens
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        workspace: user.workspace
      });

      // Actualizar timestamp de último login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date()
        }
      });

      return {
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            workspace: user.workspace,
            isActive: user.isActive,
            lastLoginAt: new Date()
          },
          tokens
        }
      };

    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: 'Error interno del servidor',
        error: {
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * 👤 Registro de usuario (solo admin)
   */
  async register(
    registerData: RegisterData, 
    adminUserId: string
  ): Promise<AuthResponse | AuthErrorResponse> {
    try {
      // Verificar que quien registra es admin
      const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId }
      });

      if (!adminUser || adminUser.role !== 'administrador') {
        return {
          success: false,
          message: 'Solo los administradores pueden crear usuarios',
          error: {
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        };
      }

      // Validar datos
      const { email, fullName, role, workspace, password } = registerData;

      // Verificar si el email ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'El email ya está registrado',
          error: {
            code: 'EMAIL_ALREADY_EXISTS'
          }
        };
      }

      // Validar fortaleza del password
      const passwordValidation = validateLisaDocsPassword(password, {
        email,
        fullName
      });

      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: 'Password no cumple los requisitos de seguridad',
          error: {
            code: 'WEAK_PASSWORD',
            details: passwordValidation.errors.join(', ')
          }
        };
      }

      // Hashear password
      const hashedPassword = await hashPassword(password);

      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          fullName,
          role,
          workspace,
          passwordHash: hashedPassword,
          isActive: true,
          preferences: {
            theme: 'light',
            language: 'es',
            notifications: {
              email: true,
              browser: true
            }
          }
        }
      });

      // Crear notificación de bienvenida
      await prisma.notification.create({
        data: {
          userId: newUser.id,
          title: '¡Bienvenido a LisaDocs!',
          message: `Hola ${newUser.fullName}, tu cuenta ha sido creada exitosamente. Ya puedes acceder al sistema de gestión documental.`,
          type: 'system_message',
          isRead: false
        }
      });

      // Generar tokens para el nuevo usuario
      const tokens = generateTokenPair({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        workspace: newUser.workspace
      });

      return {
        success: true,
        message: 'Usuario creado exitosamente',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role,
            workspace: newUser.workspace,
            isActive: newUser.isActive,
            lastLoginAt: newUser.lastLoginAt
          },
          tokens
        }
      };

    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        message: 'Error interno del servidor',
        error: {
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * 🔄 Refresh token
   */
  async refreshToken(refreshData: RefreshTokenData): Promise<AuthResponse | AuthErrorResponse> {
    try {
      const { refreshToken } = refreshData;

      // Verificar refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'Usuario no encontrado o inactivo',
          error: {
            code: 'USER_NOT_FOUND'
          }
        };
      }

      // Generar nuevos tokens
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        workspace: user.workspace
      });

      return {
        success: true,
        message: 'Tokens renovados exitosamente',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            workspace: user.workspace,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt
          },
          tokens
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Refresh token inválido o expirado',
        error: {
          code: 'INVALID_REFRESH_TOKEN'
        }
      };
    }
  }

  /**
   * 🔓 Logout de usuario
   */
  async logout(logoutData: LogoutData): Promise<LogoutResponse> {
    try {
      const { token, refreshToken } = logoutData;

      // Invalidar tokens
      if (token) {
        blacklistToken(token);
      }
      if (refreshToken) {
        blacklistToken(refreshToken);
      }

      // TODO: En producción, eliminar de la base de datos
      // await this.removeUserSession(token);

      return {
        success: true,
        message: 'Logout exitoso'
      };

    } catch (error) {
      console.error('Error en logout:', error);
      return {
        success: false,
        message: 'Error durante el logout'
      };
    }
  }

  /**
   * 👤 Obtener perfil de usuario autenticado
   */
  async getUserProfile(userId: string): Promise<AuthenticatedUser | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.isActive) {
        return null;
      }

      // Obtener permisos del usuario
      const permissions = await this.getUserPermissions(user.role);

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        workspace: user.workspace,
        isActive: user.isActive,
        permissions
      };

    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return null;
    }
  }

  /**
   * 🔐 Obtener permisos de un rol
   */
  private async getUserPermissions(role: string) {
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { fromRole: role as any }
      });

      return {
        canView: rolePermissions
          .filter(p => p.canView)
          .map(p => p.toWorkspace),
        canDownload: rolePermissions
          .filter(p => p.canDownload)
          .map(p => p.toWorkspace),
        canArchive: rolePermissions
          .filter(p => p.canArchiveOthers)
          .map(p => p.toWorkspace),
        canManage: rolePermissions
          .filter(p => p.canManageWorkspace)
          .map(p => p.toWorkspace)
      };

    } catch (error) {
      console.error('Error obteniendo permisos:', error);
      return {
        canView: [],
        canDownload: [],
        canArchive: [],
        canManage: []
      };
    }
  }

  /**
   * 🔒 Verificar si un usuario puede realizar una acción
   */
  async canUserPerformAction(
    userId: string, 
    action: string, 
    workspace?: string
  ): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile || !userProfile.permissions) return false;

      const { permissions } = userProfile;

      switch (action) {
        case 'view':
          return workspace ? permissions.canView.includes(workspace) : permissions.canView.length > 0;
        case 'download':
          return workspace ? permissions.canDownload.includes(workspace) : permissions.canDownload.length > 0;
        case 'archive':
          return workspace ? permissions.canArchive.includes(workspace) : permissions.canArchive.length > 0;
        case 'manage':
          return workspace ? permissions.canManage.includes(workspace) : permissions.canManage.length > 0;
        default:
          return false;
      }

    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const authService = new AuthService();
