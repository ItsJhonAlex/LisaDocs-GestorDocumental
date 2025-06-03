import { useState } from 'react';
import { 
  Users, 
  Shield, 
  Activity, 
  Settings,
  FileText,
  Database,
  Lock,
  UserPlus,
  Search,
  Filter
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

import { SystemStats } from './SystemStats';
import { AuditLog } from './AuditLog';
import { PermissionMatrix } from './PermissionMatrix';
import { SystemSettings } from './SystemSettings';
import { useAuth } from '@/hooks/useAuth';

// 🎯 Tipos para estadísticas del sistema
interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  totalWorkspaces: number;
  systemUptime: string;
  storageUsed: number;
  storageTotal: number;
  recentActivity: number;
  securityAlerts: number;
  pendingActions: number;
}

// 📊 Mock data para estadísticas
const mockAdminStats: AdminStats = {
  totalUsers: 45,
  activeUsers: 38,
  totalDocuments: 1247,
  totalWorkspaces: 5,
  systemUptime: '15 días, 8 horas',
  storageUsed: 2.4,
  storageTotal: 10,
  recentActivity: 127,
  securityAlerts: 2,
  pendingActions: 5
};

/**
 * 🛡️ Dashboard Principal de Administración
 * 
 * Panel de control completo para administradores y presidentes:
 * - Estadísticas del sistema
 * - Gestión de usuarios y permisos
 * - Auditoría y logs
 * - Configuraciones del sistema
 */
export function AdminDashboard({ showHeader = true }: { showHeader?: boolean }) {
  const { hasAnyRole } = useAuth();
  const [stats] = useState<AdminStats>(mockAdminStats);
  const [activeTab, setActiveTab] = useState('overview');

  // 🛡️ Verificar permisos de acceso
  const canAccess = hasAnyRole(['administrador', 'presidente']);

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Acceso Restringido</CardTitle>
            <CardDescription>
              Solo administradores y presidentes pueden acceder a esta sección.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🎯 Header del Dashboard de Gestión de Usuarios - Condicional */}
      {showHeader && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
              <p className="text-muted-foreground">
                Administra usuarios, roles y permisos del sistema LisaDocs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Sistema Operativo
                </Badge>
                {stats.securityAlerts > 0 && (
                  <Badge variant="destructive">
                    {stats.securityAlerts} Alertas
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 🔍 Barra de búsqueda y filtros */}
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
        </>
      )}

      {/* 📊 Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <Badge variant="secondary" className="text-xs">
                    +{stats.activeUsers} activos
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documentos</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                  <Badge variant="secondary" className="text-xs">
                    Total
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Almacenamiento</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold">{stats.storageUsed}GB</p>
                  <Badge variant="secondary" className="text-xs">
                    de {stats.storageTotal}GB
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <Database className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actividad</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold">{stats.recentActivity}</p>
                  <Badge variant="secondary" className="text-xs">
                    Últimas 24h
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Seguridad</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold">{stats.securityAlerts}</p>
                  <Badge 
                    variant={stats.securityAlerts > 0 ? "destructive" : "secondary"} 
                    className="text-xs"
                  >
                    Alertas
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🚀 Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas de Administración</CardTitle>
          <CardDescription>
            Gestiona los aspectos más importantes del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center">
              <Users className="w-6 h-6 mb-2" />
              <span>Gestionar Usuarios</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Lock className="w-6 h-6 mb-2" />
              <span>Matriz de Permisos</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Activity className="w-6 h-6 mb-2" />
              <span>Log de Auditoría</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Settings className="w-6 h-6 mb-2" />
              <span>Configuración</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 📋 Pestañas de contenido */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión del Sistema</CardTitle>
          <CardDescription>
            Herramientas avanzadas de administración y monitoreo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="audit">Auditoría</TabsTrigger>
              <TabsTrigger value="permissions">Permisos</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <SystemStats stats={stats} />
            </TabsContent>

            <TabsContent value="audit" className="space-y-4 mt-6">
              <AuditLog />
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4 mt-6">
              <PermissionMatrix />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-6">
              <SystemSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 📊 Contenido del Dashboard de Administración (sin header)
 * 
 * Versión sin header para usar dentro de layouts que ya tienen su propio header
 */
export function AdminContent() {
  return <AdminDashboard showHeader={false} />;
}
