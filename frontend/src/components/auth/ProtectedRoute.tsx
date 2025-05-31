import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageSpinner } from '@/components/common/LoadingSpinner';

// 🎯 Props del componente
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredWorkspace?: string | string[];
}

/**
 * 🔒 Componente para proteger rutas
 * 
 * Verifica autenticación y permisos antes de renderizar el contenido.
 * Redirige automáticamente si no se cumplen los requisitos.
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredWorkspace
}: ProtectedRouteProps) {
  const location = useLocation();
  const { 
    isAuthenticated, 
    isLoading, 
    hasRole, 
    hasWorkspace
  } = useAuth();

  // 🎯 Memoizar las verificaciones de permisos para evitar re-evaluaciones
  const roleCheck = useMemo(() => {
    if (!requiredRole) return true;
    return hasRole(requiredRole);
  }, [requiredRole, hasRole]);

  const workspaceCheck = useMemo(() => {
    if (!requiredWorkspace) return true;
    return hasWorkspace(requiredWorkspace) || hasRole('administrador');
  }, [requiredWorkspace, hasWorkspace, hasRole]);

  // ⏳ Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <PageSpinner text="Verificando acceso..." />;
  }

  // 🚪 Redirigir al login si no está autenticado
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  // 🎯 Verificar rol requerido
  if (!roleCheck) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 🏢 Verificar espacio de trabajo requerido
  if (!workspaceCheck) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Todo OK, renderizar el contenido
  return <>{children}</>;
}
