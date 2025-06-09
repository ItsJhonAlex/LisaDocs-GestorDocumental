import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  Building, 
  Activity,
  Upload,
  Download,
  Plus
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';

export function DashboardPage() {
  const { user, canManageUsers } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">
        {/* 🎉 Bienvenida personalizada */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                ¡Hola, {user?.name?.split(' ')[0] || 'Usuario'}! 👋
              </h2>
              <p className="text-muted-foreground">
                Bienvenido de vuelta a LisaDocs. El sistema está funcionando correctamente.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Subir Documento
              </Button>
            </div>
          </div>
        </div>

        {/* 📊 Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Documentos
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold">0</p>
                    <Badge variant="secondary" className="text-xs">
                      Nuevo
                    </Badge>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {canManageUsers() && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Usuarios Activos
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-2xl font-bold">1</p>
                      <Badge variant="secondary" className="text-xs">
                        +100%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Espacios de Trabajo
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold">{user?.workspaces?.length || 0}</p>
                    <Badge variant="secondary" className="text-xs">
                      Activos
                    </Badge>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Actividad
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold">0</p>
                    <Badge variant="secondary" className="text-xs">
                      Hoy
                    </Badge>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-orange-50">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 🚀 Acciones rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Realiza las tareas más comunes desde aquí
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start">
                <Upload className="mr-2 h-4 w-4" />
                Subir Documento
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Descargar Reportes
              </Button>
              {canManageUsers() && (
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Gestionar Usuarios
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 👤 Tu información */}
          <Card>
            <CardHeader>
              <CardTitle>Tu Información</CardTitle>
              <CardDescription>
                Detalles de tu cuenta y rol en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">{user?.email || 'No disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rol:</span>
                  <span className="text-sm font-medium capitalize">
                    {user?.role?.replace('_', ' ') || 'No asignado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <span className="text-sm font-medium text-green-600">
                    {user?.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {user?.workspaces && user.workspaces.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Espacios:</span>
                    <div className="mt-1 space-x-1">
                      {user.workspaces.map((workspace) => (
                        <Badge key={workspace} variant="outline" className="text-xs">
                          {workspace}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 📰 Estado del sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>
              Información importante sobre LisaDocs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                🎉 ¡Bienvenido a LisaDocs! El sistema de gestión documental está funcionando correctamente.
              </p>
              <p className="text-sm text-muted-foreground">
                Este es un entorno de desarrollo. Las funcionalidades se irán habilitando progresivamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 