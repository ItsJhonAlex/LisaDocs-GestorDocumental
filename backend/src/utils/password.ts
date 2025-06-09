import bcrypt from 'bcryptjs';
import { config } from '../config/environment';

/**
 * 🔐 Hashear password usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(`Error hasheando password: ${error}`);
  }
}

/**
 * ✅ Verificar password contra hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error(`Error verificando password: ${error}`);
  }
}

/**
 * 🔍 Validar fortaleza de password
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number; // 0-100
} {
  const errors: string[] = [];
  let score = 0;

  // Longitud mínima
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  } else {
    score += 20;
  }

  // Longitud ideal
  if (password.length >= 12) {
    score += 10;
  }

  // Contiene mayúsculas
  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    errors.push('Debe contener al menos una letra mayúscula');
  }

  // Contiene minúsculas
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    errors.push('Debe contener al menos una letra minúscula');
  }

  // Contiene números
  if (/\d/.test(password)) {
    score += 15;
  } else {
    errors.push('Debe contener al menos un número');
  }

  // Contiene caracteres especiales
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  } else {
    errors.push('Debe contener al menos un carácter especial (!@#$%^&*...)');
  }

  // No contiene secuencias obvias
  const commonSequences = [
    '123456', 'abcdef', 'qwerty', 'password', 'admin', 'letmein'
  ];
  
  const lowerPassword = password.toLowerCase();
  if (commonSequences.some(seq => lowerPassword.includes(seq))) {
    errors.push('No debe contener secuencias comunes o palabras obvias');
    score -= 20;
  } else {
    score += 10;
  }

  // Asegurar que el score esté entre 0 y 100
  score = Math.max(0, Math.min(100, score));

  return {
    isValid: errors.length === 0 && score >= 70,
    errors,
    score
  };
}

/**
 * 🎲 Generar password aleatorio seguro
 */
export function generateSecurePassword(length: number = 12): string {
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
  
  // Completar el resto del password
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * 📊 Obtener métricas de seguridad de password
 */
export function getPasswordMetrics(password: string) {
  const validation = validatePasswordStrength(password);
  
  return {
    length: password.length,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSymbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    strengthScore: validation.score,
    strengthLevel: getStrengthLevel(validation.score),
    isSecure: validation.isValid,
    recommendations: validation.errors
  };
}

/**
 * 📈 Obtener nivel de fortaleza textual
 */
function getStrengthLevel(score: number): string {
  if (score >= 90) return 'Muy fuerte';
  if (score >= 70) return 'Fuerte';
  if (score >= 50) return 'Moderada';
  if (score >= 30) return 'Débil';
  return 'Muy débil';
}

/**
 * 🔒 Verificar si un password necesita ser actualizado
 * (por ejemplo, si es muy antiguo o usa un hash débil)
 */
export function shouldUpdatePassword(
  hash: string, 
  lastUpdated: Date, 
  maxAgeDays: number = 90
): boolean {
  // Verificar edad del password
  const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceUpdate > maxAgeDays) {
    return true;
  }
  
  // Verificar si usa un hash débil (menos de 10 rounds)
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds < 10;
  } catch {
    // Si no puede leer los rounds, probablemente es un hash inválido
    return true;
  }
}

/**
 * 🎯 Validaciones específicas para el sistema LisaDocs
 */
export function validateLisaDocsPassword(password: string, userData?: {
  email?: string;
  fullName?: string;
}): {
  isValid: boolean;
  errors: string[];
} {
  const baseValidation = validatePasswordStrength(password);
  const errors = [...baseValidation.errors];
  
  // No debe contener información personal
  if (userData) {
    const lowerPassword = password.toLowerCase();
    
    if (userData.email) {
      const emailPart = userData.email.split('@')[0].toLowerCase();
      if (lowerPassword.includes(emailPart)) {
        errors.push('La contraseña no debe contener tu email');
      }
    }
    
    if (userData.fullName) {
      const nameParts = userData.fullName.toLowerCase().split(' ');
      if (nameParts.some(part => part.length > 2 && lowerPassword.includes(part))) {
        errors.push('La contraseña no debe contener tu nombre');
      }
    }
  }
  
  // No debe contener "lisadocs", "admin", etc.
  const forbiddenTerms = ['lisadocs', 'documento', 'gobierno'];
  const lowerPassword = password.toLowerCase();
  
  if (forbiddenTerms.some(term => lowerPassword.includes(term))) {
    errors.push('La contraseña no debe contener términos relacionados al sistema');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
