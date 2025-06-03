import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Mail, Lock, Crown, Building, Briefcase, Scale } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

// 🎯 Schema de validación con Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// 🎨 Props del componente
interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
}

export function LoginForm({ onSuccess, redirectTo, className }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();

  // 📝 Configuración del formulario con react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  // 🚀 Manejar envío del formulario
  const onSubmit = async (data: LoginFormData) => {
    clearError(); // Limpiar errores previos
    
    const result = await login(data.email, data.password, redirectTo);
    
    if (result.success) {
      onSuccess?.();
    } else {
      // Manejar errores específicos
      if (result.error?.includes('email')) {
        setError('email', { message: result.error });
      } else if (result.error?.includes('contraseña') || result.error?.includes('password')) {
        setError('password', { message: result.error });
      }
      // El error general se muestra desde el store
    }
  };

  return (
    <div className={`w-full p-6 ${className}`}>
      {/* 🎉 Header elegante */}
      <div className="text-center space-y-4 mb-8">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">¡Bienvenido de vuelta! 👋</h1>
          <p className="text-muted-foreground">
            Accede a LisaDocs para gestionar tus documentos
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 📧 Campo Email */}
          <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Correo Electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
              className="pl-10 h-12 bg-background border-border focus:border-primary"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
            </div>
            {errors.email && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <span className="w-1 h-1 bg-destructive rounded-full"></span>
              {errors.email.message}
            </p>
            )}
          </div>

          {/* 🔒 Campo Contraseña */}
          <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
              className="pl-10 pr-12 h-12 bg-background border-border focus:border-primary"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <span className="w-1 h-1 bg-destructive rounded-full"></span>
              {errors.password.message}
            </p>
            )}
          </div>

          {/* 🚨 Error general */}
          {error && (
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-destructive rounded-full"></div>
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
            </div>
          )}

          {/* 🚀 Botón de envío */}
          <Button
            type="submit"
          className="w-full h-12 text-base font-medium"
            disabled={isLoading || !isValid}
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </>
            )}
          </Button>
        </form>

        {/* 🔗 Enlaces adicionales */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="text-center space-y-4">
          <div className="text-sm text-muted-foreground">
          <p>
            ¿Olvidaste tu contraseña?{' '}
              <button className="text-primary hover:underline font-medium transition-colors">
              Recuperar cuenta
            </button>
          </p>
        </div>
          
          {/* 🏢 Información del sistema */}
          <div className="pt-4 text-xs text-muted-foreground">
            <p className="font-medium mb-3 text-foreground">Módulos del Sistema:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                <Crown className="w-3 h-3 text-primary" />
                <span>Presidencia</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                <Building className="w-3 h-3 text-primary" />
                <span>Intendencia</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                <Briefcase className="w-3 h-3 text-primary" />
                <span>CAM & AMPP</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                <Scale className="w-3 h-3 text-primary" />
                <span>Comisiones CF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎯 Variante compacta para usar en modales
export function CompactLoginForm({ onSuccess, className }: Omit<LoginFormProps, 'redirectTo'>) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Iniciar Sesión</h3>
        <p className="text-sm text-muted-foreground">
          Accede a tu cuenta de LisaDocs
        </p>
      </div>
      
      <LoginForm onSuccess={onSuccess} className="border-0 shadow-none p-0" />
    </div>
  );
}
