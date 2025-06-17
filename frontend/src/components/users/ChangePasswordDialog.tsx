import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Key, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import type { User as UserType } from '@/types/auth';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
}

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
 * 🔑 Dialog para Cambiar Contraseña (Admin)
 * 
 * Permite a administradores cambiar contraseñas de otros usuarios
 * con validación de fortaleza y generación automática de contraseñas
 */
export function ChangePasswordDialog({ open, onOpenChange, user }: ChangePasswordDialogProps) {
  // 🎣 Hooks
  const { changePassword, actionLoading } = useUsers();
  const { user: currentUser } = useAuth();

  // 📝 Estado del formulario
  const [formData, setFormData] = useState({
    currentPassword: '', // La contraseña actual del admin
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

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
      newPassword: shuffled, 
      confirmPassword: shuffled 
    }));
  };

  // ✅ Validación del formulario
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Solo los admins necesitan proporcionar su contraseña actual para confirmar
    if (currentUser?.role === 'administrador' && !formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Confirma tu contraseña actual para autorizar el cambio';
    }

    // Validar nueva contraseña
    if (!formData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else {
      const passwordValidation = validatePasswordStrength(formData.newPassword);
      if (passwordValidation.score < 3) {
        newErrors.newPassword = 'La contraseña debe ser más segura';
      }
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmar la contraseña es requerido';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 📤 Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const success = await changePassword(user.id, {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });

    if (success) {
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
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

  // 🔄 Toggle visibilidad de contraseña
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // 📊 Análisis de contraseña
  const passwordAnalysis = formData.newPassword ? validatePasswordStrength(formData.newPassword) : null;

  // Verificar si estamos cargando para este usuario específico
  const isLoading = actionLoading.update[user.id] || false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border shadow-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Cambiar la contraseña de <strong className="text-foreground">{user.fullName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* ⚠️ Advertencia para administradores */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-800 text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Cambio de Contraseña Administrativo
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-orange-50 space-y-2">
            <p className="text-sm text-orange-700">
              • Estás cambiando la contraseña de otro usuario como administrador
            </p>
            <p className="text-sm text-orange-700">
              • El usuario deberá iniciar sesión con la nueva contraseña
            </p>
            <p className="text-sm text-orange-700">
              • Se recomienda informar al usuario sobre el cambio
            </p>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 🔐 Confirmación del administrador */}
          {currentUser?.role === 'administrador' && (
            <Card className="border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-card-foreground">Autorización de Administrador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 bg-card">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
                    Tu contraseña actual *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      placeholder="Confirma tu contraseña para autorizar"
                      value={formData.currentPassword}
                      onChange={(e) => updateField('currentPassword', e.target.value)}
                      className={`pl-9 pr-9 bg-background border text-foreground placeholder:text-muted-foreground ${errors.currentPassword ? 'border-destructive' : 'border-input'}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive font-medium">{errors.currentPassword}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 🔐 Nueva Contraseña */}
          <Card className="border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between text-card-foreground">
                Nueva Contraseña para {user.fullName}
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
                  <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                    Nueva Contraseña *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={formData.newPassword}
                      onChange={(e) => updateField('newPassword', e.target.value)}
                      className={`pl-9 pr-9 bg-background border text-foreground placeholder:text-muted-foreground ${errors.newPassword ? 'border-destructive' : 'border-input'}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive font-medium">{errors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirmar Nueva Contraseña *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
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
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive font-medium">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Indicador de fortaleza de contraseña */}
              {passwordAnalysis && (
                <div className="space-y-2 p-3 bg-muted-solid rounded-lg border">
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

          <DialogFooter className="pt-4 bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="bg-background border text-foreground hover:bg-accent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 