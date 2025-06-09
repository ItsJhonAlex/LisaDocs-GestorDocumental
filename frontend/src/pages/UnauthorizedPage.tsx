import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorLayout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';

export function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <ErrorLayout>
      <div className="space-y-6">
        {/* 🚫 Icono y título */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-12 h-12 text-destructive" />
          </div>
          
          <h1 className="text-6xl font-bold text-destructive mb-4">403</h1>
          <h2 className="text-2xl font-semibold mb-2">¡Acceso no autorizado!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            No tienes los permisos necesarios para acceder a esta página o recurso.
          </p>
        </div>

        {/* ⚠️ Información del usuario */}
        {user && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-sm">Información de tu cuenta:</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Usuario: {user.fullName} ({user.email})</p>
              <p>• Rol: {user.role?.replace('_', ' ')}</p>
              <p>• Workspace Principal: {user.workspace || 'Ninguno asignado'}</p>
              <p>• Espacios Disponibles: {user.permissions?.canView?.join(', ') || 'Ninguno'}</p>
            </div>
          </div>
        )}

        {/* 🎯 Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Ir al Dashboard
            </Link>
          </Button>
          
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver Atrás
            </Button>
        </div>

        {/* 💡 Sugerencias */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">¿Qué puedes hacer?</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Verifica si tienes el rol adecuado para esta función</li>
            <li>• Solicita acceso al administrador del sistema</li>
            <li>• Revisa si perteneces al espacio de trabajo requerido</li>
            <li>• Intenta acceder a las funciones disponibles para tu rol</li>
          </ul>
        </div>

        {/* 🏷️ Enlaces según el rol */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground text-center mb-3">
            Funciones disponibles para ti:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="link" size="sm" asChild>
              <Link to="/documents">Mis Documentos</Link>
            </Button>
            <Button variant="link" size="sm" asChild>
              <Link to="/profile">Mi Perfil</Link>
            </Button>
            {user?.permissions?.canView?.map(workspace => (
              <Button key={workspace} variant="link" size="sm" asChild>
                <Link to={`/workspaces/${workspace === 'comisiones_cf' ? 'comisiones' : workspace}`}>
                  {workspace.replace('_', ' ').replace('comisiones cf', 'Comisiones CF')}
                </Link>
              </Button>
            )) || null}
          </div>
        </div>

        {/* 🚪 Opción de logout */}
        <div className="pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground mb-2">
            ¿No eres {user?.fullName}?
          </p>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            Cambiar de cuenta
          </Button>
        </div>
      </div>
    </ErrorLayout>
  );
}
