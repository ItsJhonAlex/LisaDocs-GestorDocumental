import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { PageSpinner } from '@/components/common/LoadingSpinner';
import { AuthContext } from '@/contexts/AuthContext';

// 🎯 Props del AuthProvider
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * 🔐 Proveedor de autenticación
 * 
 * Se encarga de inicializar el estado de autenticación al cargar la aplicación
 * y manejar la verificación de tokens de manera controlada.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Extraer funciones del store de forma estable
  const tokens = useAuthStore((state) => state.tokens);
  const refreshTokens = useAuthStore((state) => state.refreshTokens);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Si hay tokens guardados, intentar refrescarlos
        if (tokens?.refreshToken) {
          console.log('🔄 Intentando refrescar tokens...');
          const success = await refreshTokens();
          
          if (!success) {
            console.log('❌ No se pudieron refrescar los tokens, limpiando sesión');
            await logout();
          } else {
            console.log('✅ Tokens refrescados exitosamente');
          }
        } else {
          console.log('ℹ️ No hay tokens guardados');
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        await logout();
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [tokens?.refreshToken, refreshTokens, logout]);

  // 🔄 Mostrar loading durante la inicialización
  if (!isInitialized) {
    return (
      <PageSpinner text="Inicializando aplicación..." />
    );
  }

  return (
    <AuthContext.Provider value={{ isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}
