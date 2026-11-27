'use server';

import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/shared/types/action-result';
import type { AppRole } from '../domain/entities';
import { canAssignTargetRole } from '../domain/rules';
import {
  appRoleSchema,
  assignUserRoleSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
  type AssignUserRoleInput,
  type LoginInput,
  type RegisterInput,
  type UpdateProfileInput,
} from '../application/schemas';
import { getCurrentUserProfile } from '../infrastructure/queries';
import {
  executeAssignUserRoleRpc,
  switchActiveSessionRole,
  updateCurrentUserProfileRecord,
} from '../infrastructure/mutations';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/shared/lib/supabase/server';

export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<ActionResult<{ updatedAt: string }>> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Por favor revisa los campos del perfil.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    await updateCurrentUserProfileRecord(parsed.data);
    revalidatePath('/profile');
    revalidatePath('/');
    return {
      success: true,
      data: { updatedAt: new Date().toISOString() },
      message: 'Perfil académico actualizado correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'PROFILE_UPDATE_FAILED',
        message: err instanceof Error ? err.message : 'Error al actualizar el perfil.',
      },
    };
  }
}

export async function switchActiveRoleAction(
  targetRole: AppRole
): Promise<ActionResult<{ role: AppRole }>> {
  const parsed = appRoleSchema.safeParse(targetRole);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_ROLE',
        message: 'El rol seleccionado no es válido en Nexus.',
      },
    };
  }

  await switchActiveSessionRole(parsed.data);
  revalidatePath('/', 'layout');

  return {
    success: true,
    data: { role: parsed.data },
    message: `Contexto cambiado a rol: ${parsed.data}`,
  };
}

export async function assignUserRoleAction(
  input: AssignUserRoleInput
): Promise<ActionResult<{ targetUserId: string; newRole: AppRole }>> {
  const currentUser = await getCurrentUserProfile();
  const parsed = assignUserRoleSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de asignación de rol inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  if (!canAssignTargetRole(currentUser.role, parsed.data.newRole)) {
    return {
      success: false,
      error: {
        code: 'RBAC_FORBIDDEN',
        message: 'Se requiere rol super_admin para modificar permisos en la consola IAM.',
      },
    };
  }

  try {
    await executeAssignUserRoleRpc(parsed.data);
    revalidatePath('/admin/users');
    return {
      success: true,
      data: {
        targetUserId: parsed.data.targetUserId,
        newRole: parsed.data.newRole,
      },
      message: 'Rol actualizado y registrado en audit_logs.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'RPC_EXECUTION_ERROR',
        message: err instanceof Error ? err.message : 'Error al ejecutar rpc_assign_user_role.',
      },
    };
  }
}

export async function signInWithPasswordAction(
  input: LoginInput
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Credenciales con formato inválido.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) {
        return {
          success: false,
          error: {
            code: 'AUTH_INVALID_CREDENTIALS',
            message:
              error.message === 'Invalid login credentials'
                ? 'Correo o contraseña incorrectos. Verifica tu contraseña.'
                : error.message,
          },
        };
      }
    }

    revalidatePath('/', 'layout');
    return {
      success: true,
      data: { redirectTo: '/' },
      message: 'Sesión iniciada correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'AUTH_UNEXPECTED_ERROR',
        message:
          err instanceof Error
            ? err.message
            : 'Error de conexión al verificar credenciales.',
      },
    };
  }
}

export async function registerStudentAccountAction(
  input: RegisterInput
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los campos requeridos para tu expediente académico.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          document_id: parsed.data.documentId,
          timezone: parsed.data.timezone,
        },
      },
    });
    if (error) {
      return {
        success: false,
        error: {
          code: 'AUTH_SIGNUP_ERROR',
          message: error.message,
        },
      };
    }
  } else {
    await updateCurrentUserProfileRecord({
      fullName: parsed.data.fullName,
      username: parsed.data.email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase(),
      documentId: parsed.data.documentId,
      timezone: parsed.data.timezone,
      bio: 'Estudiante activo en Nexus Academy & ERP.',
    });
  }

  revalidatePath('/', 'layout');
  return {
    success: true,
    data: { redirectTo: '/' },
    message: 'Expediente estudiantil creado exitosamente.',
  };
}
