// API Pública del Módulo Academic-ERP (Nivel 3) — Gobernado por nexus-architecture-guard
export type {
  AttendanceStatus,
  EvaluationType,
  RectificationStatus,
  ClassSessionEntity,
  EvaluationItemEntity,
  CohortErpAuditSummary,
  CohortErpBundle,
  AttendanceCalculationResult,
} from './domain/entities';
export {
  ATTENDANCE_WEIGHT_MAP,
  calculateWeightedGrade,
  evaluateStudentAttendanceAndRisk,
  determineFinalEnrollmentVerdict,
} from './domain/rules';
export { listCohortErpBundles } from './infrastructure/queries';
export { AcademicErpWorkspaceClient } from './presentation/components/AcademicErpWorkspaceClient';
