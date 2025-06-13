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
import ActivityFeed from '@/components/ActivityFeed';
import { useRecentActivity } from '@/hooks/useActivity';

export function DashboardPage() {
  const { user, canManageUsers } = useAuth();
  const { recentActivity, loading: activityLoading, error: activityError } = useRecentActivity(8);

  return (
    <Layout>
      <div className="space-y-6">
        {/* 🎉 Bienvenida personalizada */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                ¡Hola, {user?.fullName?.split(' ')[0] || 'Usuario'}! 👋
              </h2>
              <p className="text-muted-foreground">
                Bienvenido de vuelta a LisaDocs. El sistema está funcionando correctamente.
              </p>
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
                    <p className="text-2xl font-bold">1</p>
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
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Workspace:</span>
                <Badge variant="outline" className="text-xs">
                  {user?.workspace || 'No asignado'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 📊 Actividad Reciente del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente del Sistema</CardTitle>
            <CardDescription>
              Últimas acciones realizadas en LisaDocs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed 
              activities={recentActivity}
              loading={activityLoading}
              error={activityError || undefined}
              compact={true}
              showHeader={false}
              limit={8}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 