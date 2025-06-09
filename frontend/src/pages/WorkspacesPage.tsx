import { useParams, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { WorkspaceSwitch } from '@/components/workspaces/WorkspaceSwitch';
import { useAuth } from '@/hooks/useAuth';

/**
 * 🏢 Página de Workspaces
 * 
 * Maneja la navegación entre los diferentes espacios de trabajo:
 * - Presidencia
 * - Intendencia  
 * - CAM
 * - AMPP
 * - Comisiones CF
 */
export function WorkspacesPage() {
  const { workspace } = useParams<{ workspace: string }>();
  const { hasWorkspaceAccess, hasPermission, user, isLoading } = useAuth();

  console.log('🔍 WorkspacesPage render:', {
    workspace,
    user,
    isLoading,
    userRole: user?.role
  });

  // 🔄 Mostrar loading mientras se carga el usuario
  if (isLoading) {
    console.log('⏳ User is loading, showing loading state');
    return <div>Cargando...</div>;
  }

  // 🚫 Si no hay usuario después de cargar, ir a login
  if (!user) {
    console.log('❌ No user found after loading, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // 🎯 Lista de workspaces válidos
  const validWorkspaces = [
    'presidencia',
    'intendencia', 
    'cam',
    'ampp',
    'comisiones'
  ];

  // 🚫 Verificar workspace válido
  if (!workspace || !validWorkspaces.includes(workspace)) {
    console.log('🔄 Invalid workspace, redirecting to presidencia');
    return <Navigate to="/workspaces/presidencia" replace />;
  }

  // 🔄 Mapear workspace de URL a workspace interno
  const workspaceMapping: Record<string, string> = {
    'comisiones': 'comisiones_cf',
    'presidencia': 'presidencia',
    'intendencia': 'intendencia',
    'cam': 'cam',
    'ampp': 'ampp'
  };

  const currentWorkspace = workspaceMapping[workspace] || workspace;

  // 🛡️ Verificar acceso al workspace usando permisos reales del backend
  const hasWorkspaceAccessCheck = hasWorkspaceAccess(currentWorkspace);
  const hasViewPermissionCheck = hasPermission('view', currentWorkspace);
  
  // ✅ Administradores tienen acceso total
  const isAdmin = user?.role === 'administrador';
  
  const canAccess = isAdmin || hasWorkspaceAccessCheck || hasViewPermissionCheck;
  
  console.log('🔍 WorkspacesPage Debug:', {
    workspace,
    currentWorkspace,
    userRole: user?.role,
    permissions: user?.permissions,
    isAdmin,
    hasWorkspaceAccessCheck,
    hasViewPermissionCheck,
    canAccess
  });
  
  if (!canAccess) {
    console.log('❌ Access denied, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ Access granted, rendering workspace');
  return (
    <Layout>
      <WorkspaceSwitch currentWorkspace={currentWorkspace} />
    </Layout>
  );
} 