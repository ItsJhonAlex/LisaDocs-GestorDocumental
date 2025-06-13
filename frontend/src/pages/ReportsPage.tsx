import { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  FileText,
  Users,
  Database,
  Activity,
  Shield,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { toast } from 'sonner';

// 📊 Los tipos ahora vienen del hook useReports

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
  const [selectedPeriod, setSelectedPeriod] = useState<'1month' | '3months' | '6months' | '1year'>('6months');
  const [activeTab, setActiveTab] = useState('overview');
  
  // 📊 Hook para manejar reportes
  const {
    stats,
    isLoading,
    isExporting,
    error,
    fetchStats,
    exportReport,
    refreshStats,
    clearError,
    getGrowthDisplay,
    getStorageDisplay,
    formatWorkspaceName
  } = useReports({ period: selectedPeriod });
  
  // 🛡️ Verificar permisos de acceso
  const canAccess = hasAnyRole(['administrador', 'presidente', 'vicepresidente']);

  // 📅 Manejar cambio de período
  const handlePeriodChange = async (newPeriod: string) => {
    const typedPeriod = newPeriod as '1month' | '3months' | '6months' | '1year';
    setSelectedPeriod(typedPeriod);
    try {
      await fetchStats(typedPeriod);
    } catch (error) {
      console.error('Error updating period:', error);
    }
  };

  // 📤 Manejar exportación
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      await exportReport(format, 'overview', selectedPeriod);
      toast.success(`Reporte ${format.toUpperCase()} descargado exitosamente! 📊`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Error al exportar el reporte. Inténtalo de nuevo.');
    }
  };

  // 🔄 Manejar refresh
  const handleRefresh = async () => {
    try {
      await refreshStats();
      toast.success('Estadísticas actualizadas! ✨');
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('Error al actualizar las estadísticas.');
    }
  };

  // 🚫 Limpiar error cuando el usuario interactúa
  const handleClearError = () => {
    clearError();
  };

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
      {/* 🚨 Mostrar error si existe */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Error al cargar estadísticas</h3>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearError}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🎯 Header de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h1>
          <p className="text-muted-foreground">
            Análisis detallado del uso y rendimiento del sistema LisaDocs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]" disabled={isLoading}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mes</SelectItem>
              <SelectItem value="3months">3 meses</SelectItem>
              <SelectItem value="6months">6 meses</SelectItem>
              <SelectItem value="1year">1 año</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Select onValueChange={(format) => handleExport(format as 'csv' | 'excel' | 'pdf')}>
            <SelectTrigger className="w-auto" disabled={isExporting || !stats}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 📊 Estadísticas principales */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalDocuments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {getGrowthDisplay()} desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalActiveUsers}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.overview.totalUsers} usuarios totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStorageDisplay()}</div>
              <p className="text-xs text-muted-foreground">
                Espacio utilizado en documentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getGrowthDisplay()}</div>
              <p className="text-xs text-muted-foreground">
                Documentos este mes vs anterior
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos disponibles. Intenta actualizar las estadísticas.</p>
            </div>
          </CardContent>
        </Card>
      )}

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
                  {stats && Object.entries(stats.documentsByMonth).map(([month, count]) => (
                    <div key={month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(Number(count) / Math.max(...Object.values(stats.documentsByMonth).map(Number))) * 100}%` }}
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
                {stats && Object.entries(stats.documentsByWorkspace).map(([workspace, count]) => (
                  <div key={workspace} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="font-medium">{formatWorkspaceName(workspace)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(Number(count) / stats.overview.totalDocuments) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {((Number(count) / stats.overview.totalDocuments) * 100).toFixed(1)}%
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