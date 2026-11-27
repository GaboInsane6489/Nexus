-- =============================================================================
-- NEXUS PLATFORM — FASE 4: MOTOR COMERCIAL, COHORTES, TESORERÍA Y MATRÍCULAS (NIVEL 2)
-- Gobernado por: nexus-supabase-dba, nexus-academic-erp-engine, nexus-deductive-verification
-- =============================================================================

-- 1. TIPOS ENUMERADOS DE NIVEL 2 (COMERCIO, COHORTES Y MATRÍCULAS)
DO $$ BEGIN
  CREATE TYPE public.cohort_status AS ENUM ('upcoming', 'active', 'grading', 'closed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'under_review', 'paid', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('stripe', 'mercadopago', 'bank_transfer', 'scholarship');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_item_type AS ENUM ('single_course', 'learning_path', 'retake_fee');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'failed_grade', 'failed_attendance', 'dropped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.risk_level AS ENUM ('normal', 'warning', 'critical_dropout_risk');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABLA: public.cohorts (Instancias Académicas de un Curso en un Período)
CREATE TABLE IF NOT EXISTS public.cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  academic_term_id uuid NOT NULL REFERENCES public.academic_terms(id) ON DELETE RESTRICT,
  instructor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  schedule_label text NOT NULL DEFAULT 'Mar & Jue 19:00 - 21:00 (GMT-4)',
  max_students int NOT NULL DEFAULT 25,
  enrolled_count int NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status public.cohort_status NOT NULL DEFAULT 'upcoming',
  closed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_cohorts_capacity CHECK (enrolled_count >= 0 AND enrolled_count <= max_students AND max_students > 0),
  CONSTRAINT chk_cohorts_dates CHECK (end_date >= start_date)
);

CREATE TRIGGER trg_cohorts_updated_at
  BEFORE UPDATE ON public.cohorts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. TABLA: public.coupons (Cupones Comerciales y Becas Académicas)
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text NOT NULL,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0.00,
  max_uses int NOT NULL DEFAULT 100,
  current_uses int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_coupons_discount CHECK (discount_pct > 0 AND discount_pct <= 100),
  CONSTRAINT chk_coupons_uses CHECK (current_uses >= 0 AND current_uses <= max_uses)
);

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. TABLA: public.orders (Órdenes de Compra de Pago Único y Tesorería)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  subtotal_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  total_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  currency text NOT NULL DEFAULT 'USD',
  method public.payment_method NOT NULL DEFAULT 'stripe',
  payment_status public.order_status NOT NULL DEFAULT 'pending',
  provider_reference text,
  receipt_file_url text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_orders_amounts CHECK (subtotal_amount >= 0 AND discount_amount >= 0 AND total_amount >= 0)
);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. TABLA: public.order_items (Detalle de Líneas de Orden: Curso Individual o Ruta Completa)
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type public.order_item_type NOT NULL DEFAULT 'single_course',
  course_id uuid REFERENCES public.courses(id) ON DELETE RESTRICT,
  learning_path_id uuid REFERENCES public.learning_paths(id) ON DELETE RESTRICT,
  target_cohort_id uuid REFERENCES public.cohorts(id) ON DELETE RESTRICT,
  unit_price numeric(10,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_order_items_price CHECK (unit_price >= 0)
);

-- 6. TABLA: public.enrollments (Matrícula Académica Activa del Estudiante en una Cohorte)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE RESTRICT,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status public.enrollment_status NOT NULL DEFAULT 'active',
  final_grade numeric(5,2) NOT NULL DEFAULT 0.00,
  attendance_pct numeric(5,2) NOT NULL DEFAULT 100.00,
  academic_risk_level public.risk_level NOT NULL DEFAULT 'normal',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_enrollment_student_cohort UNIQUE (student_id, cohort_id),
  CONSTRAINT chk_enrollment_grade CHECK (final_grade BETWEEN 0 AND 100),
  CONSTRAINT chk_enrollment_attendance CHECK (attendance_pct BETWEEN 0 AND 100)
);

CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. TABLA: public.path_entitlements (Créditos Desbloqueables al Comprar una Ruta Completa)
CREATE TABLE IF NOT EXISTS public.path_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  learning_path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  is_consumed boolean NOT NULL DEFAULT false,
  consumed_enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_student_path_course_entitlement UNIQUE (student_id, learning_path_id, course_id)
);

CREATE TRIGGER trg_path_entitlements_updated_at
  BEFORE UPDATE ON public.path_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 8. INDEXACIÓN AVANZADA DE NIVEL 2 (FKs, PARCIALES Y CUBRIENTES)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_cohorts_course_term_status
  ON public.cohorts (course_id, academic_term_id, status)
  INCLUDE (max_students, enrolled_count, start_date);

CREATE INDEX IF NOT EXISTS idx_cohorts_academic_term
  ON public.cohorts (academic_term_id);

CREATE INDEX IF NOT EXISTS idx_cohorts_instructor
  ON public.cohorts (instructor_id)
  WHERE instructor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cohorts_closed_by
  ON public.cohorts (closed_by)
  WHERE closed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_coupons_active_code
  ON public.coupons (code)
  INCLUDE (discount_pct, max_uses, current_uses, valid_until)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_orders_student_created
  ON public.orders (student_id, created_at DESC)
  INCLUDE (payment_status, total_amount, method);

CREATE INDEX IF NOT EXISTS idx_orders_coupon
  ON public.orders (coupon_id)
  WHERE coupon_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_reviewed_by
  ON public.orders (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_pending_review
  ON public.orders (created_at ASC)
  WHERE payment_status = 'under_review';

CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON public.order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_course
  ON public.order_items (course_id)
  WHERE course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_path
  ON public.order_items (learning_path_id)
  WHERE learning_path_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_cohort
  ON public.order_items (target_cohort_id)
  WHERE target_cohort_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_student_status
  ON public.enrollments (student_id, status)
  INCLUDE (cohort_id, final_grade, attendance_pct, academic_risk_level);

CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_status
  ON public.enrollments (cohort_id, status)
  INCLUDE (student_id, final_grade, attendance_pct);

CREATE INDEX IF NOT EXISTS idx_enrollments_order
  ON public.enrollments (order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_path_entitlements_student_unconsumed
  ON public.path_entitlements (student_id, course_id)
  WHERE is_consumed = false;

CREATE INDEX IF NOT EXISTS idx_path_entitlements_order
  ON public.path_entitlements (order_id);

CREATE INDEX IF NOT EXISTS idx_path_entitlements_path
  ON public.path_entitlements (learning_path_id);

CREATE INDEX IF NOT EXISTS idx_path_entitlements_course
  ON public.path_entitlements (course_id);

CREATE INDEX IF NOT EXISTS idx_path_entitlements_enrollment
  ON public.path_entitlements (consumed_enrollment_id)
  WHERE consumed_enrollment_id IS NOT NULL;

-- =============================================================================
-- 9. FUNCIONES HELPER DE VERIFICACIÓN DE COHORTE Y ELEGIBILIDAD DAG
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_cohort_instructor(target_cohort_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cohorts c
    WHERE c.id = target_cohort_id
      AND c.instructor_id = (SELECT auth.uid())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_cohort_instructor(uuid) TO anon, authenticated;

-- Valida en PostgreSQL si un estudiante cumple prerrequisitos DAG y si la cohorte tiene cupo
CREATE OR REPLACE FUNCTION public.fn_check_cohort_enrollment_eligibility(
  p_student_id uuid,
  p_cohort_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_cohort record;
  v_missing_prereqs jsonb;
BEGIN
  SELECT id, code, course_id, max_students, enrolled_count, status
  INTO v_cohort
  FROM public.cohorts
  WHERE id = p_cohort_id;

  IF v_cohort.id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'COHORT_NOT_FOUND');
  END IF;

  IF v_cohort.status NOT IN ('upcoming', 'active') THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'COHORT_CLOSED');
  END IF;

  IF v_cohort.enrolled_count >= v_cohort.max_students THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'COHORT_FULL');
  END IF;

  -- Si hay un student_id autenticado, verifica sus prerrequisitos DAG aprobados
  IF p_student_id IS NOT NULL THEN
    SELECT jsonb_agg(jsonb_build_object('code', req_c.code, 'title', req_c.title, 'min_grade', cp.min_grade_required))
    INTO v_missing_prereqs
    FROM public.course_prerequisites cp
    JOIN public.courses req_c ON req_c.id = cp.required_course_id
    WHERE cp.course_id = v_cohort.course_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.enrollments e
        JOIN public.cohorts prev_coh ON prev_coh.id = e.cohort_id
        WHERE e.student_id = p_student_id
          AND prev_coh.course_id = cp.required_course_id
          AND e.status = 'completed'
          AND e.final_grade >= cp.min_grade_required
      );

    IF v_missing_prereqs IS NOT NULL AND jsonb_array_length(v_missing_prereqs) > 0 THEN
      RETURN jsonb_build_object(
        'eligible', false,
        'reason', 'PREREQUISITES_MISSING',
        'missing_prerequisites', v_missing_prereqs
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'eligible', true,
    'reason', 'OK',
    'available_seats', (v_cohort.max_students - v_cohort.enrolled_count)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_check_cohort_enrollment_eligibility(uuid, uuid) TO anon, authenticated;

-- =============================================================================
-- 10. POLÍTICAS ROW LEVEL SECURITY (SIN DUPLICIDAD DE SELECT - ADVISOR 0006)
-- =============================================================================

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_entitlements ENABLE ROW LEVEL SECURITY;

-- 10.1 Políticas para public.cohorts
CREATE POLICY "cohorts_select_all"
  ON public.cohorts FOR SELECT
  USING (true);

CREATE POLICY "cohorts_insert_staff"
  ON public.cohorts FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "cohorts_update_staff"
  ON public.cohorts FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "cohorts_delete_admin"
  ON public.cohorts FOR DELETE TO authenticated
  USING ((SELECT public.is_super_admin()));

-- 10.2 Políticas para public.coupons
CREATE POLICY "coupons_select_active_or_staff"
  ON public.coupons FOR SELECT
  USING (is_active = true OR (SELECT public.is_admin_or_coordinator()));

CREATE POLICY "coupons_insert_staff"
  ON public.coupons FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "coupons_update_staff"
  ON public.coupons FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "coupons_delete_admin"
  ON public.coupons FOR DELETE TO authenticated
  USING ((SELECT public.is_super_admin()));

-- 10.3 Políticas para public.orders
CREATE POLICY "orders_select_own_or_staff"
  ON public.orders FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()));

CREATE POLICY "orders_insert_own_or_staff"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()));

CREATE POLICY "orders_update_staff"
  ON public.orders FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

-- 10.4 Políticas para public.order_items
CREATE POLICY "order_items_select_own_or_staff"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.student_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()))
    )
  );

CREATE POLICY "order_items_insert_own_or_staff"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.student_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()))
    )
  );

-- 10.5 Políticas para public.enrollments
CREATE POLICY "enrollments_select_own_instructor_or_staff"
  ON public.enrollments FOR SELECT TO authenticated
  USING (
    student_id = (SELECT auth.uid())
    OR (SELECT public.is_cohort_instructor(cohort_id))
    OR (SELECT public.is_admin_or_coordinator())
  );

CREATE POLICY "enrollments_insert_staff"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "enrollments_update_staff"
  ON public.enrollments FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

-- 10.6 Políticas para public.path_entitlements
CREATE POLICY "path_entitlements_select_own_or_staff"
  ON public.path_entitlements FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()));

CREATE POLICY "path_entitlements_insert_staff"
  ON public.path_entitlements FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "path_entitlements_update_staff"
  ON public.path_entitlements FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));
