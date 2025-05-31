import { createContext } from 'react';

// 🎯 Tipo del contexto de autenticación
export interface AuthContextType {
  isInitialized: boolean;
}

// 🔐 Contexto de autenticación
export const AuthContext = createContext<AuthContextType>({
  isInitialized: false,
}); 