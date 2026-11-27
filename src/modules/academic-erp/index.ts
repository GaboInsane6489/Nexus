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
export {
  attendanceStatusSchema,
  evaluationTypeSchema,
  gradeRectificationRequestSchema,
  createSessionSchema,
  recordAttendanceSchema,
  createEvaluationItemSchema,
  gradeSubmissionSchema,
  closeCohortSchema,
  rectifyGradeSchema,
  completeLessonSchema,
  type GradeRectificationRequestInput,
  type CreateSessionInput,
  type RecordAttendanceInput,
  type CreateEvaluationItemInput,
  type GradeSubmissionInput,
  type CloseCohortInput,
  type RectifyGradeInput,
  type CompleteLessonInput,
} from './application/schemas';
export {
  listCohortErpBundles,
  type CohortStudentRosterItem,
  type CohortAttendanceRecordItem,
  type CohortSubmissionItem,
  type CohortErpFullBundle,
} from './infrastructure/queries';
export {
  createClassSessionAction,
  recordAttendanceAction,
  createEvaluationItemAction,
  gradeSubmissionAction,
  closeCohortGradebookAction,
  rectifyGradeAction,
  completeLessonAction,
} from './presentation/actions';
export { AcademicErpWorkspaceClient } from './presentation/components/AcademicErpWorkspaceClient';
