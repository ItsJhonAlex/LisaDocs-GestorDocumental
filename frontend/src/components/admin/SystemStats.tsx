import { 
  TrendingUp, 
  Clock, 
  HardDrive, 
  Users,
  FileText,
  Activity,
  AlertCircle 
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// 🎯 Tipos para las estadísticas
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

interface SystemStatsProps {
  stats: AdminStats;
}

/**
 * 📊 Componente de Estadísticas del Sistema
 * 
 * Muestra métricas detalladas del sistema incluyendo:
 * - Uso de almacenamiento
 * - Performance del sistema
 * - Actividad de usuarios
 * - Estado de salud general
 */
export function SystemStats({ stats }: SystemStatsProps) {
  // 📊 Calcular porcentajes y métricas
  const storagePercentage = (stats.storageUsed / stats.storageTotal) * 100;
  const userActivityRate = (stats.activeUsers / stats.totalUsers) * 100;
  const avgDocumentsPerUser = Math.round(stats.totalDocuments / stats.totalUsers);

  return (
    <div className="space-y-6">
      {/* 🎯 Métricas de rendimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de Almacenamiento</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.storageUsed}GB</div>
            <div className="flex items-center space-x-2 mt-2">
              <Progress value={storagePercentage} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {storagePercentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              de {stats.storageTotal}GB disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad de Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Progress value={userActivityRate} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {userActivityRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              de {stats.totalUsers} usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo de Actividad</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemUptime}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Estable
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sistema operativo sin interrupciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📈 Análisis de uso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Actividad</CardTitle>
            <CardDescription>
              Métricas clave de uso del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Documentos por usuario</span>
              </div>
              <span className="font-semibold">{avgDocumentsPerUser}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-sm">Acciones recientes (24h)</span>
              </div>
              <span className="font-semibold">{stats.recentActivity}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Espacios de trabajo</span>
              </div>
              <span className="font-semibold">{stats.totalWorkspaces}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm">Acciones pendientes</span>
              </div>
              <Badge variant={stats.pendingActions > 0 ? "destructive" : "secondary"}>
                {stats.pendingActions}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>
              Indicadores de salud y performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Performance general</span>
                <span className="text-green-600 font-medium">Excelente</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Seguridad del sistema</span>
                <span className={stats.securityAlerts > 0 ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>
                  {stats.securityAlerts > 0 ? "Advertencias" : "Seguro"}
                </span>
              </div>
              <Progress value={stats.securityAlerts > 0 ? 75 : 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Disponibilidad</span>
                <span className="text-green-600 font-medium">99.9%</span>
              </div>
              <Progress value={99.9} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Capacidad de almacenamiento</span>
                <span className={storagePercentage > 80 ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>
                  {storagePercentage > 80 ? "Atención" : "Óptimo"}
                </span>
              </div>
              <Progress value={100 - storagePercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🚨 Alertas y notificaciones */}
      {stats.securityAlerts > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Alertas de Seguridad
            </CardTitle>
            <CardDescription className="text-orange-700">
              Hay {stats.securityAlerts} alerta(s) que requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                <div>
                  <p className="font-medium text-sm">Intentos de acceso no autorizado</p>
                  <p className="text-xs text-muted-foreground">Detectados en las últimas 24 horas</p>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  2 intentos
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
