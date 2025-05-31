import { useAuth } from '@/hooks/useAuth';

/**
 * 🎯 Hook para verificar permisos dentro de componentes
 */
export function useRoutePermissions() {
  const { hasRole, hasWorkspace, isAuthenticated } = useAuth();

  const canAccess = (options: {
    role?: string | string[];
    workspace?: string | string[];
  }) => {
    if (!isAuthenticated) return false;

    if (options.role && !hasRole(options.role)) {
      return false;
    }

    if (options.workspace && !hasWorkspace(options.workspace)) {
      // Los administradores pueden acceder a todos los espacios
      if (!hasRole('administrador')) {
        return false;
      }
    }

    return true;
  };

  return { canAccess };
}

/**
 * 🔐 Hook para verificar roles específicos
 */
export function useRoleAccess(allowedRoles: string | string[]) {
  const { hasRole } = useAuth();
  return hasRole(allowedRoles);
}

/**
 * 🏢 Hook para verificar espacios de trabajo
 */
export function useWorkspaceAccess(allowedWorkspaces: string | string[]) {
  const { hasWorkspace, hasRole } = useAuth();
  
  // Los administradores pueden acceder a todos los espacios
  if (hasRole('administrador')) {
    return true;
  }
  
  return hasWorkspace(allowedWorkspaces);
}

/**
 * 👑 Hook para verificar si es administrador
 */
export function useAdminAccess() {
  const { hasRole } = useAuth();
  return hasRole('administrador');
}
