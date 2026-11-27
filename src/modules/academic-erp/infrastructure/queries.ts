'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type {
  ClassSessionEntity,
  CohortErpAuditSummary,
  CohortErpBundle,
  EvaluationItemEntity,
} from '../domain/entities';

export async function listCohortErpBundles(): Promise<CohortErpBundle[]> {
  const supabase = await createSupabaseServerClient();

  const [cohortsRes, coursesRes, sessionsRes, evalItemsRes] = await Promise.all([
    supabase
      .from('cohorts')
      .select(
        'id, code, name, course_id, schedule_label, status'
      )
      .in('code', ['CS101-2027I-A', 'DB102-2027I-A', 'SEC201-2027I-A'])
      .order('code', { ascending: true })
      .limit(10),
    supabase
      .from('courses')
      .select('id, code, title, min_passing_grade, min_attendance_pct')
      .limit(20),
    supabase
      .from('class_sessions')
      .select(
        'id, cohort_id, session_number, title, starts_at, ends_at, meeting_or_room_url, is_attendance_taken'
      )
      .order('session_number', { ascending: true })
      .limit(100),
    supabase
      .from('evaluation_items')
      .select(
        'id, cohort_id, title, type, weight_pct, due_date, allow_late_submission, sort_order'
      )
      .order('sort_order', { ascending: true })
      .limit(100),
  ]);

  const courseMap = new Map<
    string,
    {
      code: string;
      title: string;
      minPassingGrade: number;
      minAttendancePct: number;
    }
  >();

  for (const c of coursesRes.data ?? []) {
    courseMap.set(c.id, {
      code: c.code,
      title: c.title,
      minPassingGrade: Number(c.min_passing_grade),
      minAttendancePct: Number(c.min_attendance_pct),
    });
  }

  const sessionsByCohort = new Map<string, ClassSessionEntity[]>();
  for (const s of sessionsRes.data ?? []) {
    const arr = sessionsByCohort.get(s.cohort_id) ?? [];
    arr.push({
      id: s.id,
      cohortId: s.cohort_id,
      sessionNumber: s.session_number,
      title: s.title,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      meetingOrRoomUrl: s.meeting_or_room_url,
      isAttendanceTaken: s.is_attendance_taken,
    });
    sessionsByCohort.set(s.cohort_id, arr);
  }

  const evalsByCohort = new Map<string, EvaluationItemEntity[]>();
  for (const e of evalItemsRes.data ?? []) {
    const arr = evalsByCohort.get(e.cohort_id) ?? [];
    arr.push({
      id: e.id,
      cohortId: e.cohort_id,
      title: e.title,
      type: e.type,
      weightPct: Number(e.weight_pct),
      dueDate: e.due_date,
      allowLateSubmission: e.allow_late_submission,
      sortOrder: e.sort_order,
    });
    evalsByCohort.set(e.cohort_id, arr);
  }

  const bundles: CohortErpBundle[] = [];

  for (const cohort of cohortsRes.data ?? []) {
    const course = courseMap.get(cohort.course_id);
    const sessions = sessionsByCohort.get(cohort.id) ?? [];
    const evaluationItems = evalsByCohort.get(cohort.id) ?? [];

    const totalWeightPct = Number(
      evaluationItems.reduce((acc, item) => acc + item.weightPct, 0).toFixed(2)
    );
    const isWeightInvariantValid = Math.abs(totalWeightPct - 100.0) < 0.01;

    const audit: CohortErpAuditSummary = {
      cohortId: cohort.id,
      cohortStatus: cohort.status,
      evaluationItemsCount: evaluationItems.length,
      totalWeightPct,
      isWeightInvariantValid,
      scheduledSessionsCount: sessions.length,
      canCloseActa:
        isWeightInvariantValid &&
        sessions.length > 0 &&
        (cohort.status === 'active' || cohort.status === 'grading'),
    };

    bundles.push({
      cohortId: cohort.id,
      cohortCode: cohort.code,
      cohortName: cohort.name,
      cohortStatus: cohort.status,
      scheduleLabel: cohort.schedule_label,
      courseCode: course?.code ?? 'CUR',
      courseTitle: course?.title ?? cohort.name,
      minPassingGrade: course?.minPassingGrade ?? 70,
      minAttendancePct: course?.minAttendancePct ?? 80,
      sessions,
      evaluationItems,
      audit,
    });
  }

  return bundles;
}
