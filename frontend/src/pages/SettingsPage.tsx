import { Settings, Database, Shield, Monitor } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';

export function SettingsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* 📊 Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración del Sistema</h1>
          <p className="text-muted-foreground">
            Administra las configuraciones generales de LisaDocs
          </p>
        </div>

        {/* ⚙️ Placeholder de contenido */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>Configuraciones del Sistema</CardTitle>
            <CardDescription>
              Esta página está en desarrollo. Aquí podrás configurar todos los aspectos del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Funcionalidades próximas:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Database className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-medium mb-1">Base de datos</h4>
                  <p className="text-muted-foreground">Respaldos, limpieza, mantenimiento</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-medium mb-1">Seguridad</h4>
                  <p className="text-muted-foreground">Políticas, autenticación, logs</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Monitor className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-medium mb-1">Sistema</h4>
                  <p className="text-muted-foreground">Rendimiento, almacenamiento, API</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Settings className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-medium mb-1">Configuraciones</h4>
                  <p className="text-muted-foreground">Email, notificaciones, límites</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
