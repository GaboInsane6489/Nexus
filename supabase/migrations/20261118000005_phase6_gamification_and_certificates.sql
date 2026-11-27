-- =============================================================================
-- NEXUS PLATFORM — FASE 6: MOTOR DE GAMIFICACIÓN ANTI-FARMING Y CERTIFICADOS SHA-256 (NIVEL 4)
-- Gobernado por: nexus-supabase-dba, nexus-gamification-certs, nexus-deductive-verification
-- =============================================================================

-- 1. FUNCIÓN MATEMÁTICA DE CURVA PROGRESIVA DE NIVELES POR XP
-- Fórmula: XP_requerido(L) = FLOOR(100 * (L - 1)^1.5)
CREATE OR REPLACE FUNCTION public.fn_calculate_level_from_xp(p_total_xp int)
RETURNS int
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_level int := 1;
BEGIN
  IF p_total_xp IS NULL OR p_total_xp < 100 THEN
    RETURN 1;
  END IF;

  WHILE floor(100.0 * power(v_level::numeric, 1.5)) <= p_total_xp LOOP
    v_level := v_level + 1;
    EXIT WHEN v_level >= 100;
  END LOOP;

  RETURN v_level;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_calculate_level_from_xp(int) TO anon, authenticated;

-- 2. TABLA: public.user_gamification (Estado de XP, Nivel, Racha Diaria y Protectores)
CREATE TABLE IF NOT EXISTS public.user_gamification (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp int NOT NULL DEFAULT 0,
  current_level int NOT NULL DEFAULT 1,
  current_streak_days int NOT NULL DEFAULT 0,
  longest_streak_days int NOT NULL DEFAULT 0,
  streak_freezes_available int NOT NULL DEFAULT 1,
  last_activity_date date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_gamification_xp_nonnegative CHECK (total_xp >= 0),
  CONSTRAINT chk_gamification_level_positive CHECK (current_level >= 1),
  CONSTRAINT chk_gamification_streaks CHECK (
    current_streak_days >= 0
    AND longest_streak_days >= current_streak_days
    AND streak_freezes_available >= 0
  )
);

CREATE TRIGGER trg_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. TABLA: public.xp_ledger (Libro Contable Inmutable e Idempotente Anti-Farming - Regla #6)
CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  reference_id uuid NOT NULL,
  base_xp int NOT NULL,
  multiplier numeric(4,2) NOT NULL DEFAULT 1.00,
  final_xp_awarded int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_xp_ledger_idempotent UNIQUE (user_id, event_type, reference_id),
  CONSTRAINT chk_xp_ledger_positive CHECK (base_xp > 0 AND multiplier >= 1.00 AND final_xp_awarded > 0)
);

-- 4. TABLA: public.badges (Catálogo Oficial de Insignias de Mérito Académico)
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon_key text NOT NULL DEFAULT 'award',
  xp_bonus int NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_badges_xp_bonus CHECK (xp_bonus >= 0)
);

-- 5. TABLA: public.user_badges (Insignias Desbloqueadas por Estudiante)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE RESTRICT,
  cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

-- 6. TABLA: public.certificates (Certificados Verificables con Snapshot Inmutable y Firma SHA-256)
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_code text UNIQUE NOT NULL,
  enrollment_id uuid UNIQUE REFERENCES public.enrollments(id) ON DELETE RESTRICT,
  student_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_full_name_snapshot text NOT NULL,
  student_document_snapshot text NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  course_code_snapshot text NOT NULL,
  course_title_snapshot text NOT NULL,
  academic_credits_snapshot int NOT NULL DEFAULT 4,
  final_grade_snapshot numeric(5,2) NOT NULL,
  attendance_pct_snapshot numeric(5,2) NOT NULL,
  signature_hash text NOT NULL,
  pdf_storage_path text,
  is_revoked boolean NOT NULL DEFAULT false,
  revoked_reason text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_certificate_conjunction CHECK (
    final_grade_snapshot BETWEEN 0 AND 100
    AND attendance_pct_snapshot BETWEEN 0 AND 100
  )
);

-- =============================================================================
-- 7. FUNCIÓN RPC DE VERIFICACIÓN PÚBLICA DE CERTIFICADOS (/verify/[code])
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_verify_certificate_by_code(p_verification_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_cert record;
BEGIN
  SELECT
    id,
    verification_code,
    student_full_name_snapshot,
    student_document_snapshot,
    course_code_snapshot,
    course_title_snapshot,
    academic_credits_snapshot,
    final_grade_snapshot,
    attendance_pct_snapshot,
    signature_hash,
    is_revoked,
    revoked_reason,
    issued_at
  INTO v_cert
  FROM public.certificates
  WHERE verification_code = upper(trim(p_verification_code));

  IF v_cert.id IS NULL THEN
    RETURN jsonb_build_object(
      'found', false,
      'status', 'NOT_FOUND',
      'verification_code', upper(trim(p_verification_code))
    );
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'status', CASE WHEN v_cert.is_revoked THEN 'REVOKED' ELSE 'VALID' END,
    'verification_code', v_cert.verification_code,
    'student_full_name', v_cert.student_full_name_snapshot,
    'student_document', v_cert.student_document_snapshot,
    'course_code', v_cert.course_code_snapshot,
    'course_title', v_cert.course_title_snapshot,
    'academic_credits', v_cert.academic_credits_snapshot,
    'final_grade', v_cert.final_grade_snapshot,
    'attendance_pct', v_cert.attendance_pct_snapshot,
    'signature_hash', v_cert.signature_hash,
    'is_revoked', v_cert.is_revoked,
    'revoked_reason', v_cert.revoked_reason,
    'issued_at', v_cert.issued_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_verify_certificate_by_code(text) TO anon, authenticated;

-- =============================================================================
-- 8. INDEXACIÓN AVANZADA DE NIVEL 4 (RANKINGS, LEDGER Y VERIFICADOR O(log N))
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_gamification_xp_leaderboard
  ON public.user_gamification (total_xp DESC, current_level DESC)
  INCLUDE (current_streak_days);

CREATE INDEX IF NOT EXISTS idx_xp_ledger_user_created
  ON public.xp_ledger (user_id, created_at DESC)
  INCLUDE (event_type, final_xp_awarded);

CREATE INDEX IF NOT EXISTS idx_user_badges_user
  ON public.user_badges (user_id, awarded_at DESC)
  INCLUDE (badge_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_badge
  ON public.user_badges (badge_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_cohort
  ON public.user_badges (cohort_id)
  WHERE cohort_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_certificates_verification_lookup
  ON public.certificates (verification_code)
  INCLUDE (
    student_full_name_snapshot,
    course_code_snapshot,
    course_title_snapshot,
    final_grade_snapshot,
    attendance_pct_snapshot,
    signature_hash,
    is_revoked,
    issued_at
  );

CREATE INDEX IF NOT EXISTS idx_certificates_student
  ON public.certificates (student_id, issued_at DESC)
  WHERE student_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_certificates_course
  ON public.certificates (course_id);

-- =============================================================================
-- 9. POLÍTICAS ROW LEVEL SECURITY (SIN DUPLICIDAD DE SELECT - ADVISOR 0006)
-- =============================================================================

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 9.1 Políticas para public.badges
CREATE POLICY "badges_select_all"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "badges_insert_staff"
  ON public.badges FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "badges_update_staff"
  ON public.badges FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "badges_delete_admin"
  ON public.badges FOR DELETE TO authenticated
  USING ((SELECT public.is_super_admin()));

-- 9.2 Políticas para public.user_gamification
CREATE POLICY "user_gamification_select_all"
  ON public.user_gamification FOR SELECT
  USING (true);

CREATE POLICY "user_gamification_insert_own_or_staff"
  ON public.user_gamification FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()));

CREATE POLICY "user_gamification_update_own_or_staff"
  ON public.user_gamification FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()));

-- 9.3 Políticas para public.xp_ledger (Libro Contable Inmutable)
CREATE POLICY "xp_ledger_select_own_or_staff"
  ON public.xp_ledger FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()));

CREATE POLICY "xp_ledger_insert_own_or_staff"
  ON public.xp_ledger FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()));

-- 9.4 Políticas para public.user_badges
CREATE POLICY "user_badges_select_all"
  ON public.user_badges FOR SELECT
  USING (true);

CREATE POLICY "user_badges_insert_staff"
  ON public.user_badges FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

-- 9.5 Políticas para public.certificates (Verificación Pública SSR + Control Admin)
CREATE POLICY "certificates_select_all"
  ON public.certificates FOR SELECT
  USING (true);

CREATE POLICY "certificates_insert_staff"
  ON public.certificates FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "certificates_update_admin_only"
  ON public.certificates FOR UPDATE TO authenticated
  USING ((SELECT public.is_super_admin()))
  WITH CHECK ((SELECT public.is_super_admin()));
