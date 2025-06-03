import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Activity, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Plus,
  Download,
  RefreshCw,
  User
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

import { useUsers } from '@/hooks/useUsers';
import { UserList } from '../users/UserList';
import { CreateUserDialog } from '../users/CreateUserDialog';
import type { UserRole, WorkspaceType } from '@/types/auth';

// 🎨 Configuración de colores para roles
const ROLE_COLORS: Record<UserRole, string> = {
  administrador: 'bg-purple-500',
  presidente: 'bg-blue-500',
  vicepresidente: 'bg-indigo-500',
  secretario_cam: 'bg-green-500',
  secretario_ampp: 'bg-yellow-500',
  secretario_cf: 'bg-orange-500',
  intendente: 'bg-red-500',
  cf_member: 'bg-gray-500'
};

const WORKSPACE_COLORS: Record<WorkspaceType, string> = {
  presidencia: 'bg-blue-500',
  intendencia: 'bg-red-500',
  cam: 'bg-green-500',
  ampp: 'bg-yellow-500',
  comisiones_cf: 'bg-orange-500'
};

/**
 * 🎛️ Dashboard de Administración
 * 
 * Panel completo para la administración del sistema:
 * - Estadísticas generales de usuarios
 * - Distribución por roles y workspaces
 * - Actividad reciente
 * - Gestión de usuarios
 * - Herramientas administrativas
 */
export function AdminDashboard() {
  // 🎣 Hooks
  const { 
    users, 
    stats, 
    loadStats, 
    exportUsers,
    canCreateUser 
  } = useUsers({ limit: 50 });

  // 🎯 Estado local
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 🔄 Cargar estadísticas al montar
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // 🔄 Refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadStats();
    } finally {
      setRefreshing(false);
    }
  };

  // 📊 Calcular estadísticas locales si no tenemos stats del servidor
  const localStats = React.useMemo(() => {
    if (stats) return stats;

    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);

    const usersByWorkspace = users.reduce((acc, user) => {
      acc[user.workspace] = (acc[user.workspace] || 0) + 1;
      return acc;
    }, {} as Record<WorkspaceType, number>);

    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = users.filter(u => !u.isActive).length;

    return {
      totalUsers: users.length,
      activeUsers,
      inactiveUsers,
      usersByRole,
      usersByWorkspace,
      recentUsers: users.slice(0, 5)
    };
  }, [users, stats]);

  // 🎨 Componente de estadística rápida
  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend, 
    color = 'text-primary' 
  }: {
    title: string;
    value: number | string;
    description: string;
    icon: React.ElementType;
    trend?: { value: number; isPositive: boolean };
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          <span>{description}</span>
          {trend && (
            <span className={`ml-1 flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // 🎨 Componente de distribución
  const DistributionCard = ({ 
    title, 
    data, 
    colors, 
    total 
  }: {
    title: string;
    data: Record<string, number>;
    colors: Record<string, string>;
    total: number;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Distribución actual en el sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(data)
          .sort(([,a], [,b]) => b - a)
          .map(([key, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${colors[key] || 'bg-gray-400'}`} />
                    <span className="capitalize">{key.replace('_', ' ')}</span>
                  </div>
                  <span className="font-medium">{count}</span>
            </div>
                <Progress value={percentage} className="h-2" />
      </div>
    );
          })}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* 🎯 Header del Dashboard de Gestión de Usuarios */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
              <p className="text-muted-foreground">
                Administra usuarios, roles y permisos del sistema LisaDocs
              </p>
            </div>
            <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="h-20"
          >
            <Plus className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Sistema Operativo
                </Badge>
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
                  <Input
                    placeholder="Buscar usuarios por nombre, email o rol..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  Filtros Avanzados
                </Button>
              </div>
            </CardContent>
          </Card>

      {/* 📊 Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Usuarios"
          value={localStats.totalUsers}
          description="Registrados en el sistema"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        
        <StatCard
          title="Usuarios Activos"
          value={localStats.activeUsers}
          description="Con acceso habilitado"
          icon={UserCheck}
          color="text-green-600"
          trend={{ value: 5, isPositive: true }}
        />
        
        <StatCard
          title="Usuarios Inactivos"
          value={localStats.inactiveUsers}
          description="Con acceso suspendido"
          icon={UserX}
          color="text-red-600"
        />
        
        <StatCard
          title="Tasa de Actividad"
          value={`${localStats.totalUsers > 0 ? Math.round((localStats.activeUsers / localStats.totalUsers) * 100) : 0}%`}
          description="Usuarios activos vs total"
          icon={Activity}
          color="text-blue-600"
        />
      </div>

      {/* 🔧 Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Acciones Rápidas
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {canCreateUser() && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="h-20 flex flex-col"
              >
                <Plus className="h-6 w-6 mb-2" />
                Crear Usuario
            </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => exportUsers('csv')}
              className="h-20 flex flex-col"
            >
              <Download className="h-6 w-6 mb-2" />
              Exportar CSV
            </Button>
            
            <Button
              variant="outline"
              onClick={() => exportUsers('excel')}
              className="h-20 flex flex-col"
            >
              <Download className="h-6 w-6 mb-2" />
              Exportar Excel
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col"
              disabled
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              Reportes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 📊 Panel con tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

        {/* 📈 Tab Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionCard
              title="Distribución por Roles"
              data={localStats.usersByRole}
              colors={ROLE_COLORS}
              total={localStats.totalUsers}
            />
            
            <DistributionCard
              title="Distribución por Workspaces"
              data={localStats.usersByWorkspace}
              colors={WORKSPACE_COLORS}
              total={localStats.totalUsers}
            />
          </div>

          {/* Usuarios recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Usuarios Recientes</CardTitle>
              <CardDescription>Últimos usuarios registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {localStats.recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {localStats.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Badge variant="outline">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p>No hay usuarios recientes</p>
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>

        {/* 👥 Tab Usuarios */}
        <TabsContent value="users" className="space-y-4">
          <UserList />
            </TabsContent>

        {/* 📊 Tab Analíticas */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analíticas y Reportes</CardTitle>
              <CardDescription>
                Métricas avanzadas y análisis de uso del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analíticas Avanzadas</h3>
                <p className="text-muted-foreground mb-4">
                  Los reportes detallados y analíticas estarán disponibles próximamente.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <Button variant="outline" disabled>
                    <Activity className="w-4 h-4 mr-2" />
                    Actividad de Usuarios
                  </Button>
                  <Button variant="outline" disabled>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Tendencias de Uso
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

        {/* ⚙️ Tab Configuración */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>
                Configuraciones administrativas y preferencias del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Configuración de Usuarios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Registro automático</span>
                        <Badge variant="secondary">Deshabilitado</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Verificación de email</span>
                        <Badge variant="default">Habilitado</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Expiración de contraseñas</span>
                        <Badge variant="outline">90 días</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Seguridad</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Autenticación 2FA</span>
                        <Badge variant="secondary">Opcional</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sesiones concurrentes</span>
                        <Badge variant="outline">Ilimitadas</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Logs de auditoría</span>
                        <Badge variant="default">Habilitado</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Acciones de Mantenimiento</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <Shield className="w-4 h-4 mr-2" />
                      Backup DB
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Limpiar Cache
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verificar Sistema
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Modo Mantenimiento
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            </TabsContent>
          </Tabs>

      {/* 🔲 Dialogs */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}

/**
 * 🎯 Componente de contenido administrativo para exportar
 * (usado en UsersPage.tsx)
 */
export function AdminContent() {
  return <AdminDashboard />;
}
