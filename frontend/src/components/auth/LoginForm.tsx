import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <LogIn className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold">¡Bienvenido a LisaDocs! 👋</CardTitle>
          <CardDescription>
            Inicia sesión para acceder al sistema de gestión documental
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 📧 Campo Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="pl-10"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* 🔒 Campo Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* 🚨 Error general */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 🚀 Botón de envío */}
          <Button
            type="submit"
            className="w-full"
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
        <div className="text-center text-sm text-muted-foreground">
          <p>
            ¿Olvidaste tu contraseña?{' '}
            <button className="text-primary hover:underline font-medium">
              Recuperar cuenta
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
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
