'use server';

import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/shared/types/action-result';
import { addPrerequisiteEdgeSchema, type AddPrerequisiteEdgeInput } from '../application/schemas';
import { wouldCreateDagCycle } from '../domain/rules';
import { getCurriculumDagSnapshot } from '../infrastructure/queries';
import { insertPrerequisiteEdgeRecord } from '../infrastructure/mutations';

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
