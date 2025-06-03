import { useState } from 'react';
import { 
  Mail,
  Shield,
  Bell,
  Globe,
  HardDrive,
  Save
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// 🎯 Tipos para configuraciones del sistema
interface SystemConfig {
  general: {
    siteName: string;
    siteDescription: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    enableTwoFactor: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  storage: {
    maxFileSize: number;
    allowedFileTypes: string[];
    autoBackup: boolean;
    backupFrequency: string;
    retentionDays: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableEmail: boolean;
  };
  notifications: {
    enableLoginAlerts: boolean;
    enableDocumentAlerts: boolean;
    enableSystemAlerts: boolean;
    emailNotifications: boolean;
  };
}

// 📊 Configuración actual del sistema (mock)
const mockSystemConfig: SystemConfig = {
  general: {
    siteName: 'LisaDocs - Gestor Documental Municipal',
    siteDescription: 'Sistema de gestión documental para la administración municipal',
    timezone: 'America/Havana',
    language: 'es',
    maintenanceMode: false
  },
  security: {
    sessionTimeout: 8, // horas
    passwordMinLength: 8,
    enableTwoFactor: false,
    maxLoginAttempts: 5,
    lockoutDuration: 15 // minutos
  },
  storage: {
    maxFileSize: 50, // MB
    allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png'],
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 90
  },
  email: {
    smtpHost: 'mail.municipio.gob.cu',
    smtpPort: 587,
    smtpUser: 'sistema@municipio.gob.cu',
    smtpPassword: '••••••••',
    fromEmail: 'noreply@municipio.gob.cu',
    fromName: 'Sistema LisaDocs',
    enableEmail: true
  },
  notifications: {
    enableLoginAlerts: true,
    enableDocumentAlerts: true,
    enableSystemAlerts: true,
    emailNotifications: true
  }
};

/**
 * ⚙️ Componente de Configuración del Sistema
 * 
 * Permite configurar aspectos críticos del sistema:
 * - Configuraciones generales
 * - Políticas de seguridad
 * - Gestión de almacenamiento
 * - Configuración de email
 * - Preferencias de notificaciones
 */
export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>(mockSystemConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // 💾 Simular guardado de configuración
  const handleSave = async () => {
    setSaving(true);
    // Simular llamada al API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSaving(false);
    setHasChanges(false);
    
    // En producción: enviar configuración al backend
    console.log('Configuración guardada:', config);
  };

  // 🔄 Actualizar configuración
  const updateConfig = (section: keyof SystemConfig, key: string, value: string | number | boolean | string[]) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* 🎯 Header con botón de guardar */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>
                Administra las configuraciones críticas y preferencias del sistema
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {hasChanges && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Cambios sin guardar
                </Badge>
              )}
              <Button onClick={handleSave} disabled={!hasChanges || saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="storage">Almacenamiento</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>

        {/* ⚙️ Configuración General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Configuración General
              </CardTitle>
              <CardDescription>
                Configuraciones básicas del sistema y apariencia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nombre del Sistema</Label>
                  <Input
                    id="siteName"
                    value={config.general.siteName}
                    onChange={(e) => updateConfig('general', 'siteName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select 
                    value={config.general.timezone} 
                    onValueChange={(value) => updateConfig('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Havana">América/La Habana (GMT-5)</SelectItem>
                      <SelectItem value="America/New_York">América/Nueva York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/Madrid">Europa/Madrid (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descripción del Sistema</Label>
                <Textarea
                  id="siteDescription"
                  value={config.general.siteDescription}
                  onChange={(e) => updateConfig('general', 'siteDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Mantenimiento</Label>
                  <p className="text-sm text-muted-foreground">
                    Activar para realizar tareas de mantenimiento
                  </p>
                </div>
                <Switch
                  checked={config.general.maintenanceMode}
                  onCheckedChange={(checked: boolean) => updateConfig('general', 'maintenanceMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🔒 Configuración de Seguridad */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Políticas de Seguridad
              </CardTitle>
              <CardDescription>
                Configuraciones de autenticación y control de acceso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Tiempo de Sesión (horas)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="1"
                    max="24"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Longitud Mínima de Contraseña</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="50"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Máx. Intentos de Acceso</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Duración de Bloqueo (min)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    min="5"
                    max="60"
                    value={config.security.lockoutDuration}
                    onChange={(e) => updateConfig('security', 'lockoutDuration', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticación de Dos Factores</Label>
                  <p className="text-sm text-muted-foreground">
                    Requiere código adicional al iniciar sesión
                  </p>
                </div>
                <Switch
                  checked={config.security.enableTwoFactor}
                  onCheckedChange={(checked: boolean) => updateConfig('security', 'enableTwoFactor', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 💾 Configuración de Almacenamiento */}
        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Gestión de Almacenamiento
              </CardTitle>
              <CardDescription>
                Configuraciones de archivos, respaldos y retención
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Tamaño Máximo de Archivo (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    min="1"
                    max="1000"
                    value={config.storage.maxFileSize}
                    onChange={(e) => updateConfig('storage', 'maxFileSize', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Frecuencia de Respaldo</Label>
                  <Select 
                    value={config.storage.backupFrequency} 
                    onValueChange={(value) => updateConfig('storage', 'backupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Cada hora</SelectItem>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Días de Retención</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    min="7"
                    max="365"
                    value={config.storage.retentionDays}
                    onChange={(e) => updateConfig('storage', 'retentionDays', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipos de Archivo Permitidos</Label>
                <div className="flex flex-wrap gap-2">
                  {config.storage.allowedFileTypes.map((type) => (
                    <Badge key={type} variant="secondary">
                      .{type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Respaldo Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Crear respaldos automáticos según la frecuencia configurada
                  </p>
                </div>
                <Switch
                  checked={config.storage.autoBackup}
                  onCheckedChange={(checked: boolean) => updateConfig('storage', 'autoBackup', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📧 Configuración de Email */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Configuración de Email
              </CardTitle>
              <CardDescription>
                Configuraciones SMTP para notificaciones por email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label>Habilitar Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Activar para enviar notificaciones por correo electrónico
                  </p>
                </div>
                <Switch
                  checked={config.email.enableEmail}
                  onCheckedChange={(checked: boolean) => updateConfig('email', 'enableEmail', checked)}
                />
              </div>

              {config.email.enableEmail && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">Servidor SMTP</Label>
                    <Input
                      id="smtpHost"
                      value={config.email.smtpHost}
                      onChange={(e) => updateConfig('email', 'smtpHost', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Puerto SMTP</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={config.email.smtpPort}
                      onChange={(e) => updateConfig('email', 'smtpPort', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">Usuario SMTP</Label>
                    <Input
                      id="smtpUser"
                      value={config.email.smtpUser}
                      onChange={(e) => updateConfig('email', 'smtpUser', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">Contraseña SMTP</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={config.email.smtpPassword}
                      onChange={(e) => updateConfig('email', 'smtpPassword', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">Email Remitente</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={config.email.fromEmail}
                      onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">Nombre Remitente</Label>
                    <Input
                      id="fromName"
                      value={config.email.fromName}
                      onChange={(e) => updateConfig('email', 'fromName', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🔔 Configuración de Notificaciones */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription>
                Configurar qué eventos generan notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Inicio de Sesión</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre inicios de sesión inusuales
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.enableLoginAlerts}
                    onCheckedChange={(checked: boolean) => updateConfig('notifications', 'enableLoginAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Documentos</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre cambios en documentos
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.enableDocumentAlerts}
                    onCheckedChange={(checked: boolean) => updateConfig('notifications', 'enableDocumentAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas del Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre eventos críticos del sistema
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.enableSystemAlerts}
                    onCheckedChange={(checked: boolean) => updateConfig('notifications', 'enableSystemAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificaciones también por correo electrónico
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.emailNotifications}
                    onCheckedChange={(checked: boolean) => updateConfig('notifications', 'emailNotifications', checked)}
                    disabled={!config.email.enableEmail}
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
