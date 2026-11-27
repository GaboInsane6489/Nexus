import type {
  CourseEntity,
  CoursePrerequisiteEdge,
  EvaluatedDagCourseNode,
} from './entities';

/**
 * Detecta en memoria (DFS) si agregar la arista `requiredCourseId -> targetCourseId`
 * generaría un ciclo cerrado en el Grafo Dirigido Acíclico (DAG).
 */
export function wouldCreateDagCycle(
  existingEdges: readonly CoursePrerequisiteEdge[],
  targetCourseId: string,
  candidateRequiredCourseId: string
): boolean {
  if (targetCourseId === candidateRequiredCourseId) {
    return true;
  }

  // Verifica si targetCourseId ya es un prerrequisito directo o indirecto de candidateRequiredCourseId
  const visited = new Set<string>();
  const stack: string[] = [candidateRequiredCourseId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    if (currentId === targetCourseId) {
      return true;
    }
    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    for (const edge of existingEdges) {
      if (edge.courseId === currentId) {
        stack.push(edge.requiredCourseId);
      }
    }
  }

  return false;
}

/**
 * Evalúa el estado de desbloqueo de cada curso en la malla curricular (DAG)
 * dado el conjunto de IDs de cursos ya aprobados por el estudiante.
 */
export function evaluateCurriculumDag(
  courses: readonly CourseEntity[],
  edges: readonly CoursePrerequisiteEdge[],
  completedCourseIds: ReadonlySet<string>
): EvaluatedDagCourseNode[] {
  const courseMap = new Map<string, CourseEntity>();
  for (const c of courses) {
    courseMap.set(c.id, c);
  }

  return courses.map((course) => {
    if (completedCourseIds.has(course.id)) {
      return {
        ...course,
        dagState: 'completed',
        missingPrerequisites: [],
      };
    }

    const requiredEdges = edges.filter((e) => e.courseId === course.id);
    const missingPrerequisites = requiredEdges
      .filter((e) => !completedCourseIds.has(e.requiredCourseId))
      .map((e) => {
        const reqCourse = courseMap.get(e.requiredCourseId);
        return {
          courseId: e.requiredCourseId,
          code: reqCourse?.code ?? 'REQ',
          title: reqCourse?.title ?? 'Curso Prerrequisito',
          minGradeRequired: e.minGradeRequired,
        };
      });

    return {
      ...course,
      dagState: missingPrerequisites.length === 0 ? 'unlocked' : 'locked',
      missingPrerequisites,
    };
  });
}
