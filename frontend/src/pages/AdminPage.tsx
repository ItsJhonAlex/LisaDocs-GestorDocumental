import { useState } from 'react';
import { 
  Shield, 
  Users, 
  Database, 
  Activity, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  HardDrive,
  Cpu,
  Wifi
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

// 🛡️ Tipos para el panel de administración
interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  cpu: number;
  memory: number;
  disk: number;
  database: 'connected' | 'disconnected' | 'slow';
  services: {
    name: string;
    status: 'running' | 'stopped' | 'error';
    uptime: string;
  }[];
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  documentsToday: number;
  storageUsed: number;
  totalStorage: number;
  apiCalls: number;
  errors: number;
}

// 💡 Mock data para el sistema
const mockSystemHealth: SystemHealth = {
  status: 'healthy',
  uptime: '15 días, 8 horas',
  cpu: 45,
  memory: 68,
  disk: 72,
  database: 'connected',
  services: [
    { name: 'API Server', status: 'running', uptime: '15d 8h' },
    { name: 'Database', status: 'running', uptime: '15d 8h' },
    { name: 'File Storage', status: 'running', uptime: '15d 8h' },
    { name: 'Email Service', status: 'running', uptime: '15d 8h' },
    { name: 'Background Jobs', status: 'running', uptime: '15d 8h' }
  ]
};

const mockSystemStats: SystemStats = {
  totalUsers: 45,
  activeUsers: 32,
  totalDocuments: 1247,
  documentsToday: 23,
  storageUsed: 2.4,
  totalStorage: 10,
  apiCalls: 15420,
  errors: 3
};

/**
 * 🛡️ Página de Administración del Sistema
 * 
 * Panel principal de administración del sistema solo para:
 * - Administradores
 */
export function AdminPage() {
  const { hasRole } = useAuth();
  const [systemHealth] = useState<SystemHealth>(mockSystemHealth);
  const [systemStats] = useState<SystemStats>(mockSystemStats);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🛡️ Verificar permisos de acceso
  const canAccess = hasRole('administrador');

  // 🚫 Si no tiene permisos, mostrar mensaje de acceso restringido
  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Acceso Restringido</CardTitle>
            <CardDescription>
              Solo administradores pueden acceder al panel de administración.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Si necesitas acceso a esta funcionalidad, contacta con el administrador principal del sistema.
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p><strong>Rol requerido:</strong></p>
              <p>• Administrador</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🔄 Funciones de administración
  const handleRestartService = async (serviceName: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Restarting service:', serviceName);
    } catch (error) {
      console.error('Error restarting service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaintenanceMode = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Toggling maintenance mode');
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 Función para obtener el estado de salud del sistema
  const getHealthBadge = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-700">Saludable</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700">Advertencia</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-700">Crítico</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  // 🎨 Función para obtener el icono de estado del servicio
  const getServiceIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'stopped':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // ✅ Mostrar el panel de administración
  return (
    <div className="space-y-6">
      {/* 🎯 Header de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Monitor del sistema, servicios y estadísticas de LisaDocs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Estado del Sistema:</span>
          {getHealthBadge(systemHealth.status)}
        </div>
      </div>

      {/* 📊 Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              de {systemStats.totalUsers} usuarios totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Hoy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.documentsToday}</div>
            <p className="text-xs text-muted-foreground">
              Total: {systemStats.totalDocuments}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.storageUsed}GB</div>
            <p className="text-xs text-muted-foreground">
              de {systemStats.totalStorage}GB disponibles
            </p>
            <Progress 
              value={(systemStats.storageUsed / systemStats.totalStorage) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.apiCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.errors} errores hoy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🔧 Paneles de administración */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
        </TabsList>

        {/* 📈 Tab Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
                <CardDescription>
                  Información general sobre el funcionamiento del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-muted-foreground">{systemHealth.uptime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Base de Datos</span>
                  <Badge 
                    variant={systemHealth.database === 'connected' ? 'default' : 'destructive'}
                    className={systemHealth.database === 'connected' ? 'bg-green-100 text-green-700' : ''}
                  >
                    {systemHealth.database === 'connected' ? 'Conectada' : 'Desconectada'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Servicios Activos</span>
                  <span className="text-sm text-muted-foreground">
                    {systemHealth.services.filter(s => s.status === 'running').length} / {systemHealth.services.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Actualización</span>
                  <span className="text-sm text-muted-foreground">Hace 2 minutos</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recursos del Sistema</CardTitle>
                <CardDescription>
                  Uso actual de recursos del servidor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU</span>
                    <span className="text-sm text-muted-foreground">{systemHealth.cpu}%</span>
                  </div>
                  <Progress value={systemHealth.cpu} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memoria</span>
                    <span className="text-sm text-muted-foreground">{systemHealth.memory}%</span>
                  </div>
                  <Progress value={systemHealth.memory} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disco</span>
                    <span className="text-sm text-muted-foreground">{systemHealth.disk}%</span>
                  </div>
                  <Progress value={systemHealth.disk} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 🔧 Tab Servicios */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Servicios</CardTitle>
              <CardDescription>
                Monitor y control de servicios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getServiceIcon(service.status)}
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={service.status === 'running' ? 'default' : 'destructive'}
                        className={service.status === 'running' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {service.status === 'running' ? 'Ejecutándose' : 'Detenido'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestartService(service.name)}
                        disabled={isLoading}
                      >
                        Reiniciar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📊 Tab Rendimiento */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Rendimiento</CardTitle>
              <CardDescription>
                Análisis detallado del rendimiento del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Cpu className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Métricas de Rendimiento</h3>
                <p className="text-muted-foreground mb-4">
                  Los gráficos detallados de rendimiento estarán disponibles próximamente.
                </p>
                <Button variant="outline">
                  <Activity className="w-4 h-4 mr-2" />
                  Ver Histórico
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🛠️ Tab Mantenimiento */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Herramientas de Mantenimiento</CardTitle>
              <CardDescription>
                Operaciones de mantenimiento y administración del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col"
                  onClick={handleMaintenanceMode}
                  disabled={isLoading}
                >
                  <Settings className="w-6 h-6 mb-2" />
                  Modo Mantenimiento
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col"
                  disabled={isLoading}
                >
                  <Database className="w-6 h-6 mb-2" />
                  Backup Base de Datos
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col"
                  disabled={isLoading}
                >
                  <HardDrive className="w-6 h-6 mb-2" />
                  Limpiar Cache
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col"
                  disabled={isLoading}
                >
                  <Wifi className="w-6 h-6 mb-2" />
                  Test Conectividad
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Zona de Peligro</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Estas acciones pueden afectar el funcionamiento del sistema. Úsalas con precaución.
                </p>
                <div className="space-y-2">
                  <Button variant="destructive" disabled={isLoading}>
                    Reiniciar Sistema
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 