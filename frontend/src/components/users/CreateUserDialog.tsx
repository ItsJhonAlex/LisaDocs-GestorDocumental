import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Shield, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole, WorkspaceType } from '@/types/auth';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
 * 🏗️ Validador de fortaleza de contraseña
 */
const validatePasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    checks,
    score,
    strength: score < 3 ? 'Débil' : score < 4 ? 'Media' : 'Fuerte',
    color: score < 3 ? 'bg-red-500' : score < 4 ? 'bg-yellow-500' : 'bg-green-500',
    percentage: (score / 5) * 100
  };
};

/**
 * ➕ Dialog para Crear Usuario
 * 
 * Funcionalidades:
 * - Formulario completo con validación
 * - Verificación de fortaleza de contraseña
 * - Selección de rol y workspace con restricciones
 * - Generación automática de contraseñas seguras
 */
export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  // 🎣 Hooks
  const { createUser, actionLoading } = useUsers();
  const { user: currentUser } = useAuth();

  // 📝 Estado del formulario
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole,
    workspace: '' as WorkspaceType
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🔐 Generar contraseña segura
  const generateSecurePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    
    // Asegurar al menos un carácter de cada tipo
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Completar hasta 12 caracteres
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Mezclar los caracteres
    const shuffled = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData(prev => ({ 
      ...prev, 
      password: shuffled, 
      confirmPassword: shuffled 
    }));
  };

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

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else {
      const passwordValidation = validatePasswordStrength(formData.password);
      if (passwordValidation.score < 3) {
        newErrors.password = 'La contraseña debe ser más segura';
      }
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmar la contraseña es requerido';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
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
      newErrors.role = 'No puede crear usuarios administradores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 📤 Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const success = await createUser({
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
      workspace: formData.workspace
    });

    if (success) {
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '' as UserRole,
        workspace: '' as WorkspaceType
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  // 🔄 Actualizar campo del formulario
  const updateField = (field: string, value: string) => {
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
    return [];
  };

  // 📊 Análisis de contraseña
  const passwordAnalysis = formData.password ? validatePasswordStrength(formData.password) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border shadow-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <User className="h-5 w-5" />
            Crear Nuevo Usuario
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Complete la información para crear un nuevo usuario en el sistema LisaDocs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 👤 Información Personal */}
          <Card className="border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-card-foreground">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Nombre Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Ej: Juan Pérez García"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className={`pl-9 bg-background border text-foreground placeholder:text-muted-foreground ${errors.fullName ? 'border-destructive' : 'border-input'}`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive font-medium">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@example.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={`pl-9 bg-background border text-foreground placeholder:text-muted-foreground ${errors.email ? 'border-destructive' : 'border-input'}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive font-medium">{errors.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 🔐 Configuración de Contraseña */}
          <Card className="border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between text-card-foreground">
                Configuración de Contraseña
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateSecurePassword}
                  className="bg-background border text-foreground hover:bg-accent"
                >
                  Generar Segura
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className={`pl-9 pr-9 bg-background border text-foreground placeholder:text-muted-foreground ${errors.password ? 'border-destructive' : 'border-input'}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive font-medium">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirmar Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repetir contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      className={`pl-9 pr-9 bg-background border text-foreground placeholder:text-muted-foreground ${errors.confirmPassword ? 'border-destructive' : 'border-input'}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive font-medium">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Indicador de fortaleza de contraseña */}
              {passwordAnalysis && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Fortaleza de la contraseña</span>
                    <Badge variant={passwordAnalysis.score >= 4 ? 'default' : passwordAnalysis.score >= 3 ? 'secondary' : 'destructive'}>
                      {passwordAnalysis.strength}
                    </Badge>
                  </div>
                  <Progress value={passwordAnalysis.percentage} className="h-2" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className={passwordAnalysis.checks.length ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      ✓ Mínimo 8 caracteres
                    </span>
                    <span className={passwordAnalysis.checks.uppercase ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      ✓ Mayúsculas
                    </span>
                    <span className={passwordAnalysis.checks.lowercase ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      ✓ Minúsculas
                    </span>
                    <span className={passwordAnalysis.checks.numbers ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      ✓ Números
                    </span>
                    <span className={passwordAnalysis.checks.symbols ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      ✓ Símbolos
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 🛡️ Permisos y Acceso */}
          <Card className="border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-card-foreground">Permisos y Acceso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-foreground">Rol del Usuario *</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Select
                      value={formData.role}
                      onValueChange={(value) => updateField('role', value)}
                    >
                      <SelectTrigger className={`pl-9 bg-background border text-foreground ${errors.role ? 'border-destructive' : 'border-input'}`}>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-lg">
                        {getAvailableRoles().map((role) => (
                          <SelectItem key={role.value} value={role.value} className="bg-popover hover:bg-accent text-popover-foreground">
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-muted-foreground">{role.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.role && (
                    <p className="text-sm text-destructive font-medium">{errors.role}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workspace" className="text-sm font-medium text-foreground">Workspace Principal *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Select
                      value={formData.workspace}
                      onValueChange={(value) => updateField('workspace', value)}
                    >
                      <SelectTrigger className={`pl-9 bg-background border text-foreground ${errors.workspace ? 'border-destructive' : 'border-input'}`}>
                        <SelectValue placeholder="Seleccionar workspace" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-lg">
                        {WORKSPACE_OPTIONS.map((workspace) => (
                          <SelectItem key={workspace.value} value={workspace.value} className="bg-popover hover:bg-accent text-popover-foreground">
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
                    <p className="text-sm text-destructive font-medium">{errors.workspace}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="pt-4 bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={actionLoading.create}
              className="bg-background border text-foreground hover:bg-accent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={actionLoading.create}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {actionLoading.create ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 