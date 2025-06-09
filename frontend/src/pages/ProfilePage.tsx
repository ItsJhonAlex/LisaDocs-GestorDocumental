import { User, Settings, Key, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';

export function ProfilePage() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* 📊 Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y configuraciones de cuenta
          </p>
        </div>

        {/* 👤 Placeholder de contenido */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>Perfil de Usuario</CardTitle>
            <CardDescription>
              Esta página está en desarrollo. Aquí podrás gestionar tu perfil y configuraciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Funcionalidades próximas:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <User className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-medium mb-1">Información personal</h4>
                  <p className="text-muted-foreground">Nombre, email, foto de perfil</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Key className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-medium mb-1">Cambiar contraseña</h4>
                  <p className="text-muted-foreground">Seguridad de la cuenta</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Settings className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-medium mb-1">Preferencias</h4>
                  <p className="text-muted-foreground">Tema, idioma, dashboard</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Bell className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-medium mb-1">Notificaciones</h4>
                  <p className="text-muted-foreground">Configurar alertas y avisos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
