import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Building, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import type { User as UserType, UserRole, WorkspaceType } from '@/types/auth';
import type { UpdateUserData } from '@/services/userService';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
}

// 🎨 Configuración de roles y workspaces
const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'administrador', label: 'Administrador', description: 'Acceso total al sistema' },
  { value: 'presidente', label: 'Presidente', description: 'Gestión ejecutiva principal' },
  { value: 'vicepresidente', label: 'Vicepresidente', description: 'Gestión ejecutiva secundaria' },
  { value: 'secretario_cam', label: 'Secretario CAM', description: 'Cámara de Comercio' },
  { value: 'secretario_ampp', label: 'Secretario AMPP', description: 'Asociación de Municipios' },
  { value: 'secretario_cf', label: 'Secretario CF', description: 'Comisiones de Fiscalización' },
  { value: 'intendente', label: 'Intendente', description: 'Gestión territorial' },
  { value: 'cf_member', label: 'Miembro CF', description: 'Miembro de comisiones' }
];

const WORKSPACE_OPTIONS: { value: WorkspaceType; label: string; description: string }[] = [
  { value: 'presidencia', label: 'Presidencia', description: 'Presidencia del Consejo' },
  { value: 'intendencia', label: 'Intendencia', description: 'Intendencia Regional' },
  { value: 'cam', label: 'Cámara de Comercio', description: 'CAM' },
  { value: 'ampp', label: 'Asociación de Municipios', description: 'AMPP' },
  { value: 'comisiones_cf', label: 'Comisiones de Fiscalización', description: 'CF1-CF8' }
];

/**
 * ✏️ Dialog para Editar Usuario
 * 
 * Funcionalidades:
 * - Edición de información personal
 * - Cambio de rol y workspace con validaciones
 * - Activar/Desactivar usuario
 * - Control de permisos según rol del usuario actual
 */
export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  // 🎣 Hooks
  const { updateUser, actionLoading, canEditUser } = useUsers();
  const { user: currentUser } = useAuth();

  // 📝 Estado del formulario
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    workspace: user.workspace,
    isActive: user.isActive
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // 🔄 Actualizar formulario cuando cambie el usuario
  useEffect(() => {
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      workspace: user.workspace,
      isActive: user.isActive
    });
    setErrors({});
    setHasChanges(false);
  }, [user]);

  // 🔄 Detectar cambios en el formulario
  useEffect(() => {
    const originalData = {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      workspace: user.workspace,
      isActive: user.isActive
    };

    const currentData = formData;
    const changed = JSON.stringify(originalData) !== JSON.stringify(currentData);
    setHasChanges(changed);
  }, [formData, user]);

  // ✅ Validación del formulario
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar nombre completo
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido';
    }

    // Validar rol
    if (!formData.role) {
      newErrors.role = 'Debe seleccionar un rol';
    }

    // Validar workspace
    if (!formData.workspace) {
      newErrors.workspace = 'Debe seleccionar un workspace';
    }

    // Validar permisos según el usuario actual
    if (currentUser?.role === 'presidente' && formData.role === 'administrador') {
      newErrors.role = 'No puede asignar el rol de administrador';
    }

    // No puede desactivarse a sí mismo si es admin
    if (currentUser?.id === user.id && currentUser?.role === 'administrador' && !formData.isActive) {
      newErrors.isActive = 'No puede desactivar su propia cuenta de administrador';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 📤 Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !hasChanges) return;

    // Preparar datos para actualizar (solo los campos que cambiaron)
    const updateData: UpdateUserData = {};
    if (formData.fullName !== user.fullName) updateData.fullName = formData.fullName.trim();
    if (formData.email !== user.email) updateData.email = formData.email.trim().toLowerCase();
    if (formData.role !== user.role) updateData.role = formData.role;
    if (formData.workspace !== user.workspace) updateData.workspace = formData.workspace;
    if (formData.isActive !== user.isActive) updateData.isActive = formData.isActive;

    const success = await updateUser(user.id, updateData);

    if (success) {
      onOpenChange(false);
    }
  };

  // 🔄 Actualizar campo del formulario
  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 🎨 Obtener opciones de rol filtradas según permisos
  const getAvailableRoles = () => {
    if (currentUser?.role === 'administrador') {
      return ROLE_OPTIONS;
    } else if (currentUser?.role === 'presidente') {
      return ROLE_OPTIONS.filter(role => role.value !== 'administrador');
    }
    return ROLE_OPTIONS.filter(role => role.value === user.role); // Solo su propio rol
  };

  // 🛡️ Verificar si puede editar este campo
  const canEdit = canEditUser(user);
  const canChangeRole = currentUser?.role === 'administrador' || 
                       (currentUser?.role === 'presidente' && user.role !== 'administrador');
  const canChangeStatus = currentUser?.role === 'administrador' || 
                         (currentUser?.role === 'presidente' && user.role !== 'administrador');

  // Obtener estado de loading para este usuario específico
  const isLoading = actionLoading.update[user.id] || false;

  if (!canEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Sin Permisos de Edición
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              No tienes permisos para editar este usuario.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Usuario
          </DialogTitle>
          <DialogDescription>
            Modifica la información del usuario {user.fullName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 👤 Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Ej: Juan Pérez García"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className={`pl-9 ${errors.fullName ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@example.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={`pl-9 ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 🛡️ Permisos y Acceso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permisos y Acceso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rol del Usuario *</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Select
                      value={formData.role}
                      onValueChange={(value) => updateField('role', value)}
                      disabled={!canChangeRole}
                    >
                      <SelectTrigger className={`pl-9 ${errors.role ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRoles().map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-muted-foreground">{role.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!canChangeRole && (
                    <p className="text-xs text-muted-foreground">
                      No tienes permisos para cambiar el rol de este usuario
                    </p>
                  )}
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workspace">Workspace Principal *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Select
                      value={formData.workspace}
                      onValueChange={(value) => updateField('workspace', value)}
                    >
                      <SelectTrigger className={`pl-9 ${errors.workspace ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Seleccionar workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKSPACE_OPTIONS.map((workspace) => (
                          <SelectItem key={workspace.value} value={workspace.value}>
                            <div>
                              <div className="font-medium">{workspace.label}</div>
                              <div className="text-xs text-muted-foreground">{workspace.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.workspace && (
                    <p className="text-sm text-destructive">{errors.workspace}</p>
                  )}
                </div>
              </div>

              {/* Estado del usuario */}
              <div className="space-y-3">
                <Label>Estado del Usuario</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Cuenta Activa</span>
                      <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                        {formData.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formData.isActive 
                        ? 'El usuario puede acceder al sistema' 
                        : 'El usuario no puede acceder al sistema'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => updateField('isActive', checked)}
                    disabled={!canChangeStatus}
                  />
                </div>
                {!canChangeStatus && (
                  <p className="text-xs text-muted-foreground">
                    No tienes permisos para cambiar el estado de este usuario
                  </p>
                )}
                {errors.isActive && (
                  <p className="text-sm text-destructive">{errors.isActive}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 📊 Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Creado:</span>
                  <p className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Último acceso:</span>
                  <p className="text-muted-foreground">
                    {user.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Nunca'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 