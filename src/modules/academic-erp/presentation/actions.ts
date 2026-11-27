'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserProfile, type AppRole, type UserProfile } from '@/modules/iam';
import type { ActionResult } from '@/shared/types/action-result';
import {
  closeCohortSchema,
  completeLessonSchema,
  createEvaluationItemSchema,
  createSessionSchema,
  gradeSubmissionSchema,
  recordAttendanceSchema,
  rectifyGradeSchema,
  type CloseCohortInput,
  type CompleteLessonInput,
  type CreateEvaluationItemInput,
  type CreateSessionInput,
  type GradeSubmissionInput,
  type RecordAttendanceInput,
  type RectifyGradeInput,
} from '../application/schemas';
import {
  callCloseCohortGradebookRpc,
  insertClassSessionRecord,
  insertEvaluationItemRecord,
  insertGradeRectificationAndUpdateScore,
  upsertAttendanceRecords,
  upsertLessonProgressAndAwardXp,
  upsertSubmissionGradeRecord,
} from '../infrastructure/mutations';

async function requireRoles(
  allowedRoles: AppRole[],
  forbiddenMessage: string
): Promise<{ profile: UserProfile } | { failure: ActionResult<never> }> {
  const profile = await getCurrentUserProfile();
  if (!profile || !allowedRoles.includes(profile.role)) {
    return {
      failure: {
        success: false,
        error: {
          code: 'RBAC_FORBIDDEN',
          message: forbiddenMessage,
        },
      },
    };
  }
  return { profile };
}

function revalidateErpRoutes(): void {
  revalidatePath('/erp');
  revalidatePath('/progress');
}

export async function createClassSessionAction(
  input: CreateSessionInput
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRoles(
    ['instructor', 'coordinator', 'super_admin'],
    'Se requiere rol instructor, coordinator o super_admin para programar sesiones.'
  );
  if ('failure' in auth) return auth.failure;

  const parsed = createSessionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de sesión inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const created = await insertClassSessionRecord(parsed.data);
    revalidateErpRoutes();
    return {
      success: true,
      data: created,
      message: 'Sesión de clase programada correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_INSERT_FAILED',
        message: err instanceof Error ? err.message : 'Error al crear la sesión de clase.',
      },
    };
  }
}

export async function recordAttendanceAction(
  input: RecordAttendanceInput
): Promise<ActionResult<{ count: number }>> {
  const auth = await requireRoles(
    ['instructor', 'coordinator', 'super_admin'],
    'Se requiere rol instructor, coordinator o super_admin para registrar asistencia.'
  );
  if ('failure' in auth) return auth.failure;

  const parsed = recordAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de asistencia inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const result = await upsertAttendanceRecords(parsed.data, auth.profile.id);
    revalidateErpRoutes();
    return {
      success: true,
      data: result,
      message: `Asistencia registrada para ${result.count} estudiante(s).`,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_UPSERT_FAILED',
        message: err instanceof Error ? err.message : 'Error al registrar asistencia.',
      },
    };
  }
}

export async function createEvaluationItemAction(
  input: CreateEvaluationItemInput
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRoles(
    ['instructor', 'coordinator', 'super_admin'],
    'Se requiere rol instructor, coordinator o super_admin para crear evaluaciones.'
  );
  if ('failure' in auth) return auth.failure;

  const parsed = createEvaluationItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de rubro de evaluación inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const created = await insertEvaluationItemRecord(parsed.data);
    revalidateErpRoutes();
    return {
      success: true,
      data: created,
      message: 'Rubro de evaluación creado correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_INSERT_FAILED',
        message: err instanceof Error ? err.message : 'Error al crear rubro de evaluación.',
      },
    };
  }
}

export async function gradeSubmissionAction(
  input: GradeSubmissionInput
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRoles(
    ['instructor', 'coordinator', 'super_admin'],
    'Se requiere rol instructor, coordinator o super_admin para calificar entregas.'
  );
  if ('failure' in auth) return auth.failure;

  const parsed = gradeSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de calificación inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const graded = await upsertSubmissionGradeRecord(parsed.data, auth.profile.id);
    revalidateErpRoutes();
    return {
      success: true,
      data: graded,
      message: 'Calificación registrada correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_UPSERT_FAILED',
        message: err instanceof Error ? err.message : 'Error al calificar la entrega.',
      },
    };
  }
}

export async function closeCohortGradebookAction(
  input: CloseCohortInput
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await requireRoles(
    ['coordinator', 'super_admin'],
    'Se requiere rol coordinator o super_admin para cerrar el acta de la cohorte.'
  );
  if ('failure' in auth) return auth.failure;

  const parsed = closeCohortSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Identificador de cohorte inválido.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const result = await callCloseCohortGradebookRpc(parsed.data.cohortId);
    revalidateErpRoutes();
    return {
      success: true,
      data: result,
      message: 'Acta de cohorte cerrada y consolidada en PostgreSQL.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'RPC_CLOSE_FAILED',
        message: err instanceof Error ? err.message : 'Error al cerrar el acta de la cohorte.',
      },
    };
  }
}

export async function rectifyGradeAction(
  input: RectifyGradeInput
): Promise<ActionResult<{ rectificationId: string }>> {
  const auth = await requireRoles(
    ['coordinator', 'super_admin'],
    'Se requiere rol coordinator o super_admin para rectificar actas.'
  );
  if ('failure' in auth) return auth.failure;

  const parsed = rectifyGradeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de rectificación inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const result = await insertGradeRectificationAndUpdateScore(
      parsed.data,
      auth.profile.id
    );
    revalidateErpRoutes();
    return {
      success: true,
      data: result,
      message: 'Rectificación de nota aprobada y aplicada correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_RECTIFICATION_FAILED',
        message: err instanceof Error ? err.message : 'Error al rectificar la calificación.',
      },
    };
  }
}

export async function completeLessonAction(
  input: CompleteLessonInput
): Promise<ActionResult<{ completed: boolean; xpResult: Record<string, unknown> }>> {
  const auth = await requireRoles(
    ['student', 'instructor', 'coordinator', 'super_admin'],
    'Debes iniciar sesión para registrar el progreso de lecciones.'
  );
  if ('failure' in auth) return auth.failure;

  const parsed = completeLessonSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de progreso de lección inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const result = await upsertLessonProgressAndAwardXp(parsed.data, auth.profile.id);
    revalidateErpRoutes();
    return {
      success: true,
      data: result,
      message: 'Lección completada y experiencia (25 XP) acreditada.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_PROGRESS_FAILED',
        message:
          err instanceof Error ? err.message : 'Error al registrar el progreso de la lección.',
      },
    };
  }
}
