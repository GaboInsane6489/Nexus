'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type {
  CompleteLessonOutput,
  CreateEvaluationItemOutput,
  CreateSessionOutput,
  GradeSubmissionOutput,
  RecordAttendanceOutput,
  RectifyGradeOutput,
} from '../application/schemas';

export async function insertClassSessionRecord(
  input: CreateSessionOutput
): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('class_sessions')
    .insert({
      cohort_id: input.cohortId,
      session_number: input.sessionNumber,
      title: input.title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      meeting_or_room_url: input.meetingOrRoomUrl || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear la sesión de clase.');
  }

  return { id: data.id };
}

export async function upsertAttendanceRecords(
  input: RecordAttendanceOutput,
  recordedBy: string
): Promise<{ count: number }> {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  const rows = input.records.map((rec) => ({
    session_id: input.sessionId,
    enrollment_id: rec.enrollmentId,
    status: rec.status,
    recorded_by: recordedBy,
    recorded_at: now,
  }));

  const { error: upsertError } = await supabase
    .from('attendance_records')
    .upsert(rows, { onConflict: 'session_id,enrollment_id' });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const { error: sessionError } = await supabase
    .from('class_sessions')
    .update({ is_attendance_taken: true })
    .eq('id', input.sessionId);

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  return { count: rows.length };
}

export async function insertEvaluationItemRecord(
  input: CreateEvaluationItemOutput
): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();

  const { data: existingItems, error: fetchError } = await supabase
    .from('evaluation_items')
    .select('weight_pct')
    .eq('cohort_id', input.cohortId);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const currentSum = (existingItems ?? []).reduce(
    (acc, item) => acc + Number(item.weight_pct),
    0
  );
  const nextSum = Number((currentSum + input.weightPct).toFixed(2));

  if (nextSum > 100.0) {
    throw new Error(
      `La suma de pesos (${nextSum}%) superaría el 100.00% permitido para la cohorte.`
    );
  }

  const { data, error } = await supabase
    .from('evaluation_items')
    .insert({
      cohort_id: input.cohortId,
      title: input.title,
      type: input.type,
      weight_pct: input.weightPct,
      due_date: input.dueDate,
      allow_late_submission: input.allowLateSubmission,
      sort_order: input.sortOrder,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear el rubro de evaluación.');
  }

  return { id: data.id };
}

export async function upsertSubmissionGradeRecord(
  input: GradeSubmissionOutput,
  gradedBy: string
): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('submissions')
    .upsert(
      {
        evaluation_id: input.evaluationId,
        enrollment_id: input.enrollmentId,
        score: input.score,
        instructor_feedback: input.instructorFeedback ?? null,
        graded_by: gradedBy,
        graded_at: new Date().toISOString(),
      },
      { onConflict: 'evaluation_id,enrollment_id' }
    )
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo registrar la calificación.');
  }

  return { id: data.id };
}

export async function callCloseCohortGradebookRpc(
  cohortId: string
): Promise<Record<string, unknown>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('rpc_close_cohort_gradebook', {
    p_cohort_id: cohortId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data as Record<string, unknown>) ?? { closed: true };
}

export async function insertGradeRectificationAndUpdateScore(
  input: RectifyGradeOutput,
  actorId: string
): Promise<{ rectificationId: string }> {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  const { data: rectData, error: rectError } = await supabase
    .from('grade_rectifications')
    .insert({
      submission_id: input.submissionId,
      previous_score: input.previousScore,
      new_score: input.newScore,
      justification_reason: input.justificationReason,
      evidence_url: input.evidenceUrl ?? null,
      requested_by_instructor_id: actorId,
      approved_by_coordinator_id: actorId,
      status: 'approved',
      resolved_at: now,
    })
    .select('id')
    .single();

  if (rectError || !rectData) {
    throw new Error(rectError?.message ?? 'No se pudo registrar la rectificación de nota.');
  }

  const { error: subError } = await supabase
    .from('submissions')
    .update({
      score: input.newScore,
      graded_by: actorId,
      graded_at: now,
    })
    .eq('id', input.submissionId);

  if (subError) {
    throw new Error(subError.message);
  }

  return { rectificationId: rectData.id };
}

export async function upsertLessonProgressAndAwardXp(
  input: CompleteLessonOutput,
  userId: string
): Promise<{ completed: boolean; xpResult: Record<string, unknown> }> {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  const { error: progressError } = await supabase.from('lesson_progress').upsert(
    {
      enrollment_id: input.enrollmentId,
      lesson_id: input.lessonId,
      is_completed: true,
      watched_seconds: input.watchedSeconds,
      completed_at: now,
    },
    { onConflict: 'enrollment_id,lesson_id' }
  );

  if (progressError) {
    throw new Error(progressError.message);
  }

  const { data: xpData, error: xpError } = await supabase.rpc(
    'rpc_award_xp_idempotent',
    {
      p_user_id: userId,
      p_event_type: 'lesson_completed',
      p_reference_id: `${input.enrollmentId}:${input.lessonId}`,
      p_xp_amount: 25,
    }
  );

  if (xpError) {
    throw new Error(xpError.message);
  }

  return {
    completed: true,
    xpResult: (xpData as Record<string, unknown>) ?? {},
  };
}
