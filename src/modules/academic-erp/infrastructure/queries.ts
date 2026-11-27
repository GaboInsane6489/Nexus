'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type {
  AttendanceStatus,
  ClassSessionEntity,
  CohortErpAuditSummary,
  CohortErpBundle,
  EvaluationItemEntity,
} from '../domain/entities';

export interface CohortStudentRosterItem {
  enrollmentId: string;
  studentId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  finalGrade: number;
  attendancePct: number;
  academicRiskLevel: string;
}

export interface CohortAttendanceRecordItem {
  id: string;
  sessionId: string;
  enrollmentId: string;
  status: AttendanceStatus;
  recordedAt: string;
}

export interface CohortSubmissionItem {
  id: string;
  evaluationId: string;
  enrollmentId: string;
  score: number | null;
  instructorFeedback: string | null;
  gradedAt: string | null;
  submittedAt: string;
}

export interface CohortErpFullBundle extends CohortErpBundle {
  enrollments: CohortStudentRosterItem[];
  attendanceRecords: CohortAttendanceRecordItem[];
  submissions: CohortSubmissionItem[];
}

export async function listCohortErpBundles(): Promise<CohortErpFullBundle[]> {
  const supabase = await createSupabaseServerClient();

  const { data: cohortsData, error: cohortsError } = await supabase
    .from('cohorts')
    .select('id, code, name, course_id, schedule_label, status, start_date')
    .order('start_date', { ascending: false })
    .limit(20);

  if (cohortsError || !cohortsData || cohortsData.length === 0) {
    return [];
  }

  const cohortIds = cohortsData.map((c) => c.id);
  const courseIds = Array.from(new Set(cohortsData.map((c) => c.course_id)));

  const [coursesRes, sessionsRes, evalItemsRes, enrollmentsRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, code, title, min_passing_grade, min_attendance_pct')
      .in('id', courseIds),
    supabase
      .from('class_sessions')
      .select(
        'id, cohort_id, session_number, title, starts_at, ends_at, meeting_or_room_url, is_attendance_taken'
      )
      .in('cohort_id', cohortIds)
      .order('session_number', { ascending: true }),
    supabase
      .from('evaluation_items')
      .select(
        'id, cohort_id, title, type, weight_pct, due_date, allow_late_submission, sort_order'
      )
      .in('cohort_id', cohortIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('enrollments')
      .select(
        'id, cohort_id, student_id, status, final_grade, attendance_pct, academic_risk_level'
      )
      .in('cohort_id', cohortIds),
  ]);

  const sessionRows = sessionsRes.data ?? [];
  const evalRows = evalItemsRes.data ?? [];
  const enrollmentRows = enrollmentsRes.data ?? [];

  const sessionIds = sessionRows.map((s) => s.id);
  const evalIds = evalRows.map((e) => e.id);
  const studentIds = Array.from(new Set(enrollmentRows.map((enr) => enr.student_id)));

  const [profilesRes, attendanceRes, submissionsRes] = await Promise.all([
    studentIds.length > 0
      ? supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', studentIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; email: string; avatar_url: string | null }[] }),
    sessionIds.length > 0
      ? supabase
          .from('attendance_records')
          .select('id, session_id, enrollment_id, status, recorded_at')
          .in('session_id', sessionIds)
      : Promise.resolve({ data: [] as { id: string; session_id: string; enrollment_id: string; status: AttendanceStatus; recorded_at: string }[] }),
    evalIds.length > 0
      ? supabase
          .from('submissions')
          .select(
            'id, evaluation_id, enrollment_id, score, instructor_feedback, graded_at, submitted_at'
          )
          .in('evaluation_id', evalIds)
      : Promise.resolve({ data: [] as { id: string; evaluation_id: string; enrollment_id: string; score: number | null; instructor_feedback: string | null; graded_at: string | null; submitted_at: string }[] }),
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

  const profileMap = new Map<
    string,
    { fullName: string; email: string; avatarUrl: string | null }
  >();
  for (const p of profilesRes.data ?? []) {
    profileMap.set(p.id, {
      fullName: p.full_name,
      email: p.email,
      avatarUrl: p.avatar_url,
    });
  }

  const sessionsByCohort = new Map<string, ClassSessionEntity[]>();
  const sessionToCohort = new Map<string, string>();
  for (const s of sessionRows) {
    sessionToCohort.set(s.id, s.cohort_id);
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
  const evalToCohort = new Map<string, string>();
  for (const e of evalRows) {
    evalToCohort.set(e.id, e.cohort_id);
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

  const enrollmentsByCohort = new Map<string, CohortStudentRosterItem[]>();
  for (const enr of enrollmentRows) {
    const profile = profileMap.get(enr.student_id);
    const arr = enrollmentsByCohort.get(enr.cohort_id) ?? [];
    arr.push({
      enrollmentId: enr.id,
      studentId: enr.student_id,
      fullName: profile?.fullName ?? 'Estudiante',
      email: profile?.email ?? '',
      avatarUrl: profile?.avatarUrl ?? null,
      status: enr.status,
      finalGrade: Number(enr.final_grade ?? 0),
      attendancePct: Number(enr.attendance_pct ?? 100),
      academicRiskLevel: enr.academic_risk_level ?? 'normal',
    });
    enrollmentsByCohort.set(enr.cohort_id, arr);
  }

  const attendanceByCohort = new Map<string, CohortAttendanceRecordItem[]>();
  for (const att of attendanceRes.data ?? []) {
    const cohortId = sessionToCohort.get(att.session_id);
    if (!cohortId) continue;
    const arr = attendanceByCohort.get(cohortId) ?? [];
    arr.push({
      id: att.id,
      sessionId: att.session_id,
      enrollmentId: att.enrollment_id,
      status: att.status as AttendanceStatus,
      recordedAt: att.recorded_at,
    });
    attendanceByCohort.set(cohortId, arr);
  }

  const submissionsByCohort = new Map<string, CohortSubmissionItem[]>();
  for (const sub of submissionsRes.data ?? []) {
    const cohortId = evalToCohort.get(sub.evaluation_id);
    if (!cohortId) continue;
    const arr = submissionsByCohort.get(cohortId) ?? [];
    arr.push({
      id: sub.id,
      evaluationId: sub.evaluation_id,
      enrollmentId: sub.enrollment_id,
      score: sub.score !== null && sub.score !== undefined ? Number(sub.score) : null,
      instructorFeedback: sub.instructor_feedback,
      gradedAt: sub.graded_at,
      submittedAt: sub.submitted_at,
    });
    submissionsByCohort.set(cohortId, arr);
  }

  const bundles: CohortErpFullBundle[] = [];

  for (const cohort of cohortsData) {
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
      enrollments: enrollmentsByCohort.get(cohort.id) ?? [],
      attendanceRecords: attendanceByCohort.get(cohort.id) ?? [],
      submissions: submissionsByCohort.get(cohort.id) ?? [],
    });
  }

  return bundles;
}
