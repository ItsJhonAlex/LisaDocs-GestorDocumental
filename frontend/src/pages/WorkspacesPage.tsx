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
  const { hasWorkspaceAccess, hasAnyRole } = useAuth();

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

  // 🛡️ Verificar acceso al workspace
  const canAccess = hasAnyRole(['administrador']) || hasWorkspaceAccess(currentWorkspace);
  
  if (!canAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <Layout>
      <WorkspaceSwitch currentWorkspace={currentWorkspace} />
    </Layout>
  );
} 