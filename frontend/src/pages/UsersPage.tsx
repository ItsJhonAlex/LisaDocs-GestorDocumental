import { Users, UserPlus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function UsersPage() {
  return (
    <div className="space-y-6">
      {/* 📊 Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Crear Usuario
        </Button>
      </div>

      {/* 🔍 Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* 👥 Placeholder de contenido */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>
            Esta página está en desarrollo. Aquí podrás administrar todos los usuarios del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Funcionalidades próximas:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-1">👤 Crear usuarios</h4>
                <p className="text-muted-foreground">Registro con validación</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-1">🎭 Gestión de roles</h4>
                <p className="text-muted-foreground">Asignar permisos y espacios</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-1">🔐 Control de acceso</h4>
                <p className="text-muted-foreground">Activar/desactivar usuarios</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-1">📊 Estadísticas</h4>
                <p className="text-muted-foreground">Actividad y uso del sistema</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
