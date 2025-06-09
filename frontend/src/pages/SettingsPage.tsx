import { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Mail,
  Bell,
  Lock,
  HardDrive,
  Save,
  RefreshCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

// ⚙️ Tipos para configuraciones del sistema
interface SystemConfig {
  general: {
    siteName: string;
    siteDescription: string;
    maxFileSize: number;
    allowedFileTypes: string[];
    sessionTimeout: number;
  };
  email: {
    enabled: boolean;
    smtpServer: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  notifications: {
    emailNotifications: boolean;
    systemAlerts: boolean;
    documentUpdates: boolean;
    userRegistrations: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    passwordComplexity: string;
    sessionSecurity: string;
    ipWhitelist: boolean;
  };
  storage: {
    maxStorageSize: number;
    autoCleanup: boolean;
    cleanupDays: number;
    compressionEnabled: boolean;
  };
}

// 🔧 Mock data para configuraciones
const mockSystemConfig: SystemConfig = {
  general: {
    siteName: 'LisaDocs',
    siteDescription: 'Sistema de Gestión Documental Municipal',
    maxFileSize: 50,
    allowedFileTypes: ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png'],
    sessionTimeout: 120
  },
  email: {
    enabled: true,
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@lisadocs.com',
    smtpPassword: '••••••••',
    fromEmail: 'noreply@lisadocs.com',
    fromName: 'LisaDocs Sistema'
  },
  notifications: {
    emailNotifications: true,
    systemAlerts: true,
    documentUpdates: false,
    userRegistrations: true
  },
  security: {
    twoFactorAuth: false,
    passwordComplexity: 'medium',
    sessionSecurity: 'high',
    ipWhitelist: false
  },
  storage: {
    maxStorageSize: 100,
    autoCleanup: true,
    cleanupDays: 365,
    compressionEnabled: true
  }
};

/**
 * ⚙️ Página de Configuración del Sistema
 * 
 * Panel de configuraciones generales del sistema solo para:
 * - Administradores
 */
export function SettingsPage() {
  const { hasRole } = useAuth();
  const [config, setConfig] = useState<SystemConfig>(mockSystemConfig);
  const [activeTab, setActiveTab] = useState('general');
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
              Solo administradores pueden acceder a las configuraciones del sistema.
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

  // 💾 Función para guardar configuraciones
  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Saving configuration:', config);
      // En producción: hacer llamada al API
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Función para resetear configuraciones
  const handleResetConfig = () => {
    setConfig(mockSystemConfig);
  };

  // ✅ Mostrar las configuraciones del sistema
  return (
    <div className="space-y-6">
      {/* 🎯 Header de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
          <p className="text-muted-foreground">
            Administra las configuraciones generales y políticas del sistema LisaDocs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleResetConfig}
            disabled={isLoading}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Resetear
          </Button>
          <Button onClick={handleSaveConfig} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* ⚙️ Configuraciones por categorías */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="storage">Almacenamiento</TabsTrigger>
        </TabsList>

        {/* 🏷️ Tab General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración General
              </CardTitle>
              <CardDescription>
                Configuraciones básicas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nombre del Sistema</Label>
                  <Input
                    id="siteName"
                    value={config.general.siteName}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      general: { ...prev.general, siteName: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de Sesión (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={config.general.sessionTimeout}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      general: { ...prev.general, sessionTimeout: Number(e.target.value) }
                    }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descripción del Sistema</Label>
                <Input
                  id="siteDescription"
                  value={config.general.siteDescription}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    general: { ...prev.general, siteDescription: e.target.value }
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Tamaño Máximo de Archivo (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={config.general.maxFileSize}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      general: { ...prev.general, maxFileSize: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipos de Archivo Permitidos</Label>
                  <p className="text-sm text-muted-foreground">
                    {config.general.allowedFileTypes.join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📧 Tab Email */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Configuración de Email
              </CardTitle>
              <CardDescription>
                Configuraciones del servidor SMTP y emails del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir el envío de emails desde el sistema
                  </p>
                </div>
                <Switch
                  checked={config.email.enabled}
                  onCheckedChange={(checked) => setConfig(prev => ({
                    ...prev,
                    email: { ...prev.email, enabled: checked }
                  }))}
                />
              </div>

              {config.email.enabled && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="smtpServer">Servidor SMTP</Label>
                      <Input
                        id="smtpServer"
                        value={config.email.smtpServer}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          email: { ...prev.email, smtpServer: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">Puerto SMTP</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={config.email.smtpPort}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          email: { ...prev.email, smtpPort: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">Email de Origen</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={config.email.fromEmail}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          email: { ...prev.email, fromEmail: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromName">Nombre de Origen</Label>
                      <Input
                        id="fromName"
                        value={config.email.fromName}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          email: { ...prev.email, fromName: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🔔 Tab Notificaciones */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configuración de Notificaciones
              </CardTitle>
              <CardDescription>
                Controla qué notificaciones se envían a los usuarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificaciones importantes por email
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.emailNotifications}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, emailNotifications: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas del Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar errores y eventos críticos del sistema
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.systemAlerts}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, systemAlerts: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Actualizaciones de Documentos</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar cuando se actualicen documentos
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.documentUpdates}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, documentUpdates: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registro de Usuarios</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar cuando se registren nuevos usuarios
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.userRegistrations}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, userRegistrations: checked }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🔒 Tab Seguridad */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Configuración de Seguridad
              </CardTitle>
              <CardDescription>
                Políticas de seguridad y autenticación del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticación de Dos Factores</Label>
                    <p className="text-sm text-muted-foreground">
                      Requerir 2FA para todos los usuarios
                    </p>
                  </div>
                  <Switch
                    checked={config.security.twoFactorAuth}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      security: { ...prev.security, twoFactorAuth: checked }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Complejidad de Contraseñas</Label>
                    <Select
                      value={config.security.passwordComplexity}
                      onValueChange={(value) => setConfig(prev => ({
                        ...prev,
                        security: { ...prev.security, passwordComplexity: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Seguridad de Sesión</Label>
                    <Select
                      value={config.security.sessionSecurity}
                      onValueChange={(value) => setConfig(prev => ({
                        ...prev,
                        security: { ...prev.security, sessionSecurity: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lista Blanca de IPs</Label>
                    <p className="text-sm text-muted-foreground">
                      Restringir acceso solo a IPs autorizadas
                    </p>
                  </div>
                  <Switch
                    checked={config.security.ipWhitelist}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      security: { ...prev.security, ipWhitelist: checked }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 💾 Tab Almacenamiento */}
        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Configuración de Almacenamiento
              </CardTitle>
              <CardDescription>
                Gestión del espacio de almacenamiento y archivos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxStorageSize">Almacenamiento Máximo (GB)</Label>
                  <Input
                    id="maxStorageSize"
                    type="number"
                    value={config.storage.maxStorageSize}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      storage: { ...prev.storage, maxStorageSize: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cleanupDays">Días para Limpieza Automática</Label>
                  <Input
                    id="cleanupDays"
                    type="number"
                    value={config.storage.cleanupDays}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      storage: { ...prev.storage, cleanupDays: Number(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Limpieza Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Eliminar automáticamente archivos antiguos
                    </p>
                  </div>
                  <Switch
                    checked={config.storage.autoCleanup}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      storage: { ...prev.storage, autoCleanup: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compresión de Archivos</Label>
                    <p className="text-sm text-muted-foreground">
                      Comprimir archivos para ahorrar espacio
                    </p>
                  </div>
                  <Switch
                    checked={config.storage.compressionEnabled}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      storage: { ...prev.storage, compressionEnabled: checked }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
