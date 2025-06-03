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
      {/* 🚀 Formulario de login */}
      <LoginForm 
        onSuccess={handleLoginSuccess}
        redirectTo="/dashboard"
      />
    </AuthLayout>
  );
}
