import type { RiskLevel } from '@/shared/types/database.types';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';
export type EvaluationType = 'exam' | 'quiz' | 'assignment' | 'project' | 'participation';
export type RectificationStatus = 'pending' | 'approved' | 'rejected';

export interface ClassSessionEntity {
  id: string;
  cohortId: string;
  sessionNumber: number;
  title: string;
  startsAt: string;
  endsAt: string;
  meetingOrRoomUrl: string | null;
  isAttendanceTaken: boolean;
}

export interface EvaluationItemEntity {
  id: string;
  cohortId: string;
  title: string;
  type: EvaluationType;
  weightPct: number;
  dueDate: string;
  allowLateSubmission: boolean;
  sortOrder: number;
}

export interface CohortErpAuditSummary {
  cohortId: string;
  cohortStatus: string;
  evaluationItemsCount: number;
  totalWeightPct: number;
  isWeightInvariantValid: boolean;
  scheduledSessionsCount: number;
  canCloseActa: boolean;
}

export interface CohortErpBundle {
  cohortId: string;
  cohortCode: string;
  cohortName: string;
  cohortStatus: string;
  scheduleLabel: string;
  courseCode: string;
  courseTitle: string;
  minPassingGrade: number;
  minAttendancePct: number;
  sessions: ClassSessionEntity[];
  evaluationItems: EvaluationItemEntity[];
  audit: CohortErpAuditSummary;
}

export interface AttendanceCalculationResult {
  currentAttendancePct: number;
  maxPossibleAttendancePct: number;
  riskLevel: RiskLevel;
  effectivePresentUnits: number;
  dictatedSessionsCount: number;
  totalSessionsCount: number;
}
