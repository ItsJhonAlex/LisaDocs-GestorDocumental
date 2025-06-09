import type { WorkspaceType, WorkspaceInfo } from '@/types/document';

/**
 * 🏛️ Constantes de Workspaces para LisaDocs
 * 
 * Define los espacios de trabajo del sistema basados en la estructura
 * político-administrativa de Cuba
 */

// 📋 Lista de tipos de workspace
export const WORKSPACE_TYPES: WorkspaceType[] = [
  'cam',
  'ampp',
  'presidencia',
  'intendencia',
  'comisiones_cf'
];

// 🏛️ Información detallada de cada workspace
export const WORKSPACE_INFO: Record<WorkspaceType, WorkspaceInfo> = {
  cam: {
    type: 'cam',
    name: 'Consejo de Administración Municipal',
    description: 'Órgano ejecutivo del gobierno local',
    icon: '🏛️',
    canAccess: true,
    documentCount: 0
  },
  
  ampp: {
    type: 'ampp',
    name: 'Asamblea Municipal del Poder Popular',
    description: 'Órgano superior del poder local',
    icon: '🏛️',
    canAccess: true,
    documentCount: 0
  },
  
  presidencia: {
    type: 'presidencia',
    name: 'Presidencia Municipal',
    description: 'Oficina del Presidente de la AMPP',
    icon: '👑',
    canAccess: true,
    documentCount: 0
  },
  
  intendencia: {
    type: 'intendencia',
    name: 'Intendencia Municipal',
    description: 'Administración económica y financiera',
    icon: '💼',
    canAccess: true,
    documentCount: 0
  },
  
  comisiones_cf: {
    type: 'comisiones_cf',
    name: 'Comisiones del Consejo del Frente',
    description: 'Comisiones especializadas del territorio',
    icon: '📋',
    canAccess: true,
    documentCount: 0
  }
};

// 🎨 Colores para cada workspace
export const WORKSPACE_COLORS: Record<WorkspaceType, string> = {
  cam: '#3B82F6',           // Azul
  ampp: '#10B981',          // Verde
  presidencia: '#8B5CF6',   // Púrpura
  intendencia: '#F59E0B',   // Ámbar
  comisiones_cf: '#EF4444'  // Rojo
};

// 🎯 Abreviaciones para mostrar
export const WORKSPACE_ABBREVIATIONS: Record<WorkspaceType, string> = {
  cam: 'CAM',
  ampp: 'AMPP',
  presidencia: 'PRES',
  intendencia: 'INT',
  comisiones_cf: 'CCF'
};

// 📊 Configuración de orden para mostrar en la UI
export const WORKSPACE_ORDER: WorkspaceType[] = [
  'presidencia',
  'ampp', 
  'cam',
  'intendencia',
  'comisiones_cf'
];

// 🔐 Permisos por defecto (pueden ser sobrescritos por el backend)
export const DEFAULT_WORKSPACE_PERMISSIONS = {
  canView: true,
  canUpload: false,
  canEdit: false,
  canDelete: false,
  canArchive: false,
  canManage: false
};

/**
 * 🔍 Obtener información de un workspace
 */
export function getWorkspaceInfo(type: WorkspaceType): WorkspaceInfo {
  return WORKSPACE_INFO[type];
}

/**
 * 🎨 Obtener color de un workspace
 */
export function getWorkspaceColor(type: WorkspaceType): string {
  return WORKSPACE_COLORS[type];
}

/**
 * 📝 Obtener abreviación de un workspace
 */
export function getWorkspaceAbbreviation(type: WorkspaceType): string {
  return WORKSPACE_ABBREVIATIONS[type];
}

/**
 * 🏛️ Obtener workspaces ordenados para mostrar en la UI
 */
export function getOrderedWorkspaces(): WorkspaceInfo[] {
  return WORKSPACE_ORDER.map(type => WORKSPACE_INFO[type]);
}

/**
 * ✅ Validar si un workspace type es válido
 */
export function isValidWorkspaceType(type: string): type is WorkspaceType {
  return WORKSPACE_TYPES.includes(type as WorkspaceType);
}

/**
 * 🔍 Buscar workspace por nombre (útil para autocomplete)
 */
export function searchWorkspacesByName(query: string): WorkspaceInfo[] {
  const lowercaseQuery = query.toLowerCase();
  
  return Object.values(WORKSPACE_INFO).filter(workspace =>
    workspace.name.toLowerCase().includes(lowercaseQuery) ||
    workspace.description.toLowerCase().includes(lowercaseQuery) ||
    getWorkspaceAbbreviation(workspace.type).toLowerCase().includes(lowercaseQuery)
  );
} 