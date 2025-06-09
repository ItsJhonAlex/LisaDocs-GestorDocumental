import { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  FileText,
  Users,
  Database,
  Activity,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';

// 📊 Tipos para reportes
interface ReportStats {
  totalDocuments: number;
  totalUsers: number;
  documentsByWorkspace: Record<string, number>;
  documentsByMonth: Record<string, number>;
  userActivity: number;
  storageUsed: number;
}

// 📈 Mock data para reportes
const mockReportStats: ReportStats = {
  totalDocuments: 1247,
  totalUsers: 45,
  documentsByWorkspace: {
    'presidencia': 523,
    'cam': 298,
    'ampp': 187,
    'intendencia': 156,
    'comisiones_cf': 83
  },
  documentsByMonth: {
    'Enero': 89,
    'Febrero': 124,
    'Marzo': 156,
    'Abril': 134,
    'Mayo': 178,
    'Junio': 145
  },
  userActivity: 87,
  storageUsed: 2.4
};

/**
 * 📊 Página de Reportes
 * 
 * Dashboard de reportes y estadísticas del sistema para:
 * - Administradores
 * - Presidentes 
 * - Vicepresidentes
 */
export function ReportsPage() {
  const { hasAnyRole } = useAuth();
  const [stats] = useState<ReportStats>(mockReportStats);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [activeTab, setActiveTab] = useState('overview');
  
  // 🛡️ Verificar permisos de acceso
  const canAccess = hasAnyRole(['administrador', 'presidente', 'vicepresidente']);

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
              Solo administradores, presidentes y vicepresidentes pueden acceder a los reportes.
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
              <p>• Vicepresidente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Si tiene permisos, mostrar los reportes
  return (
    <div className="space-y-6">
      {/* 🎯 Header de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h1>
          <p className="text-muted-foreground">
            Análisis detallado del uso y rendimiento del sistema LisaDocs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mes</SelectItem>
              <SelectItem value="3months">3 meses</SelectItem>
              <SelectItem value="6months">6 meses</SelectItem>
              <SelectItem value="1year">1 año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* 📊 Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              +12% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.userActivity}% de actividad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.storageUsed}GB</div>
            <p className="text-xs text-muted-foreground">
              24% del total disponible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15%</div>
            <p className="text-xs text-muted-foreground">
              Documentos este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📈 Reportes detallados */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="workspaces">Por Workspace</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="storage">Almacenamiento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos por Mes</CardTitle>
                <CardDescription>
                  Tendencia de creación de documentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.documentsByMonth).map(([month, count]) => (
                    <div key={month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(count / Math.max(...Object.values(stats.documentsByMonth))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
                <CardDescription>
                  Indicadores de salud general
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rendimiento</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Excelente
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Disponibilidad</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    99.9%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Respaldo</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Actualizado
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Seguridad</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Seguro
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workspaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos por Espacio de Trabajo</CardTitle>
              <CardDescription>
                Distribución de documentos en cada workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.documentsByWorkspace).map(([workspace, count]) => (
                  <div key={workspace} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="font-medium capitalize">{workspace.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / stats.totalDocuments) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {((count / stats.totalDocuments) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad del Sistema</CardTitle>
              <CardDescription>
                Métricas de uso y engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Reportes de Actividad</h3>
                <p className="text-muted-foreground mb-4">
                  Los reportes detallados de actividad estarán disponibles próximamente.
                </p>
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Programar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Almacenamiento</CardTitle>
              <CardDescription>
                Uso detallado del espacio de almacenamiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Análisis de Almacenamiento</h3>
                <p className="text-muted-foreground mb-4">
                  Los reportes detallados de almacenamiento estarán disponibles próximamente.
                </p>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Generar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 