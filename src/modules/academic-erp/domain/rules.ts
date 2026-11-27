import type {
  AttendanceCalculationResult,
  AttendanceStatus,
  EvaluationItemEntity,
} from './entities';

export const ATTENDANCE_WEIGHT_MAP: Record<AttendanceStatus, number> = {
  present: 1.0,
  excused: 1.0,
  late: 0.5,
  absent: 0.0,
};

/**
 * Calcula la nota final ponderada de una matrícula según los rubros evaluativos de la cohorte:
 * G_final = ROUND(SUM(score_i * weight_pct_i / 100), 2)
 */
export function calculateWeightedGrade(
  items: readonly EvaluationItemEntity[],
  scoresByItemId: Readonly<Record<string, number>>
): {
  finalGrade: number;
  totalConfiguredWeightPct: number;
  isWeightInvariantValid: boolean;
} {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const item of items) {
    totalWeight += item.weightPct;
    const rawScore = scoresByItemId[item.id] ?? 0;
    const clampedScore = Math.min(100, Math.max(0, rawScore));
    weightedSum += (clampedScore * item.weightPct) / 100;
  }

  const roundedTotalWeight = Number(totalWeight.toFixed(2));
  return {
    finalGrade: Number(weightedSum.toFixed(2)),
    totalConfiguredWeightPct: roundedTotalWeight,
    isWeightInvariantValid: Math.abs(roundedTotalWeight - 100.0) < 0.01,
  };
}

/**
 * Calcula el porcentaje actual de asistencia, el porcentaje máximo alcanzable en las sesiones
 * restantes y el nivel de Alerta Temprana de Deserción (Early Warning System).
 */
export function evaluateStudentAttendanceAndRisk(
  sessionStatuses: readonly AttendanceStatus[],
  totalScheduledSessions: number,
  minAttendancePctRequired: number
): AttendanceCalculationResult {
  const dictatedCount = sessionStatuses.length;
  const totalCount = Math.max(dictatedCount, totalScheduledSessions, 1);
  const remainingSessions = Math.max(0, totalCount - dictatedCount);

  let effectiveUnits = 0;
  for (const st of sessionStatuses) {
    effectiveUnits += ATTENDANCE_WEIGHT_MAP[st] ?? 0;
  }

  const currentAttendancePct =
    dictatedCount > 0
      ? Number(((effectiveUnits / dictatedCount) * 100).toFixed(2))
      : 100.0;

  const maxPossibleAttendancePct = Number(
    (((effectiveUnits + remainingSessions) / totalCount) * 100).toFixed(2)
  );

  let riskLevel: AttendanceCalculationResult['riskLevel'] = 'normal';
  if (maxPossibleAttendancePct < minAttendancePctRequired) {
    riskLevel = 'critical_dropout_risk';
  } else if (maxPossibleAttendancePct < minAttendancePctRequired + 5.0) {
    riskLevel = 'warning';
  }

  return {
    currentAttendancePct,
    maxPossibleAttendancePct,
    riskLevel,
    effectivePresentUnits: effectiveUnits,
    dictatedSessionsCount: dictatedCount,
    totalSessionsCount: totalCount,
  };
}

/**
 * Determina el dictamen definitivo al cerrar el acta de la cohorte (Regla Inquebrantable #5).
 */
export function determineFinalEnrollmentVerdict(
  finalGrade: number,
  attendancePct: number,
  minPassingGrade: number,
  minAttendancePct: number
): 'completed' | 'failed_grade' | 'failed_attendance' {
  if (attendancePct < minAttendancePct) {
    return 'failed_attendance';
  }
  if (finalGrade < minPassingGrade) {
    return 'failed_grade';
  }
  return 'completed';
}
