-- Fase 4 & 5 (Operación Real): RPCs de Cierre de Acta, XP Idempotente y Emisión SHA-256
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.rpc_award_xp_idempotent(
  p_user_id uuid,
  p_event_type text,
  p_reference_id text,
  p_xp_amount integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_id uuid;
  v_new_xp integer;
  v_new_level integer;
BEGIN
  IF p_xp_amount <= 0 THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'INVALID_XP');
  END IF;

  INSERT INTO public.xp_ledger (user_id, event_type, reference_id, xp_amount)
  VALUES (p_user_id, p_event_type, p_reference_id, p_xp_amount)
  ON CONFLICT (user_id, event_type, reference_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'ALREADY_AWARDED');
  END IF;

  INSERT INTO public.user_gamification (
    user_id, total_xp, current_level, current_streak_days, longest_streak_days, last_activity_date
  )
  VALUES (
    p_user_id,
    p_xp_amount,
    public.fn_calculate_level_from_xp(p_xp_amount),
    1,
    1,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp = public.user_gamification.total_xp + p_xp_amount,
        current_level = public.fn_calculate_level_from_xp(public.user_gamification.total_xp + p_xp_amount),
        current_streak_days = CASE
          WHEN public.user_gamification.last_activity_date = CURRENT_DATE THEN public.user_gamification.current_streak_days
          WHEN public.user_gamification.last_activity_date = CURRENT_DATE - 1 THEN public.user_gamification.current_streak_days + 1
          ELSE 1
        END,
        longest_streak_days = GREATEST(
          public.user_gamification.longest_streak_days,
          CASE
            WHEN public.user_gamification.last_activity_date = CURRENT_DATE THEN public.user_gamification.current_streak_days
            WHEN public.user_gamification.last_activity_date = CURRENT_DATE - 1 THEN public.user_gamification.current_streak_days + 1
            ELSE 1
          END
        ),
        last_activity_date = CURRENT_DATE
  RETURNING total_xp, current_level INTO v_new_xp, v_new_level;

  RETURN jsonb_build_object(
    'awarded', true,
    'total_xp', v_new_xp,
    'current_level', v_new_level
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_close_cohort_gradebook(
  p_cohort_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weight_sum numeric(6,2);
  v_course record;
  v_enr record;
  v_total_sessions integer;
  v_att_score numeric(10,2);
  v_att_pct numeric(5,2);
  v_final_grade numeric(5,2);
  v_closed_count integer := 0;
BEGIN
  IF NOT public.is_admin_or_coordinator() THEN
    RAISE EXCEPTION 'Se requiere rol coordinator o super_admin para cerrar el acta.';
  END IF;

  SELECT COALESCE(sum(weight_pct), 0) INTO v_weight_sum
  FROM public.evaluation_items
  WHERE cohort_id = p_cohort_id;

  IF v_weight_sum <> 100.00 THEN
    RAISE EXCEPTION 'La suma de pesos de evaluación debe ser exactamente 100.00 (actual: %)', v_weight_sum;
  END IF;

  SELECT cr.min_passing_grade, cr.min_attendance_pct
  INTO v_course
  FROM public.cohorts c
  JOIN public.courses cr ON cr.id = c.course_id
  WHERE c.id = p_cohort_id;

  SELECT count(*) INTO v_total_sessions
  FROM public.class_sessions
  WHERE cohort_id = p_cohort_id;

  FOR v_enr IN
    SELECT id, student_id FROM public.enrollments
    WHERE cohort_id = p_cohort_id AND status = 'active'
  LOOP
    SELECT COALESCE(sum((COALESCE(s.score, 0) / NULLIF(ei.max_score, 0)) * ei.weight_pct), 0)
    INTO v_final_grade
    FROM public.evaluation_items ei
    LEFT JOIN public.submissions s
      ON s.evaluation_item_id = ei.id AND s.student_id = v_enr.student_id
    WHERE ei.cohort_id = p_cohort_id;

    IF v_total_sessions > 0 THEN
      SELECT COALESCE(sum(
        CASE ar.status
          WHEN 'present' THEN 1.0
          WHEN 'excused' THEN 1.0
          WHEN 'late' THEN 0.5
          ELSE 0.0
        END
      ), 0)
      INTO v_att_score
      FROM public.attendance_records ar
      JOIN public.class_sessions cs ON cs.id = ar.session_id
      WHERE cs.cohort_id = p_cohort_id AND ar.student_id = v_enr.student_id;

      v_att_pct := round((v_att_score / v_total_sessions) * 100.0, 2);
    ELSE
      v_att_pct := 100.00;
    END IF;

    UPDATE public.enrollments
    SET final_grade = round(v_final_grade, 2),
        attendance_pct = v_att_pct,
        status = CASE
          WHEN round(v_final_grade, 2) >= v_course.min_passing_grade
           AND v_att_pct >= v_course.min_attendance_pct THEN 'completed'
          ELSE 'failed'
        END
    WHERE id = v_enr.id;

    v_closed_count := v_closed_count + 1;
  END LOOP;

  UPDATE public.cohorts
  SET status = 'closed'
  WHERE id = p_cohort_id;

  INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, details)
  VALUES (
    auth.uid(),
    'COHORT_GRADEBOOK_CLOSED',
    'cohorts',
    p_cohort_id::text,
    jsonb_build_object('enrollments_processed', v_closed_count)
  );

  RETURN jsonb_build_object(
    'cohort_id', p_cohort_id,
    'status', 'closed',
    'enrollments_processed', v_closed_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_issue_certificate_on_completion(
  p_enrollment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enr record;
  v_existing record;
  v_code text;
  v_hash text;
  v_cert_id uuid;
BEGIN
  SELECT
    e.id,
    e.student_id,
    e.cohort_id,
    e.status AS enrollment_status,
    e.final_grade,
    e.attendance_pct,
    o.status AS order_status,
    c.course_id,
    cr.title AS course_title,
    cr.min_passing_grade,
    cr.min_attendance_pct,
    p.full_name AS student_name
  INTO v_enr
  FROM public.enrollments e
  JOIN public.cohorts c ON c.id = e.cohort_id
  JOIN public.courses cr ON cr.id = c.course_id
  JOIN public.profiles p ON p.id = e.student_id
  LEFT JOIN public.orders o ON o.id = e.order_id
  WHERE e.id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matrícula no encontrada.';
  END IF;

  IF v_enr.enrollment_status <> 'completed'
     OR COALESCE(v_enr.final_grade, 0) < v_enr.min_passing_grade
     OR COALESCE(v_enr.attendance_pct, 0) < v_enr.min_attendance_pct
     OR COALESCE(v_enr.order_status, '') <> 'paid' THEN
    RAISE EXCEPTION 'No cumple la conjunción de certificación (nota >= %, asistencia >= %, orden pagada).',
      v_enr.min_passing_grade, v_enr.min_attendance_pct;
  END IF;

  SELECT id, verification_code, signature_hash INTO v_existing
  FROM public.certificates
  WHERE enrollment_id = p_enrollment_id
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'certificate_id', v_existing.id,
      'verification_code', v_existing.verification_code,
      'signature_hash', v_existing.signature_hash
    );
  END IF;

  v_code := 'NEX-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_hash := 'sha256:' || encode(
    digest(v_code || '|' || v_enr.student_id::text || '|' || v_enr.course_id::text || '|' || now()::text, 'sha256'),
    'hex'
  );

  INSERT INTO public.certificates (
    student_id,
    course_id,
    enrollment_id,
    verification_code,
    signature_hash,
    student_name_snapshot,
    course_title_snapshot,
    final_grade,
    attendance_pct
  ) VALUES (
    v_enr.student_id,
    v_enr.course_id,
    p_enrollment_id,
    v_code,
    v_hash,
    v_enr.student_name,
    v_enr.course_title,
    v_enr.final_grade,
    v_enr.attendance_pct
  )
  RETURNING id INTO v_cert_id;

  RETURN jsonb_build_object(
    'certificate_id', v_cert_id,
    'verification_code', v_code,
    'signature_hash', v_hash
  );
END;
$$;
