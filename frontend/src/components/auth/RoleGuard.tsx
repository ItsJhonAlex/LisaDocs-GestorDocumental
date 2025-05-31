import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

/**
 * 🔐 Variante para verificación de roles específicos
 */
export function RoleProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: string | string[];
}) {
  return (
    <ProtectedRoute requiredRole={allowedRoles}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * 🏢 Variante para verificación de espacios de trabajo
 */
export function WorkspaceProtectedRoute({
  children,
  allowedWorkspaces
}: {
  children: React.ReactNode;
  allowedWorkspaces: string | string[];
}) {
  return (
    <ProtectedRoute requiredWorkspace={allowedWorkspaces}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * 👑 Variante solo para administradores
 */
export function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles="administrador">
      {children}
    </RoleProtectedRoute>
  );
}

/**
 * 🎯 Guard condicional basado en múltiples condiciones
 */
export function ConditionalGuard({
  children,
  condition,
  fallback = null
}: {
  children: React.ReactNode;
  condition: boolean;
  fallback?: React.ReactNode;
}) {
  return condition ? <>{children}</> : <>{fallback}</>;
}

/**
 * 🚀 Componente RoleGuard principal - HOC para protección basada en roles
 */
export function RoleGuard({
  children,
  roles,
  mode = 'any',
  fallback = null
}: {
  children: React.ReactNode;
  roles: string | string[];
  mode?: 'any' | 'all'; // 'any' = al menos uno, 'all' = todos los roles
  fallback?: React.ReactNode;
}) {
  const { hasRole } = useAuth();
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  
  // 🎯 Verificar permisos según el modo
  const hasAccess = mode === 'all' 
    ? rolesArray.every(role => hasRole(role))
    : rolesArray.some(role => hasRole(role));
  
  // ✅ Renderizar contenido o fallback
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
