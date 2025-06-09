import { Shield, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminContent } from '@/components/admin/AdminDashboard';

/**
 * 👥 Página de Gestión de Usuarios
 * 
 * Panel dedicado para la gestión completa de usuarios:
 * - Disponible para administradores y presidentes
 * - Integración con el sistema de permisos
 * - Dashboard completo de usuarios
 */
export default function UsersPage() {
  const { user } = useAuth();
  
  // 🛡️ Verificación de permisos
  const canAccess = user?.role === 'administrador' || user?.role === 'presidente';

  // 🔍 Debug info
  console.log('UsersPage - Current user:', user);
  console.log('UsersPage - Can access:', canAccess);

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl">Acceso Restringido</CardTitle>
            <CardDescription>
              Esta página está disponible solo para administradores y presidentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="outline" className="mb-4">
              Rol actual: {user?.role || 'Sin rol'}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Necesitas permisos de administrador o presidente para gestionar usuarios.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 📊 Header de la página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-primary" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra usuarios, roles y permisos del sistema LisaDocs
          </p>
        </div>
        <Badge variant="default" className="px-3 py-1">
          <Shield className="w-4 h-4 mr-2" />
          {user.role === 'administrador' ? 'Administrador' : 'Presidente'}
        </Badge>
      </div>

      {/* 📋 Contenido principal */}
      <AdminContent />
    </div>
  );
}
