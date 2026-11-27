-- =============================================================================
-- NEXUS PLATFORM — FASE 5: MOTOR ERP ACADÉMICO (ASISTENCIA, EVALUACIONES, GRADEBOOK Y ACTAS - NIVEL 3)
-- Gobernado por: nexus-supabase-dba, nexus-academic-erp-engine, nexus-deductive-verification
-- =============================================================================

-- 1. TIPOS ENUMERADOS DE NIVEL 3 (ERP ACADÉMICO)
DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('present', 'late', 'absent', 'excused');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.evaluation_type AS ENUM ('exam', 'quiz', 'assignment', 'project', 'participation');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.rectification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABLA: public.class_sessions (Calendario de Sesiones Sincrónicas / Presenciales por Cohorte)
CREATE TABLE IF NOT EXISTS public.class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  session_number int NOT NULL,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  meeting_or_room_url text,
  is_attendance_taken boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_cohort_session_number UNIQUE (cohort_id, session_number),
  CONSTRAINT chk_session_number_positive CHECK (session_number > 0),
  CONSTRAINT chk_session_times CHECK (ends_at > starts_at)
);

CREATE TRIGGER trg_class_sessions_updated_at
  BEFORE UPDATE ON public.class_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. TABLA: public.attendance_records (Control de Asistencia por Sesión y Matrícula)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_session_enrollment_attendance UNIQUE (session_id, enrollment_id)
);

CREATE TRIGGER trg_attendance_records_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. TABLA: public.attendance_justifications (Solicitudes de Justificación de Inasistencia)
CREATE TABLE IF NOT EXISTS public.attendance_justifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id uuid NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  evidence_file_url text,
  status public.rectification_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_attendance_justifications_updated_at
  BEFORE UPDATE ON public.attendance_justifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. TABLA: public.evaluation_items (Rubros Ponderados del Libro de Calificaciones - Suma = 100%)
CREATE TABLE IF NOT EXISTS public.evaluation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  title text NOT NULL,
  type public.evaluation_type NOT NULL DEFAULT 'exam',
  weight_pct numeric(5,2) NOT NULL,
  due_date timestamptz NOT NULL,
  allow_late_submission boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_evaluation_weight_range CHECK (weight_pct > 0 AND weight_pct <= 100)
);

CREATE TRIGGER trg_evaluation_items_updated_at
  BEFORE UPDATE ON public.evaluation_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. TABLA: public.submissions (Entregas de Estudiantes y Calificaciones Docentes 0-100)
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluation_items(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  file_url text,
  submission_text text,
  score numeric(5,2),
  instructor_feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  graded_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_evaluation_enrollment_submission UNIQUE (evaluation_id, enrollment_id),
  CONSTRAINT chk_submission_score_range CHECK (score IS NULL OR (score BETWEEN 0 AND 100))
);

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. TABLA: public.grade_rectifications (Auditoría de Rectificación de Notas en Actas Cerradas)
CREATE TABLE IF NOT EXISTS public.grade_rectifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE RESTRICT,
  requested_by_instructor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  previous_score numeric(5,2) NOT NULL,
  new_score numeric(5,2) NOT NULL,
  justification_reason text NOT NULL,
  evidence_url text,
  status public.rectification_status NOT NULL DEFAULT 'pending',
  approved_by_coordinator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_rectification_scores CHECK (
    (previous_score BETWEEN 0 AND 100)
    AND (new_score BETWEEN 0 AND 100)
    AND (previous_score <> new_score)
  )
);

CREATE TRIGGER trg_grade_rectifications_updated_at
  BEFORE UPDATE ON public.grade_rectifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. TABLA: public.lesson_progress (Avance de Lecciones Asincrónicas por Matrícula)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed boolean NOT NULL DEFAULT false,
  watched_seconds int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_enrollment_lesson_progress UNIQUE (enrollment_id, lesson_id),
  CONSTRAINT chk_watched_seconds_nonnegative CHECK (watched_seconds >= 0)
);

CREATE TRIGGER trg_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 9. TRIGGER DE INMUTABILIDAD DE ACTAS CERRADAS (REGLA INQUEBRANTABLE #4)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_closed_cohort_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_cohort_status public.cohort_status;
BEGIN
  IF TG_TABLE_NAME = 'evaluation_items' THEN
    SELECT status INTO v_cohort_status FROM public.cohorts WHERE id = COALESCE(NEW.cohort_id, OLD.cohort_id);
  ELSIF TG_TABLE_NAME = 'submissions' THEN
    SELECT c.status INTO v_cohort_status
    FROM public.evaluation_items ei
    JOIN public.cohorts c ON c.id = ei.cohort_id
    WHERE ei.id = COALESCE(NEW.evaluation_id, OLD.evaluation_id);
  ELSIF TG_TABLE_NAME = 'attendance_records' THEN
    SELECT c.status INTO v_cohort_status
    FROM public.class_sessions cs
    JOIN public.cohorts c ON c.id = cs.cohort_id
    WHERE cs.id = COALESCE(NEW.session_id, OLD.session_id);
  END IF;

  IF v_cohort_status = 'closed' THEN
    RAISE EXCEPTION 'ACTA_CLOSED_IMMUTABLE: La cohorte tiene el acta cerrada. Todo cambio requiere una solicitud en grade_rectifications aprobada por Coordinación.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_immutable_evaluation_items_on_closed
  BEFORE INSERT OR UPDATE OR DELETE ON public.evaluation_items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_closed_cohort_immutability();

CREATE TRIGGER trg_immutable_submissions_on_closed
  BEFORE INSERT OR UPDATE OR DELETE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_closed_cohort_immutability();

CREATE TRIGGER trg_immutable_attendance_on_closed
  BEFORE INSERT OR UPDATE OR DELETE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_closed_cohort_immutability();

-- =============================================================================
-- 10. FUNCIÓN RPC DE AUDITORÍA DE PESOS Y ESTADO DEL LIBRO DE CALIFICACIONES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_get_cohort_erp_audit(p_cohort_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_total_weight numeric(5,2);
  v_items_count int;
  v_sessions_count int;
  v_cohort_status public.cohort_status;
BEGIN
  SELECT status INTO v_cohort_status FROM public.cohorts WHERE id = p_cohort_id;

  SELECT COUNT(*), COALESCE(SUM(weight_pct), 0.00)
  INTO v_items_count, v_total_weight
  FROM public.evaluation_items
  WHERE cohort_id = p_cohort_id;

  SELECT COUNT(*)
  INTO v_sessions_count
  FROM public.class_sessions
  WHERE cohort_id = p_cohort_id;

  RETURN jsonb_build_object(
    'cohort_id', p_cohort_id,
    'cohort_status', v_cohort_status,
    'evaluation_items_count', v_items_count,
    'total_weight_pct', v_total_weight,
    'is_weight_invariant_valid', (v_total_weight = 100.00),
    'scheduled_sessions_count', v_sessions_count,
    'can_close_acta', (v_total_weight = 100.00 AND v_sessions_count > 0 AND v_cohort_status IN ('active', 'grading'))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_get_cohort_erp_audit(uuid) TO anon, authenticated;

-- =============================================================================
-- 11. INDEXACIÓN AVANZADA DE NIVEL 3 (TODAS LAS CLAVES FORÁNEAS Y CONSULTAS ERP)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_class_sessions_cohort_number
  ON public.class_sessions (cohort_id, session_number ASC)
  INCLUDE (title, starts_at, is_attendance_taken);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session
  ON public.attendance_records (session_id)
  INCLUDE (enrollment_id, status);

CREATE INDEX IF NOT EXISTS idx_attendance_records_enrollment
  ON public.attendance_records (enrollment_id)
  INCLUDE (session_id, status);

CREATE INDEX IF NOT EXISTS idx_attendance_records_recorded_by
  ON public.attendance_records (recorded_by)
  WHERE recorded_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_justifications_record
  ON public.attendance_justifications (attendance_record_id);

CREATE INDEX IF NOT EXISTS idx_attendance_justifications_requested_by
  ON public.attendance_justifications (requested_by);

CREATE INDEX IF NOT EXISTS idx_attendance_justifications_reviewed_by
  ON public.attendance_justifications (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_justifications_pending
  ON public.attendance_justifications (created_at ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_evaluation_items_cohort_order
  ON public.evaluation_items (cohort_id, sort_order ASC)
  INCLUDE (title, type, weight_pct, due_date);

CREATE INDEX IF NOT EXISTS idx_submissions_evaluation
  ON public.submissions (evaluation_id)
  INCLUDE (enrollment_id, score, graded_at);

CREATE INDEX IF NOT EXISTS idx_submissions_enrollment
  ON public.submissions (enrollment_id)
  INCLUDE (evaluation_id, score);

CREATE INDEX IF NOT EXISTS idx_submissions_graded_by
  ON public.submissions (graded_by)
  WHERE graded_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grade_rectifications_submission
  ON public.grade_rectifications (submission_id);

CREATE INDEX IF NOT EXISTS idx_grade_rectifications_instructor
  ON public.grade_rectifications (requested_by_instructor_id);

CREATE INDEX IF NOT EXISTS idx_grade_rectifications_coordinator
  ON public.grade_rectifications (approved_by_coordinator_id)
  WHERE approved_by_coordinator_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grade_rectifications_pending
  ON public.grade_rectifications (created_at ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment
  ON public.lesson_progress (enrollment_id)
  INCLUDE (lesson_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson
  ON public.lesson_progress (lesson_id);

-- =============================================================================
-- 12. POLÍTICAS ROW LEVEL SECURITY (SIN DUPLICIDAD DE SELECT - ADVISOR 0006)
-- =============================================================================

ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_justifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_rectifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- 12.1 Políticas para public.class_sessions
CREATE POLICY "class_sessions_select_all"
  ON public.class_sessions FOR SELECT
  USING (true);

CREATE POLICY "class_sessions_insert_staff_or_instructor"
  ON public.class_sessions FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()) OR (SELECT public.is_cohort_instructor(cohort_id)));

CREATE POLICY "class_sessions_update_staff_or_instructor"
  ON public.class_sessions FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()) OR (SELECT public.is_cohort_instructor(cohort_id)))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()) OR (SELECT public.is_cohort_instructor(cohort_id)));

CREATE POLICY "class_sessions_delete_staff"
  ON public.class_sessions FOR DELETE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()));

-- 12.2 Políticas para public.evaluation_items
CREATE POLICY "evaluation_items_select_all"
  ON public.evaluation_items FOR SELECT
  USING (true);

CREATE POLICY "evaluation_items_insert_staff_or_instructor"
  ON public.evaluation_items FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()) OR (SELECT public.is_cohort_instructor(cohort_id)));

CREATE POLICY "evaluation_items_update_staff_or_instructor"
  ON public.evaluation_items FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()) OR (SELECT public.is_cohort_instructor(cohort_id)))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()) OR (SELECT public.is_cohort_instructor(cohort_id)));

CREATE POLICY "evaluation_items_delete_staff"
  ON public.evaluation_items FOR DELETE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()));

-- 12.3 Políticas para public.attendance_records
CREATE POLICY "attendance_records_select_authenticated"
  ON public.attendance_records FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND (
          e.student_id = (SELECT auth.uid())
          OR (SELECT public.is_cohort_instructor(e.cohort_id))
          OR (SELECT public.is_admin_or_coordinator())
        )
    )
  );

CREATE POLICY "attendance_records_insert_instructor_or_staff"
  ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND ((SELECT public.is_cohort_instructor(e.cohort_id)) OR (SELECT public.is_admin_or_coordinator()))
    )
  );

CREATE POLICY "attendance_records_update_instructor_or_staff"
  ON public.attendance_records FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND ((SELECT public.is_cohort_instructor(e.cohort_id)) OR (SELECT public.is_admin_or_coordinator()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND ((SELECT public.is_cohort_instructor(e.cohort_id)) OR (SELECT public.is_admin_or_coordinator()))
    )
  );

-- 12.4 Políticas para public.attendance_justifications
CREATE POLICY "attendance_justifications_select_own_or_staff"
  ON public.attendance_justifications FOR SELECT TO authenticated
  USING (requested_by = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()));

CREATE POLICY "attendance_justifications_insert_own"
  ON public.attendance_justifications FOR INSERT TO authenticated
  WITH CHECK (requested_by = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()));

CREATE POLICY "attendance_justifications_update_staff"
  ON public.attendance_justifications FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

-- 12.5 Políticas para public.submissions
CREATE POLICY "submissions_select_own_instructor_or_staff"
  ON public.submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND (
          e.student_id = (SELECT auth.uid())
          OR (SELECT public.is_cohort_instructor(e.cohort_id))
          OR (SELECT public.is_admin_or_coordinator())
        )
    )
  );

CREATE POLICY "submissions_insert_own_or_staff"
  ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND (e.student_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()))
    )
  );

CREATE POLICY "submissions_update_instructor_or_staff"
  ON public.submissions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND ((SELECT public.is_cohort_instructor(e.cohort_id)) OR (SELECT public.is_admin_or_coordinator()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND ((SELECT public.is_cohort_instructor(e.cohort_id)) OR (SELECT public.is_admin_or_coordinator()))
    )
  );

-- 12.6 Políticas para public.grade_rectifications
CREATE POLICY "grade_rectifications_select_instructor_or_staff"
  ON public.grade_rectifications FOR SELECT TO authenticated
  USING (
    requested_by_instructor_id = (SELECT auth.uid())
    OR (SELECT public.is_admin_or_coordinator())
  );

CREATE POLICY "grade_rectifications_insert_instructor_or_staff"
  ON public.grade_rectifications FOR INSERT TO authenticated
  WITH CHECK (
    requested_by_instructor_id = (SELECT auth.uid())
    OR (SELECT public.is_admin_or_coordinator())
  );

CREATE POLICY "grade_rectifications_update_staff"
  ON public.grade_rectifications FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

-- 12.7 Políticas para public.lesson_progress
CREATE POLICY "lesson_progress_select_own_or_staff"
  ON public.lesson_progress FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND (e.student_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()))
    )
  );

CREATE POLICY "lesson_progress_insert_own"
  ON public.lesson_progress FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND e.student_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "lesson_progress_update_own"
  ON public.lesson_progress FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND e.student_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND e.student_id = (SELECT auth.uid())
    )
  );
