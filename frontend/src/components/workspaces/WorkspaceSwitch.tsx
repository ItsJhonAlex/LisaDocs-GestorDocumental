import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

// Importar todos los dashboards de workspace
import { AMPPDashboard } from './AMPPDashboard';
import { CAMDashboard } from './CAMDashboard';
import { ComisionesDashboard } from './ComisionesDashboard';
import { IntendenciaDashboard } from './IntendenciaDashboard';
import { PresidenciaDashboard } from './PresidenciaDashboard';

interface WorkspaceSwitchProps {
  currentWorkspace: string;
}

/**
 * 🏢 Componente que maneja la navegación entre espacios de trabajo
 * 
 * Reglas de acceso implementadas:
 * - 👑 Administradores: Acceso total a todos los workspaces
 * - 🏛️ Presidente y Vicepresidente: Acceso total a todos los workspaces 
 * - 🏢 Intendente: Solo acceso a CAM
 * - 👥 Otros roles: Solo sus workspaces específicos según permisos del backend
 */
export function WorkspaceSwitch({ currentWorkspace }: WorkspaceSwitchProps) {
  const { user, hasWorkspaceAccess, hasPermission } = useAuth();

  // 🛡️ Verificar si el usuario tiene acceso al workspace usando reglas de negocio específicas
  const canAccessWorkspace = (workspace: string): boolean => {
    console.log('🔍 Debug WorkspaceSwitch canAccessWorkspace:', {
      user,
      workspace,
      userRole: user?.role,
      permissions: user?.permissions
    });
    
    if (!user) {
      console.log('❌ No user found');
      return false;
    }

    // ✅ Administradores tienen acceso total siempre
    if (user.role === 'administrador') {
      console.log('✅ Admin access granted to all workspaces');
      return true;
    }

    // ✅ Presidente y Vicepresidente tienen acceso total a todos los workspaces
    if (user.role === 'presidente' || user.role === 'vicepresidente') {
      console.log('✅ Presidente/Vicepresidente access granted to all workspaces');
      return true;
    }

    // 🏢 Intendente solo puede acceder a CAM
    if (user.role === 'intendente') {
      const canAccess = workspace === 'cam';
      console.log(`🏢 Intendente access to ${workspace}: ${canAccess}`);
      return canAccess;
    }

    // 🏢 Secretario CAM solo puede acceder a CAM
    if (user.role === 'secretario_cam') {
      const canAccess = workspace === 'cam';
      console.log(`🏢 Secretario CAM access to ${workspace}: ${canAccess}`);
      return canAccess;
    }

    // 🏛️ Secretario AMPP solo puede acceder a AMPP
    if (user.role === 'secretario_ampp') {
      const canAccess = workspace === 'ampp';
      console.log(`🏛️ Secretario AMPP access to ${workspace}: ${canAccess}`);
      return canAccess;
    }

    // 🏛️ Secretario CF solo puede acceder a Comisiones CF
    if (user.role === 'secretario_cf' || user.role === 'cf_member') {
      const canAccess = workspace === 'comisiones_cf';
      console.log(`🏛️ Secretario/Miembro CF access to ${workspace}: ${canAccess}`);
      return canAccess;
    }

    // 👥 Para otros roles, usar permisos del backend
    const hasWorkspaceAccessCheck = hasWorkspaceAccess(workspace);
    const hasViewPermissionCheck = hasPermission('view', workspace);
    
    const canAccess = hasWorkspaceAccessCheck || hasViewPermissionCheck;
    
    console.log('🔍 Other roles access check:', {
      workspace,
      role: user.role,
      hasWorkspaceAccessCheck,
      hasViewPermissionCheck,
      canAccess
    });
    
    return canAccess;
  };

  // 📋 Obtener workspaces disponibles para el usuario actual
  const getAvailableWorkspaces = (): string[] => {
    if (!user) return [];

    // Administradores, Presidente y Vicepresidente ven todos
    if (user.role === 'administrador' || user.role === 'presidente' || user.role === 'vicepresidente') {
      return ['presidencia', 'cam', 'ampp', 'intendencia', 'comisiones_cf'];
    }

    // Intendente y Secretario CAM solo ven CAM
    if (user.role === 'intendente' || user.role === 'secretario_cam') {
      return ['cam'];
    }

    // Secretario AMPP solo ve AMPP
    if (user.role === 'secretario_ampp') {
      return ['ampp'];
    }

    // Secretarios CF solo ven Comisiones CF
    if (user.role === 'secretario_cf' || user.role === 'cf_member') {
      return ['comisiones_cf'];
    }

    // Otros roles según sus permisos
    const availableWorkspaces: string[] = [];
    const workspacesToCheck = ['presidencia', 'cam', 'ampp', 'intendencia', 'comisiones_cf'];
    
    workspacesToCheck.forEach(workspace => {
      if (canAccessWorkspace(workspace)) {
        availableWorkspaces.push(workspace);
      }
    });

    return availableWorkspaces;
  };

  // 🎯 Renderizar el dashboard correspondiente
  const renderWorkspaceDashboard = () => {
    // Verificar acceso antes de mostrar el dashboard
    if (!canAccessWorkspace(currentWorkspace)) {
      const availableWorkspaces = getAvailableWorkspaces();
      
      return (
        <div className="space-y-6">
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription>
              No tienes permisos para acceder al workspace <strong>{currentWorkspace}</strong>.
              <br />
              {availableWorkspaces.length > 0 ? (
                <>
                  Espacios disponibles para ti: <strong>{availableWorkspaces.join(', ')}</strong>
                  <br />
                </>
              ) : (
                'No tienes acceso a ningún workspace configurado.'
              )}
              {user?.role === 'intendente' && (
                <>
                  <br />
                  <strong>Nota:</strong> Los intendentes solo tienen acceso al workspace CAM.
                </>
              )}
              <br />
              <small>Tu rol actual: <strong>{user?.role || 'Sin rol'}</strong></small>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    // Mostrar dashboard según el workspace
    switch (currentWorkspace) {
      case 'cam':
        return <CAMDashboard />;
      
      case 'ampp':
        return <AMPPDashboard />;
      
      case 'presidencia':
        return <PresidenciaDashboard />;
      
      case 'intendencia':
        return <IntendenciaDashboard />;
      
      case 'comisiones_cf':
        return <ComisionesDashboard />;
      
      default: {
        const availableWorkspaces = getAvailableWorkspaces();
        return (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Workspace <strong>{currentWorkspace}</strong> no reconocido.
                <br />
                {availableWorkspaces.length > 0 ? (
                  <>Espacios disponibles: <strong>{availableWorkspaces.join(', ')}</strong></>
                ) : (
                  'No hay espacios de trabajo disponibles.'
                )}
              </AlertDescription>
            </Alert>
          </div>
        );
      }
    }
  };

  // 🎨 Header con información del workspace actual
  const getWorkspaceInfo = (workspace: string) => {
    const workspaceConfig = {
      cam: {
        name: 'Consejo de Administración Municipal',
        description: 'Documentos del CAM y actas de reuniones',
        color: 'bg-blue-500'
      },
      ampp: {
        name: 'Asamblea Municipal del Poder Popular',
        description: 'Documentos de la AMPP y resoluciones',
        color: 'bg-green-500'
      },
      presidencia: {
        name: 'Presidencia Municipal',
        description: 'Documentos oficiales y comunicaciones presidenciales',
        color: 'bg-purple-500'
      },
      intendencia: {
        name: 'Intendencia Municipal',
        description: 'Documentos administrativos y gestión municipal',
        color: 'bg-orange-500'
      },
      comisiones_cf: {
        name: 'Comisiones de Trabajo CF',
        description: 'Documentos de las comisiones CF1-CF8',
        color: 'bg-red-500'
      }
    };

    return workspaceConfig[workspace as keyof typeof workspaceConfig] || {
      name: 'Workspace Desconocido',
      description: 'Workspace no configurado',
      color: 'bg-gray-500'
    };
  };

  const workspaceInfo = getWorkspaceInfo(currentWorkspace);
  const availableWorkspaces = getAvailableWorkspaces();

  return (
    <div className="space-y-6">
      {/* 📋 Header del workspace */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${workspaceInfo.color}`}></div>
            <h1 className="text-2xl font-bold tracking-tight">
              {workspaceInfo.name}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {workspaceInfo.description}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {user?.role || 'usuario'}
          </Badge>
          {canAccessWorkspace(currentWorkspace) ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Acceso Autorizado
            </Badge>
          ) : (
            <Badge variant="destructive">
              Sin Acceso
            </Badge>
          )}
          {/* 🔍 Debug badge para desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <Badge variant="secondary" className="text-xs">
              Disponibles: {availableWorkspaces.length}
            </Badge>
          )}
        </div>
      </div>

      {/* 🏢 Contenido del workspace */}
      {renderWorkspaceDashboard()}
    </div>
  );
}
