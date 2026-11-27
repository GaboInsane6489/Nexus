import { z } from 'zod';

export const appRoleSchema = z.enum(['super_admin', 'coordinator', 'instructor', 'student']);

export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico institucional o personal válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, 'El nombre completo debe contener al menos 3 caracteres.')
    .max(100, 'El nombre completo no puede exceder 100 caracteres.'),
  email: z.string().email('Ingresa un correo electrónico válido.'),
  documentId: z
    .string()
    .min(5, 'El documento de identidad / matrícula debe tener al menos 5 caracteres.')
    .max(25, 'Documento demasiado extenso.'),
  timezone: z.string().min(3, 'Selecciona una zona horaria válida.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres.')
    .max(100, 'Máximo 100 caracteres.'),
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener mínimo 3 caracteres.')
    .max(32, 'Máximo 32 caracteres.')
    .regex(/^[a-z0-9_]+$/, 'Usa solo minúsculas, números y guiones bajos.'),
  documentId: z
    .string()
    .min(5, 'El documento de identidad es obligatorio para emitir certificados verificables.')
    .max(25),
  bio: z.string().max(240, 'La biografía profesional no debe superar 240 caracteres.').optional(),
  timezone: z.string().min(3),
});

export const assignUserRoleSchema = z.object({
  targetUserId: z.string().min(1, 'ID de usuario requerido.'),
  newRole: appRoleSchema,
  reason: z
    .string()
    .min(5, 'Especifica un motivo de auditoría de al menos 5 caracteres.')
    .max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AssignUserRoleInput = z.infer<typeof assignUserRoleSchema>;
