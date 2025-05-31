import { UserRole, WorkspaceType } from '../generated/prisma';

// 🔐 Payload del JWT
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  workspace: WorkspaceType;
  iat?: number;
  exp?: number;
}

// 🔑 Datos de login
export interface LoginCredentials {
  email: string;
  password: string;
}

// 👤 Datos de registro (solo admin puede crear usuarios)
export interface RegisterData {
  email: string;
  fullName: string;
  role: UserRole;
  workspace: WorkspaceType;
  password: string;
}

// ✅ Respuesta de autenticación exitosa
export interface AuthResponse {
  success: true;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      fullName: string;
      role: UserRole;
      workspace: WorkspaceType;
      isActive: boolean;
      lastLoginAt: Date | null;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    };
  };
}

// ❌ Respuesta de error de autenticación
export interface AuthErrorResponse {
  success: false;
  message: string;
  error?: {
    code: string;
    details?: string;
  };
}

// 🔄 Datos para refresh token
export interface RefreshTokenData {
  refreshToken: string;
}

// 🔓 Usuario autenticado (para middleware)
export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  workspace: WorkspaceType;
  isActive: boolean;
  permissions?: {
    canView: string[];          // workspaces que puede ver
    canDownload: string[];      // workspaces de los que puede descargar
    canArchive: string[];       // workspaces donde puede archivar
    canManage: string[];        // workspaces que puede gestionar
  };
}

// 📝 Contexto de request autenticado
export interface AuthenticatedRequest {
  user: AuthenticatedUser;
  token: string;
}

// 🔒 Opciones de verificación de permisos
export interface PermissionCheck {
  action: 'view' | 'download' | 'upload' | 'archive' | 'manage' | 'delete';
  workspace?: WorkspaceType;
  resourceId?: string;
  resourceOwnerId?: string;
}

// 📊 Resultado de verificación de permisos
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: UserRole;
  requiredWorkspace?: WorkspaceType;
}

// 🔑 Configuración de tokens
export interface TokenConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

// 📋 Sesión de usuario
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
}

// 🔓 Datos para logout
export interface LogoutData {
  token?: string;
  refreshToken?: string;
  logoutAll?: boolean; // Cerrar todas las sesiones
}

// ✅ Respuesta de logout
export interface LogoutResponse {
  success: boolean;
  message: string;
}

// 🔐 Opciones de hash de password
export interface PasswordHashOptions {
  rounds: number;
}

// 📧 Datos para reset de password (futuro)
export interface PasswordResetData {
  email: string;
}

// 🔄 Datos para cambio de password
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

// 🎯 Estado de autenticación para el cliente
export interface AuthState {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// 🚀 Respuesta genérica de API
export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
};
