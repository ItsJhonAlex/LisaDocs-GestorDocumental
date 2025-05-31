import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/Layout';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // 🔄 Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 🎉 Manejar login exitoso
  const handleLoginSuccess = () => {
    // El hook useAuth ya maneja la navegación automática
    console.log('Login exitoso! 🎉');
  };

  if (isAuthenticated) {
    return null; // Evitar parpadeo durante la redirección
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* 🚀 Formulario de login */}
        <LoginForm 
          onSuccess={handleLoginSuccess}
          redirectTo="/dashboard"
        />

        {/* 🎨 Enlaces adicionales */}
        <div className="text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>
              ¿Necesitas acceso al sistema?{' '}
              <button className="text-primary hover:underline font-medium">
                Contacta al administrador
              </button>
            </p>
          </div>
          
          {/* 🏢 Información del sistema */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <p className="font-medium mb-2">Sistema de Gestión Documental</p>
            <div className="space-y-1">
              <p>• Presidencia Municipal</p>
              <p>• Intendencia</p>
              <p>• CAM & AMPP</p>
              <p>• Comisiones CF</p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
