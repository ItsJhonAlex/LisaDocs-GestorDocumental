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
    canCreateUser,
    loading,
    error,
    pagination
  } = useUsers({ limit: 10 }); // 🔥 Empezar con límite pequeño

  // 🎯 Estado local
  const [activeTab, setActiveTab] = useState('users');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 🔄 Cargar estadísticas al montar
  useEffect(() => {
    // Solo cargar stats, el hook useUsers ya maneja la carga inicial de usuarios
    loadStats().catch(error => {
      console.error('Error loading stats:', error);
    });
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
    if (stats) {
      // 🛡️ Asegurar que stats tenga objetos válidos
      return {
        ...stats,
        usersByRole: stats.usersByRole || {},
        usersByWorkspace: stats.usersByWorkspace || {},
        recentUsers: stats.recentUsers || []
      };
    }

    // 🛡️ Asegurar que users sea un array válido
    const safeUsers = Array.isArray(users) ? users : [];

    const usersByRole = safeUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);

    const usersByWorkspace = safeUsers.reduce((acc, user) => {
      acc[user.workspace] = (acc[user.workspace] || 0) + 1;
      return acc;
    }, {} as Record<WorkspaceType, number>);

    const activeUsers = safeUsers.filter(u => u.isActive).length;
    const inactiveUsers = safeUsers.filter(u => !u.isActive).length;

    return {
      totalUsers: safeUsers.length,
      activeUsers,
      inactiveUsers,
      usersByRole, // 🔥 Siempre será un objeto válido
      usersByWorkspace, // 🔥 Siempre será un objeto válido
      recentUsers: safeUsers.slice(0, 5) // 🔥 Esto siempre será un array ahora
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
  }) => {
    // 🛡️ Asegurar que data sea un objeto válido
    const safeData = data && typeof data === 'object' ? data : {};
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>Distribución actual en el sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(safeData)
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
                    <span className="font-medium">{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* 🎯 Header con acciones */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold tracking-tight">Panel de Administración</h2>
            <Badge 
              variant="outline" 
              className={error ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}
            >
              {error ? "⚠️ Backend Desconectado" : "✅ Sistema Operativo"}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          
          {canCreateUser() && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          )}
          
          <Button variant="outline" onClick={() => exportUsers('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* 📊 Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Usuarios"
          value={loading ? '⏳' : localStats.totalUsers}
          description="Registrados en el sistema"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        
        <StatCard
          title="Usuarios Activos"
          value={loading ? '⏳' : localStats.activeUsers}
          description="Con acceso habilitado"
          icon={UserCheck}
          color="text-green-600"
          trend={{ value: 5, isPositive: true }}
        />
        
        <StatCard
          title="Usuarios Inactivos"
          value={loading ? '⏳' : localStats.inactiveUsers}
          description="Con acceso suspendido"
          icon={UserX}
          color="text-red-600"
        />
        
        <StatCard
          title="Tasa de Actividad"
          value={loading ? '⏳' : `${localStats.totalUsers > 0 ? Math.round((localStats.activeUsers / localStats.totalUsers) * 100) : 0}%`}
          description="Usuarios activos vs total"
          icon={Activity}
          color="text-blue-600"
        />
      </div>

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
              {(users && users.length > 0) ? (
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
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
                  <p>No hay usuarios registrados</p>
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
                        <span className="text-sm">Tiempo de sesión</span>
                        <Badge variant="outline">24 horas</Badge>
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
                        <span className="text-sm">Complejidad de contraseñas</span>
                        <Badge variant="default">Media</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Logs de auditoría</span>
                        <Badge variant="default">Habilitado</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Acciones Administrativas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" disabled>
                        <Shield className="w-4 h-4 mr-2" />
                        Backup Sistema
                      </Button>
                      <Button variant="outline" disabled>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Logs de Sistema
                      </Button>
                      <Button variant="outline" disabled>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verificar Integridad
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
