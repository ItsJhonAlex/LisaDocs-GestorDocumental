import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/environment';
import { JWTPayload, TokenConfig } from '../types/auth';

// 🔐 Configuración de tokens
const tokenConfig: TokenConfig = {
  accessTokenSecret: config.jwt.secret,
  refreshTokenSecret: config.jwt.secret + '_refresh', // Secreto diferente para refresh
  accessTokenExpiresIn: config.jwt.expiresIn,
  refreshTokenExpiresIn: config.jwt.refreshExpiresIn
};

/**
 * 🔑 Generar token de acceso
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    const signOptions: SignOptions = {
      expiresIn: tokenConfig.accessTokenExpiresIn as any,
      issuer: 'lisadocs-api',
      audience: 'lisadocs-client'
    };

    return jwt.sign(
      payload as Record<string, any>,
      tokenConfig.accessTokenSecret, 
      signOptions
    );
  } catch (error) {
    throw new Error(`Error generando access token: ${error}`);
  }
}

/**
 * 🔄 Generar refresh token
 */
export function generateRefreshToken(payload: Pick<JWTPayload, 'userId' | 'email'>): string {
  try {
    const signOptions: SignOptions = {
      expiresIn: tokenConfig.refreshTokenExpiresIn as any,
      issuer: 'lisadocs-api',
      audience: 'lisadocs-client'
    };

    return jwt.sign(
      payload as Record<string, any>,
      tokenConfig.refreshTokenSecret, 
      signOptions
    );
  } catch (error) {
    throw new Error(`Error generando refresh token: ${error}`);
  }
}

/**
 * ✅ Verificar access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, tokenConfig.accessTokenSecret, {
      issuer: 'lisadocs-api',
      audience: 'lisadocs-client'
    }) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    }
    throw new Error(`Error verificando token: ${error}`);
  }
}

/**
 * 🔄 Verificar refresh token
 */
export function verifyRefreshToken(token: string): Pick<JWTPayload, 'userId' | 'email'> {
  try {
    return jwt.verify(token, tokenConfig.refreshTokenSecret, {
      issuer: 'lisadocs-api',
      audience: 'lisadocs-client'
    }) as Pick<JWTPayload, 'userId' | 'email'>;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Refresh token inválido');
    }
    throw new Error(`Error verificando refresh token: ${error}`);
  }
}

/**
 * 🕒 Obtener tiempo de expiración de un token
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * ⏱️ Verificar si un token está expirado
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration.getTime() <= Date.now();
}

/**
 * 📜 Decodificar token sin verificar (para debug/logs)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * 🎯 Extraer token del header Authorization
 */
export function extractTokenFromHeader(authorization?: string): string | null {
  if (!authorization) return null;
  
  const [type, token] = authorization.split(' ');
  
  if (type !== 'Bearer' || !token) {
    return null;
  }
  
  return token;
}

/**
 * 🔄 Generar par de tokens (access + refresh)
 */
export function generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({
    userId: payload.userId,
    email: payload.email
  });
  
  return {
    accessToken,
    refreshToken,
    expiresIn: tokenConfig.accessTokenExpiresIn
  };
}

/**
 * 🔒 Invalidar token (para logout - usando blacklist en memoria)
 * En producción se debería usar Redis u otra base de datos
 */
const tokenBlacklist = new Set<string>();

export function blacklistToken(token: string): void {
  tokenBlacklist.add(token);
  
  // Limpiar tokens expirados cada hora (en memoria)
  if (tokenBlacklist.size > 1000) {
    cleanupBlacklist();
  }
}

export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

function cleanupBlacklist(): void {
  const now = Date.now();
  
  for (const token of tokenBlacklist) {
    if (isTokenExpired(token)) {
      tokenBlacklist.delete(token);
    }
  }
}

/**
 * 📊 Obtener estadísticas de tokens
 */
export function getTokenStats() {
  return {
    blacklistedTokens: tokenBlacklist.size,
    accessTokenExpiresIn: tokenConfig.accessTokenExpiresIn,
    refreshTokenExpiresIn: tokenConfig.refreshTokenExpiresIn
  };
}
