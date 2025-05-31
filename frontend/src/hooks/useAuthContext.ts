import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

/**
 * 🎯 Hook para usar el contexto de autenticación
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }
  
  return context;
} 