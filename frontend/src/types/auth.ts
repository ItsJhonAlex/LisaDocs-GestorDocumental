// 🏷️ Tipos de autenticación y usuarios para LisaDocs

/**
 * 👤 Roles de usuario en el sistema
 */
export type UserRole = 
  | 'administrador'      // 🛡️ Acceso total al sistema
  | 'presidente'         // 🎯 Gestión ejecutiva principal  
  | 'vicepresidente'     // 🎯 Gestión ejecutiva secundaria
  | 'secretario_cam'     // 📊 Secretario Cámara de Comercio
  | 'secretario_ampp'    // 🏛️ Secretario Asociación de Municipios
  | 'secretario_cf'      // ⚖️ Secretario Comisiones de Fiscalización
  | 'intendente'         // 🏢 Gestión territorial
  | 'cf_member';         // 👥 Miembro de comisiones

/**
 * 🏢 Espacios de trabajo disponibles
 */
export type WorkspaceType = 
  | 'presidencia'        // 🎯 Presidencia del Consejo
  | 'intendencia'        // 🏢 Intendencia Regional  
  | 'cam'                // 📊 Cámara de Comercio
  | 'ampp'               // 🏛️ Asociación de Municipios
  | 'comisiones_cf';     // ⚖️ Comisiones de Fiscalización (CF1-CF8)

/**
 * 👤 Interface de Usuario
 */
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  workspace: WorkspaceType;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 🔐 Contexto de autenticación
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

/**
 * 🎟️ Tokens JWT
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * 📝 Datos de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * 📝 Datos de registro
 */
export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  workspace: WorkspaceType;
}

/**
 * 🔄 Response de autenticación
 */
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

/**
 * 🛡️ Permisos del sistema
 */
export interface UserPermissions {
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManageRoles: boolean;
  canAccessAllWorkspaces: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canManageSystem: boolean;
}

/**
 * 📊 Estado de sesión
 */
export interface SessionState {
  isActive: boolean;
  lastActivity: string;
  expiresAt: string;
  deviceInfo?: {
    browser: string;
    os: string;
    ip: string;
  };
}
