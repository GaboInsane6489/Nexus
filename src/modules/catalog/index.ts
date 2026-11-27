// API Pública del Módulo Catalog (Nivel 1) — Gobernado por nexus-architecture-guard
export type {
  AcademicTermEntity,
  LearningPathEntity,
  CourseEntity,
  CourseModuleEntity,
  LessonEntity,
  CoursePrerequisiteEdge,
  DagNodeState,
  EvaluatedDagCourseNode,
} from './domain/entities';
export { wouldCreateDagCycle, evaluateCurriculumDag } from './domain/rules';
export {
  listAcademicTerms,
  listPublishedLearningPaths,
  getCurriculumDagSnapshot,
} from './infrastructure/queries';
export { validateAndAddPrerequisiteAction } from './presentation/actions';
export { CatalogDagExplorerClient } from './presentation/components/CatalogDagExplorerClient';
