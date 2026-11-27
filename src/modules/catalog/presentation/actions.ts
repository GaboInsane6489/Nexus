'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserProfile } from '@/modules/iam';
import type { ActionResult } from '@/shared/types/action-result';
import {
  addPrerequisiteEdgeSchema,
  createAcademicTermSchema,
  createCourseModuleSchema,
  createCourseSchema,
  createLearningPathSchema,
  createLessonSchema,
  deletePrerequisiteSchema,
  type AddPrerequisiteEdgeInput,
  type CreateAcademicTermInput,
  type CreateCourseInput,
  type CreateCourseModuleInput,
  type CreateLearningPathInput,
  type CreateLessonInput,
  type DeletePrerequisiteInput,
} from '../application/schemas';
import { wouldCreateDagCycle } from '../domain/rules';
import { getCurriculumDagSnapshot } from '../infrastructure/queries';
import {
  deletePrerequisiteEdgeRecord,
  insertAcademicTermRecord,
  insertCourseModuleRecord,
  insertCourseRecord,
  insertLearningPathRecord,
  insertLessonRecord,
  insertPrerequisiteEdgeRecord,
} from '../infrastructure/mutations';

async function requireCatalogManagerRole(): Promise<ActionResult<never> | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return {
      success: false,
      error: {
        code: 'RBAC_FORBIDDEN',
        message: 'Se requiere rol coordinator o super_admin para gestionar el catálogo.',
      },
    };
  }
  return null;
}

function revalidateCatalogRoutes(): void {
  revalidatePath('/paths');
  revalidatePath('/');
}

export async function validateAndAddPrerequisiteAction(
  input: AddPrerequisiteEdgeInput
): Promise<ActionResult<{ edgeAdded: boolean }>> {
  const parsed = addPrerequisiteEdgeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de prerrequisito inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const snapshot = await getCurriculumDagSnapshot();

  // 1. Validación determinística en dominio (DFS anti-ciclo)
  if (
    wouldCreateDagCycle(
      snapshot.edges,
      parsed.data.courseId,
      parsed.data.requiredCourseId
    )
  ) {
    return {
      success: false,
      error: {
        code: 'DAG_CYCLE_DETECTED',
        message:
          'DAG_CYCLE_DETECTED: Esta relación crearia una dependencia circular en el grafo curricular.',
      },
    };
  }

  try {
    await insertPrerequisiteEdgeRecord(parsed.data);
    revalidatePath('/paths');
    return {
      success: true,
      data: { edgeAdded: true },
      message: 'Prerrequisito validado sin ciclos y registrado en PostgreSQL.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_DAG_REJECTED',
        message:
          err instanceof Error
            ? err.message
            : 'Error al registrar prerrequisito en PostgreSQL.',
      },
    };
  }
}

export async function createAcademicTermAction(
  input: CreateAcademicTermInput
): Promise<ActionResult<{ id: string }>> {
  const forbidden = await requireCatalogManagerRole();
  if (forbidden) return forbidden;

  const parsed = createAcademicTermSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de período académico inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const created = await insertAcademicTermRecord(parsed.data);
    revalidateCatalogRoutes();
    return {
      success: true,
      data: created,
      message: 'Período académico creado correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_INSERT_FAILED',
        message:
          err instanceof Error ? err.message : 'Error al crear el período académico.',
      },
    };
  }
}

export async function createLearningPathAction(
  input: CreateLearningPathInput
): Promise<ActionResult<{ id: string }>> {
  const forbidden = await requireCatalogManagerRole();
  if (forbidden) return forbidden;

  const parsed = createLearningPathSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de ruta de aprendizaje inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const created = await insertLearningPathRecord(parsed.data);
    revalidateCatalogRoutes();
    return {
      success: true,
      data: created,
      message: 'Ruta de aprendizaje creada correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_INSERT_FAILED',
        message:
          err instanceof Error ? err.message : 'Error al crear la ruta de aprendizaje.',
      },
    };
  }
}

export async function createCourseAction(
  input: CreateCourseInput
): Promise<ActionResult<{ id: string }>> {
  const forbidden = await requireCatalogManagerRole();
  if (forbidden) return forbidden;

  const parsed = createCourseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de curso inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const created = await insertCourseRecord(parsed.data);
    revalidateCatalogRoutes();
    return {
      success: true,
      data: created,
      message: 'Curso creado correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_INSERT_FAILED',
        message: err instanceof Error ? err.message : 'Error al crear el curso.',
      },
    };
  }
}

export async function createCourseModuleAction(
  input: CreateCourseModuleInput
): Promise<ActionResult<{ id: string }>> {
  const forbidden = await requireCatalogManagerRole();
  if (forbidden) return forbidden;

  const parsed = createCourseModuleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de módulo inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const created = await insertCourseModuleRecord(parsed.data);
    revalidateCatalogRoutes();
    return {
      success: true,
      data: created,
      message: 'Módulo creado correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_INSERT_FAILED',
        message: err instanceof Error ? err.message : 'Error al crear el módulo.',
      },
    };
  }
}

export async function createLessonAction(
  input: CreateLessonInput
): Promise<ActionResult<{ id: string }>> {
  const forbidden = await requireCatalogManagerRole();
  if (forbidden) return forbidden;

  const parsed = createLessonSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de lección inválidos.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const created = await insertLessonRecord(parsed.data);
    revalidateCatalogRoutes();
    return {
      success: true,
      data: created,
      message: 'Lección creada correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_INSERT_FAILED',
        message: err instanceof Error ? err.message : 'Error al crear la lección.',
      },
    };
  }
}

export async function deletePrerequisiteAction(
  input: DeletePrerequisiteInput
): Promise<ActionResult<{ deleted: boolean }>> {
  const forbidden = await requireCatalogManagerRole();
  if (forbidden) return forbidden;

  const parsed = deletePrerequisiteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Identificador de prerrequisito inválido.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    await deletePrerequisiteEdgeRecord(parsed.data.edgeId);
    revalidateCatalogRoutes();
    return {
      success: true,
      data: { deleted: true },
      message: 'Prerrequisito eliminado correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_DELETE_FAILED',
        message:
          err instanceof Error ? err.message : 'Error al eliminar el prerrequisito.',
      },
    };
  }
}
