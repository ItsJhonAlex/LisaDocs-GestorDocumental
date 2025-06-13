import { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Send, 
  Plus,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';

// 🔔 Tipos para notificaciones
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'sent' | 'scheduled';
  recipients: 'all' | 'admins' | 'workspace' | 'custom';
  workspace?: string;
  customRecipients?: string[];
  createdAt: string;
  sentAt?: string;
  scheduledFor?: string;
  createdBy: string;
  readCount: number;
  totalRecipients: number;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isActive: boolean;
}

// 📧 Mock data para notificaciones
const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Mantenimiento Programado',
    message: 'El sistema estará en mantenimiento el viernes de 22:00 a 02:00. Durante este tiempo no podrás acceder al sistema.',
    type: 'warning',
    priority: 'high',
    status: 'sent',
    recipients: 'all',
    createdAt: '2025-01-15T10:00:00Z',
    sentAt: '2025-01-15T10:05:00Z',
    createdBy: 'Jonathan Rodriguez',
    readCount: 42,
    totalRecipients: 45
  },
  {
    id: 'notif-2',
    title: 'Nueva Funcionalidad Disponible',
    message: 'Ya está disponible la nueva función de reportes avanzados en la sección de administración.',
    type: 'success',
    priority: 'medium',
    status: 'sent',
    recipients: 'admins',
    createdAt: '2025-01-14T14:30:00Z',
    sentAt: '2025-01-14T14:35:00Z',
    createdBy: 'Jonathan Rodriguez',
    readCount: 8,
    totalRecipients: 12
  },
  {
    id: 'notif-3',
    title: 'Actualización de Seguridad',
    message: 'Se ha instalado una actualización de seguridad importante. Se recomienda cerrar y volver a abrir sesión.',
    type: 'info',
    priority: 'low',
    status: 'draft',
    recipients: 'all',
    createdAt: '2025-01-16T09:15:00Z',
    createdBy: 'Jonathan Rodriguez',
    readCount: 0,
    totalRecipients: 0
  }
];

const mockTemplates: NotificationTemplate[] = [
  {
    id: 'template-1',
    name: 'Mantenimiento Programado',
    title: 'Mantenimiento del Sistema',
    message: 'El sistema estará en mantenimiento el {fecha} de {hora_inicio} a {hora_fin}.',
    type: 'warning',
    isActive: true
  },
  {
    id: 'template-2',
    name: 'Nueva Funcionalidad',
    title: 'Nueva Función Disponible',
    message: 'Ya está disponible {nombre_funcion} en la sección {seccion}.',
    type: 'success',
    isActive: true
  },
  {
    id: 'template-3',
    name: 'Actualización de Seguridad',
    title: 'Actualización de Seguridad',
    message: 'Se ha instalado una actualización de seguridad. Se recomienda {accion_recomendada}.',
    type: 'info',
    isActive: false
  }
];

/**
 * 🔔 Página de Gestión de Notificaciones
 * 
 * Sistema de notificaciones del sistema solo para:
 * - Administradores
 */
export function NotificationsPage() {
  const { hasRole } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [templates] = useState<NotificationTemplate[]>(mockTemplates);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>(mockNotifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [activeTab, setActiveTab] = useState('notifications');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🛡️ Verificar permisos de acceso
  const canAccess = hasRole('administrador');

  // 🔍 Aplicar filtros
  useEffect(() => {
    let filtered = [...notifications];

    // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(notif => 
        notif.title.toLowerCase().includes(search) ||
        notif.message.toLowerCase().includes(search) ||
        notif.createdBy.toLowerCase().includes(search)
      );
    }

    // Filtro por estado
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(notif => notif.status === selectedStatus);
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(notif => notif.type === selectedType);
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, selectedStatus, selectedType]);

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
              Solo administradores pueden acceder a la gestión de notificaciones.
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

  // 📤 Funciones para manejar notificaciones
  const handleSendNotification = async (notificationId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, status: 'sent' as const, sentAt: new Date().toISOString() }
          : notif
      ));
      console.log('Notification sent:', notificationId);
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      console.log('Notification deleted:', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 Función para obtener el icono de tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // 🎨 Función para obtener el badge de prioridad
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-700">Crítica</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">Media</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-700">Baja</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  // 🎨 Función para obtener el badge de estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-700">Enviada</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700">Borrador</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700">Programada</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  // 🎨 Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ Mostrar la página de notificaciones
  return (
    <div className="space-y-6">
      {/* 🎯 Header de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Notificaciones</h1>
          <p className="text-muted-foreground">
            Administra y envía notificaciones a los usuarios del sistema
          </p>
        </div>
      </div>

      {/* 📊 Estadísticas de notificaciones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enviadas</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.status === 'sent').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.status === 'draft').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pendientes de envío
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Lectura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.length > 0 
                ? Math.round((notifications.reduce((acc, n) => acc + n.readCount, 0) / 
                   notifications.reduce((acc, n) => acc + n.totalRecipients, 1)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio de lectura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plantillas</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Plantillas activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🔔 Sistema de notificaciones */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="create">Crear Nueva</TabsTrigger>
        </TabsList>

        {/* 📋 Tab Notificaciones */}
        <TabsContent value="notifications" className="space-y-4">
          {/* 🔍 Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtrar Notificaciones</CardTitle>
              <CardDescription>
                Busca y filtra notificaciones por estado y tipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar notificaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="sent">Enviadas</SelectItem>
                    <SelectItem value="draft">Borradores</SelectItem>
                    <SelectItem value="scheduled">Programadas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="info">Información</SelectItem>
                    <SelectItem value="warning">Advertencia</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Éxito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 📋 Lista de notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Notificaciones</CardTitle>
              <CardDescription>
                Gestiona todas las notificaciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || selectedStatus !== 'all' || selectedType !== 'all'
                      ? 'No se encontraron notificaciones que coincidan con los filtros.'
                      : 'No hay notificaciones en el sistema.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          {getTypeIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium truncate">{notification.title}</h4>
                            {getStatusBadge(notification.status)}
                            {getPriorityBadge(notification.priority)}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Creada: {formatDate(notification.createdAt)}</span>
                            {notification.sentAt && (
                              <span>Enviada: {formatDate(notification.sentAt)}</span>
                            )}
                            <span>por {notification.createdBy}</span>
                            {notification.status === 'sent' && (
                              <span>Leída por {notification.readCount}/{notification.totalRecipients}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {notification.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendNotification(notification.id)}
                            disabled={isLoading}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNotification(notification.id)}
                          disabled={isLoading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📝 Tab Plantillas */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Notificaciones</CardTitle>
              <CardDescription>
                Gestiona plantillas reutilizables para notificaciones comunes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div 
                    key={template.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-2 bg-muted rounded-lg">
                        {getTypeIcon(template.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant={template.isActive ? 'default' : 'secondary'}>
                            {template.isActive ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch checked={template.isActive} />
                      <Button variant="outline" size="sm">
                        Usar Plantilla
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ➕ Tab Crear Nueva */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nueva Notificación</CardTitle>
              <CardDescription>
                Crea y programa una nueva notificación para los usuarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="notifTitle">Título</Label>
                  <Input id="notifTitle" placeholder="Título de la notificación" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notifType">Tipo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Información</SelectItem>
                      <SelectItem value="warning">Advertencia</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="success">Éxito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notifMessage">Mensaje</Label>
                <Textarea 
                  id="notifMessage" 
                  placeholder="Escribe el mensaje de la notificación..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="notifPriority">Prioridad</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notifRecipients">Destinatarios</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona los destinatarios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los usuarios</SelectItem>
                      <SelectItem value="admins">Solo administradores</SelectItem>
                      <SelectItem value="workspace">Por workspace</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" disabled={isLoading}>
                  Guardar Borrador
                </Button>
                <Button disabled={isLoading}>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Ahora
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 