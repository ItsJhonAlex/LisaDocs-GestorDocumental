import { UserPlus, Search, Filter, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';

export function UsersPage() {
  const { hasAnyRole } = useAuth();
  
  // 🛡️ Verificar permisos de acceso
  const canAccess = hasAnyRole(['administrador', 'presidente']);

  // 🚫 Si no tiene permisos, mostrar mensaje de acceso restringido
  if (!canAccess) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[600px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Acceso Restringido</CardTitle>
              <CardDescription>
                Solo administradores y presidentes pueden acceder a la gestión de usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Si necesitas acceso a esta funcionalidad, contacta con el administrador del sistema.
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><strong>Roles con acceso:</strong></p>
                <p>• Administrador</p>
                <p>• Presidente</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ✅ Si tiene permisos, mostrar el dashboard de administración completo
  return (
    <Layout>
      <div className="space-y-6">
        {/* 📊 Header de gestión de usuarios */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra usuarios, roles y permisos del sistema LisaDocs
            </p>
          </div>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Crear Usuario
          </Button>
        </div>

        {/* 🔍 Barra de búsqueda y filtros (placeholder funcional) */}
        <Card>
          <CardHeader>
            <CardTitle>Búsqueda y Filtros</CardTitle>
            <CardDescription>
              Herramientas para encontrar y filtrar usuarios específicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios por nombre, email o rol..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avanzados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 🎯 Dashboard completo de administración */}
        <AdminDashboard />
      </div>
    </Layout>
  );
}
