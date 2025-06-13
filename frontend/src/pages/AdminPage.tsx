import { Shield, Users, Settings, BarChart3, Activity, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useState } from 'react';

/**
 * 🛡️ Página de Administración
 * 
 * Panel completo de administración del sistema LisaDocs:
 * - Dashboard con métricas generales
 * - Gestión completa de usuarios
 * - Configuraciones del sistema
 * - Monitoreo y análisis
 */
export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 🛡️ Verificación de permisos de administrador
  if (user?.role !== 'administrador') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl">Acceso Denegado</CardTitle>
            <CardDescription>
              Esta página está restringida solo para administradores del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="outline" className="mb-4">
              Rol actual: {user?.role || 'Sin rol'}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Si crees que esto es un error, contacta al administrador del sistema.
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
            <Shield className="h-8 w-8 text-primary" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestión completa del sistema LisaDocs - Bienvenido, {user.fullName}
          </p>
        </div>
        <Badge variant="default" className="px-3 py-1">
          <Shield className="w-4 h-4 mr-2" />
          Administrador
        </Badge>
      </div>

      {/* 🎛️ Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoreo
          </TabsTrigger>
        </TabsList>

        {/* 📊 Tab Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Métricas rápidas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
                  +-- nuevos esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documentos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
                  +-- subidos hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sesiones Activas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
                  en las últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado Sistema</CardTitle>
                <AlertTriangle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold text-green-600">OK</div>
            <p className="text-xs text-muted-foreground">
                  Todos los servicios operativos
            </p>
          </CardContent>
        </Card>
      </div>

          {/* Información del sistema */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Sistema</CardTitle>
                <CardDescription>Estado general de LisaDocs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Base de Datos</span>
                  <Badge variant="default">Conectada</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Almacenamiento</span>
                  <Badge variant="default">MinIO OK</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Backend</span>
                  <Badge variant="default">Funcionando</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Autenticación</span>
                  <Badge variant="default">JWT Activo</Badge>
                </div>
              </CardContent>
            </Card>


          </div>
        </TabsContent>

        {/* 👥 Tab Usuarios - Integración con AdminDashboard */}
        <TabsContent value="users" className="space-y-6">
          <AdminDashboard />
        </TabsContent>

        {/* ⚙️ Tab Sistema */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>Ajustes principales del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Registro de usuarios</div>
                      <div className="text-sm text-muted-foreground">Permitir auto-registro</div>
                    </div>
                    <Badge variant="secondary">Deshabilitado</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Verificación de email</div>
                      <div className="text-sm text-muted-foreground">Requerir verificación</div>
                    </div>
                    <Badge variant="default">Habilitado</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Modo mantenimiento</div>
                      <div className="text-sm text-muted-foreground">Sistema en mantenimiento</div>
                    </div>
                    <Badge variant="secondary">Deshabilitado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Seguridad</CardTitle>
                <CardDescription>Políticas de seguridad y acceso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Expiración de sesión</div>
                      <div className="text-sm text-muted-foreground">Tiempo límite de sesión</div>
                    </div>
                    <Badge variant="outline">24 horas</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Intentos de login</div>
                      <div className="text-sm text-muted-foreground">Máximo de intentos fallidos</div>
                    </div>
                    <Badge variant="outline">5 intentos</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">2FA</div>
                      <div className="text-sm text-muted-foreground">Autenticación de dos factores</div>
                    </div>
                    <Badge variant="secondary">Opcional</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Límites y Quotas</CardTitle>
                <CardDescription>Configuración de límites del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Tamaño máximo de archivo</div>
                      <div className="text-sm text-muted-foreground">Límite por documento</div>
                    </div>
                    <Badge variant="outline">50 MB</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Almacenamiento por usuario</div>
                      <div className="text-sm text-muted-foreground">Cuota individual</div>
                    </div>
                    <Badge variant="outline">1 GB</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Retención de logs</div>
                      <div className="text-sm text-muted-foreground">Tiempo de conservación</div>
                    </div>
                    <Badge variant="outline">90 días</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>Configuración de alertas y notificaciones</CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                      <div>
                      <div className="font-medium">Email de bienvenida</div>
                      <div className="text-sm text-muted-foreground">Nuevo usuario registrado</div>
                    </div>
                    <Badge variant="default">Habilitado</Badge>
                      </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Alertas de seguridad</div>
                      <div className="text-sm text-muted-foreground">Notificar actividad sospechosa</div>
                    </div>
                    <Badge variant="default">Habilitado</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Reportes automáticos</div>
                      <div className="text-sm text-muted-foreground">Envío programado de reportes</div>
                    </div>
                    <Badge variant="secondary">Deshabilitado</Badge>
                  </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* 📊 Tab Monitoreo */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monitoreo del Sistema</CardTitle>
              <CardDescription>
                Métricas de rendimiento y actividad en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Monitoreo Avanzado</h3>
                <p className="text-muted-foreground mb-4">
                  Las métricas de rendimiento y monitoreo en tiempo real estarán disponibles próximamente.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto">
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">99.9%</div>
                      <div className="text-xs text-muted-foreground">Uptime</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">&lt; 100ms</div>
                      <div className="text-xs text-muted-foreground">Respuesta</div>
              </div>
          </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">24/7</div>
                      <div className="text-xs text-muted-foreground">Disponible</div>
              </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 