import { z } from 'zod';
import { UserRole, WorkspaceType } from '../generated/prisma';

// 🔑 Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'Email es requerido')
    .max(255, 'Email muy largo')
    .transform(val => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password es requerido')
    .max(128, 'Password muy largo')
});

// 👤 Schema para registro de usuario
export const registerSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'Email es requerido')
    .max(255, 'Email muy largo')
    .transform(val => val.toLowerCase().trim()),
  fullName: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(255, 'Nombre muy largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Nombre solo debe contener letras y espacios')
    .transform(val => val.trim()),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Rol inválido' })
  }),
  workspace: z.nativeEnum(WorkspaceType, {
    errorMap: () => ({ message: 'Workspace inválido' })
  }),
  password: z
    .string()
    .min(8, 'Password debe tener al menos 8 caracteres')
    .max(128, 'Password muy largo')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/, 
      'Password debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 símbolo')
});

// 🔄 Schema para refresh token
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token es requerido')
});

// 🔓 Schema para logout
export const logoutSchema = z.object({
  token: z.string().optional(),
  refreshToken: z.string().optional(),
  logoutAll: z.boolean().default(false)
}).refine(
  (data) => data.token || data.refreshToken,
  {
    message: 'Se requiere al menos un token (access o refresh)',
    path: ['token']
  }
);

// 🔄 Schema para cambio de password
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Password actual es requerido'),
  newPassword: z
    .string()
    .min(8, 'Nuevo password debe tener al menos 8 caracteres')
    .max(128, 'Password muy largo')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/, 
      'Password debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 símbolo'),
  confirmPassword: z.string()
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'El nuevo password debe ser diferente al actual',
    path: ['newPassword']
  }
);

// 📧 Schema para reset de password (futuro)
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'Email es requerido')
    .transform(val => val.toLowerCase().trim())
});

// 🔐 Schema para completar reset de password
export const passwordResetCompleteSchema = z.object({
  token: z
    .string()
    .min(1, 'Token de reset es requerido'),
  newPassword: z
    .string()
    .min(8, 'Password debe tener al menos 8 caracteres')
    .max(128, 'Password muy largo')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/, 
      'Password debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 símbolo'),
  confirmPassword: z.string()
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  }
);

// 👤 Schema para actualizar perfil
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(255, 'Nombre muy largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Nombre solo debe contener letras y espacios')
    .transform(val => val.trim())
    .optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark']).optional(),
      language: z.enum(['es', 'en']).optional(),
      notifications: z
        .object({
          email: z.boolean().optional(),
          browser: z.boolean().optional(),
          mobile: z.boolean().optional()
        })
        .optional(),
      dashboard: z
        .object({
          defaultView: z.enum(['my_documents', 'all_workspaces', 'my_workspace']).optional(),
          itemsPerPage: z.number().min(10).max(100).optional(),
          showThumbnails: z.boolean().optional()
        })
        .optional()
    })
    .optional()
});

// 🔐 Schema para validación de permissions
export const permissionCheckSchema = z.object({
  action: z.enum(['view', 'download', 'upload', 'archive', 'manage', 'delete']),
  workspace: z.nativeEnum(WorkspaceType).optional(),
  resourceId: z.string().uuid().optional(),
  resourceOwnerId: z.string().uuid().optional()
});

// 📋 Schema para paginación
export const paginationSchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val > 0, 'Página debe ser un número mayor a 0')
    .default('1'),
  limit: z
    .string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val > 0 && val <= 100, 'Límite debe ser entre 1 y 100')
    .default('20'),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'fullName', 'email', 'role']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// 🎯 Schema para filtros de usuarios (admin)
export const userFiltersSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  workspace: z.nativeEnum(WorkspaceType).optional(),
  isActive: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  search: z.string().optional()
});

// 🔍 Schema para búsqueda general
export const searchSchema = z.object({
  q: z
    .string()
    .min(2, 'Búsqueda debe tener al menos 2 caracteres')
    .max(100, 'Búsqueda muy larga'),
  type: z.enum(['users', 'documents', 'all']).default('all'),
  workspace: z.nativeEnum(WorkspaceType).optional()
});

// ⚙️ Schema para configuración de usuario
export const userConfigSchema = z.object({
  twoFactorEnabled: z.boolean().optional(),
  sessionTimeout: z.number().min(300).max(86400).optional(), // 5 min a 24 horas
  emailNotifications: z.boolean().optional(),
  securityAlerts: z.boolean().optional()
});

// 📊 Schema para obtener estadísticas (admin)
export const statsFiltersSchema = z.object({
  startDate: z
    .string()
    .datetime('Fecha de inicio inválida')
    .optional(),
  endDate: z
    .string()
    .datetime('Fecha de fin inválida')
    .optional(),
  workspace: z.nativeEnum(WorkspaceType).optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day')
});

// 🎯 Tipos TypeScript inferidos de los schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PermissionCheckInput = z.infer<typeof permissionCheckSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UserFiltersInput = z.infer<typeof userFiltersSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type UserConfigInput = z.infer<typeof userConfigSchema>;
export type StatsFiltersInput = z.infer<typeof statsFiltersSchema>;

// 🛡️ Validation helper function
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        )
      };
    }
    return {
      success: false,
      errors: ['Error de validación desconocido']
    };
  }
}
