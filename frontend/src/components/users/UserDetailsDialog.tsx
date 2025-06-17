import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Calendar, 
  Clock, 
  Activity,
  X,
  Edit3,
  Key,
  UserCheck,
  UserX
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUsers } from '@/hooks/useUsers';
import { userService } from '@/services/userService';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import type { User as UserType } from '@/types/auth';

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
}

// 🎨 Configuración de roles y workspaces para display
const ROLE_DISPLAY = {
  administrador: { label: 'Administrador', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  presidente: { label: 'Presidente', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  vicepresidente: { label: 'Vicepresidente', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  secretario_cam: { label: 'Secretario CAM', color: 'bg-green-100 text-green-800 border-green-200' },
  secretario_ampp: { label: 'Secretario AMPP', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  secretario_cf: { label: 'Secretario CF', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  intendente: { label: 'Intendente', color: 'bg-red-100 text-red-800 border-red-200' },
  cf_member: { label: 'Miembro CF', color: 'bg-gray-100 text-gray-800 border-gray-200' }
};

const WORKSPACE_DISPLAY = {
  presidencia: { label: 'Presidencia', description: 'Presidencia del Consejo' },
  intendencia: { label: 'Intendencia', description: 'Intendencia Regional' },
  cam: { label: 'Cámara de Comercio', description: 'CAM' },
  ampp: { label: 'Asociación de Municipios', description: 'AMPP' },
  comisiones_cf: { label: 'Comisiones de Fiscalización', description: 'CF1-CF8' }
};

// 🏷️ Tipo para actividad de usuario
interface UserActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * 👁️ Dialog de Detalles de Usuario
 * 
 * Muestra información completa del usuario:
 * - Información personal y de contacto
 * - Configuración de rol y permisos
 * - Historial de actividad
 * - Estadísticas de uso
 * - Acciones disponibles según permisos
 */
export function UserDetailsDialog({ open, onOpenChange, user }: UserDetailsDialogProps) {
  // 🎣 Hooks
  const { canEditUser, canChangePassword } = useUsers();

  // 📊 Estado local
  const [activeTab, setActiveTab] = useState('overview');
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);

  // 🔄 Cargar datos adicionales
  const loadUserActivity = React.useCallback(async () => {
    setLoadingActivity(true);
    try {
      const activity = await userService.getUserActivity(user.id, 10);
      setUserActivity(activity || []);
    } catch (error) {
      console.error('Error loading user activity:', error);
      setUserActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  }, [user.id]);

  const loadUserPermissions = React.useCallback(async () => {
    setLoadingPermissions(true);
    try {
      const permissions = await userService.getUserPermissions(user.id);
      setUserPermissions(permissions || []);
    } catch (error) {
      console.error('Error loading user permissions:', error);
      setUserPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (open && user.id) {
      loadUserActivity();
      loadUserPermissions();
    }
  }, [open, user.id, loadUserActivity, loadUserPermissions]);

  // 🎨 Obtener iniciales para avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // 📅 Formatear fecha
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 📅 Obtener tiempo relativo
  const getRelativeTime = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Hace menos de una hora';
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `Hace ${diffInMonths} mes${diffInMonths !== 1 ? 'es' : ''}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border shadow-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-foreground font-semibold">{user.fullName}</div>
              <div className="text-sm text-muted-foreground font-normal">{user.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Resumen</TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Permisos</TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Actividad</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Configuración</TabsTrigger>
          </TabsList>

          {/* 📊 Tab Resumen */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información Personal */}
              <Card className="border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <User className="h-5 w-5" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 bg-card">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                      <p className="text-sm text-foreground font-medium">{user.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm text-foreground font-medium">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Estado</label>
                      <div className="flex items-center gap-2 mt-1">
                        {user.isActive ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <UserX className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={user.isActive ? 'default' : 'secondary'} className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rol y Workspace */}
              <Card className="border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Shield className="h-5 w-5" />
                    Rol y Workspace
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 bg-card">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Rol</label>
                      <div className="mt-1">
                        <Badge variant="outline" className={ROLE_DISPLAY[user.role]?.color}>
                          {ROLE_DISPLAY[user.role]?.label || user.role}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Workspace Principal</label>
                      <div className="mt-1">
                        <Badge variant="secondary" className="bg-secondary/80 text-secondary-foreground">
                          {WORKSPACE_DISPLAY[user.workspace]?.label || user.workspace}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {WORKSPACE_DISPLAY[user.workspace]?.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información del Sistema */}
              <Card className="border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Calendar className="h-5 w-5" />
                    Información del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 bg-card">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha de Registro</label>
                      <p className="text-sm text-foreground font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Última Actualización</label>
                      <p className="text-sm text-foreground font-medium">{formatDate(user.updatedAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Último Acceso</label>
                      <p className="text-sm text-foreground font-medium">
                        {user.lastLoginAt ? (
                          <>
                            {formatDate(user.lastLoginAt)}
                            <span className="text-muted-foreground ml-2">
                              ({getRelativeTime(user.lastLoginAt)})
                            </span>
                          </>
                        ) : (
                          'Nunca'
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas Rápidas */}
              <Card className="border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Activity className="h-5 w-5" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-card">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold text-primary">--</div>
                      <div className="text-xs text-muted-foreground">Documentos</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold text-green-600">--</div>
                      <div className="text-xs text-muted-foreground">Sesiones</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 🛡️ Tab Permisos */}
          <TabsContent value="permissions" className="space-y-4">
            <Card className="border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Permisos del Usuario</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Permisos asignados según el rol y configuración del usuario
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-card">
                {loadingPermissions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Cargando permisos...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPermissions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {userPermissions.map((permission, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded bg-muted/30">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="text-sm text-foreground">{permission}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No se encontraron permisos específicos</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 📈 Tab Actividad */}
          <TabsContent value="activity" className="space-y-4">
            <Card className="border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Historial de Actividad</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Últimas acciones realizadas por el usuario
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-card">
                {loadingActivity ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Cargando actividad...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userActivity.length > 0 ? (
                      userActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                          <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No hay actividad reciente registrada</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ⚙️ Tab Configuración */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Configuración de Cuenta</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Configuraciones y preferencias del usuario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 bg-card">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div>
                      <div className="font-medium text-foreground">Email verificado</div>
                      <div className="text-sm text-muted-foreground">
                        Estado de verificación del email
                      </div>
                    </div>
                    <Badge variant={user.emailVerified ? 'default' : 'secondary'} className={user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {user.emailVerified ? 'Verificado' : 'Pendiente'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div>
                      <div className="font-medium text-foreground">Autenticación 2FA</div>
                      <div className="text-sm text-muted-foreground">
                        Factor de autenticación adicional
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">Deshabilitado</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div>
                      <div className="font-medium text-foreground">Notificaciones</div>
                      <div className="text-sm text-muted-foreground">
                        Recibir notificaciones del sistema
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Habilitado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 pt-4 bg-background">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-background border text-foreground hover:bg-accent"
          >
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
          
          {canEditUser(user) && (
            <Button
              onClick={() => {
                onOpenChange(false);
                // Aquí podrías abrir el dialog de edición
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar Usuario
            </Button>
          )}
          
          {canChangePassword(user) && (
            <Button 
              variant="outline"
              onClick={() => setShowChangePasswordDialog(true)}
              className="bg-background border text-foreground hover:bg-accent"
            >
              <Key className="h-4 w-4 mr-2" />
              Cambiar Contraseña
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* 🔑 Dialog de cambio de contraseña */}
      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
        user={user}
      />
    </Dialog>
  );
} 