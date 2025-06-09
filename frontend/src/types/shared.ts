// 👤 Tipos de usuario (reexportados desde useAuth)
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  workspace: string;
  isActive: boolean;
  lastLoginAt?: string;
  preferences?: {
    theme: string;
  };
  permissions?: {
    canView: string[];
    canDownload: string[];
    canArchive: string[];
    canManage: string[];
  };
}

// 📊 Tipos de estadísticas comunes
export interface BaseStats {
  totalDocuments: number;
  totalDownloads: number;
  activeMembers?: number;
}

// 🏢 Tipos de workspace
export type WorkspaceType = 'presidencia' | 'cam' | 'ampp' | 'intendencia' | 'comisiones_cf';

export interface WorkspaceInfo {
  id: WorkspaceType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// 🎨 Tipos de UI comunes
export interface TabConfig {
  id: string;
  label: string;
  count?: number;
}

// 📄 Re-exportar tipos de documento
export type { Document, DocumentStatus, UploadFile, DocumentFilters } from './document'; 