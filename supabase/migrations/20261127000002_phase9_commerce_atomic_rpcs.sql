-- Fase 3 (Operación Real): RPCs atómicas de Checkout, Matrícula y Tesorería
CREATE OR REPLACE FUNCTION public.rpc_confirm_order_and_enroll(
  p_cohort_id uuid,
  p_payment_method text,
  p_coupon_code text DEFAULT NULL,
  p_receipt_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_elig jsonb;
  v_cohort record;
  v_coupon record;
  v_subtotal numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_total numeric(10,2);
  v_order_status text;
  v_order_id uuid;
  v_enrollment_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticación requerida para matricularse.';
  END IF;

  v_elig := public.fn_check_cohort_enrollment_eligibility(v_user_id, p_cohort_id);
  IF COALESCE((v_elig->>'eligible')::boolean, false) = false THEN
    RAISE EXCEPTION 'No elegible para matrícula: %', COALESCE(v_elig->>'reason', 'ELIGIBILITY_FAILED');
  END IF;

  SELECT c.id, c.course_id, cr.price_usd, cr.title AS course_title
  INTO v_cohort
  FROM public.cohorts c
  JOIN public.courses cr ON cr.id = c.course_id
  WHERE c.id = p_cohort_id
  FOR UPDATE OF c;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cohorte no encontrada.';
  END IF;

  v_subtotal := COALESCE(v_cohort.price_usd, 0);

  IF p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE upper(code) = upper(btrim(p_coupon_code))
      AND is_active = true
      AND (valid_until IS NULL OR valid_until > now())
      AND (max_uses IS NULL OR current_uses < max_uses)
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cupón inválido, expirado o agotado.';
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_discount := round(v_subtotal * (v_coupon.discount_value / 100.0), 2);
    ELSE
      v_discount := LEAST(v_subtotal, v_coupon.discount_value);
    END IF;

    UPDATE public.coupons
    SET current_uses = current_uses + 1
    WHERE id = v_coupon.id;
  END IF;

  v_total := GREATEST(0, v_subtotal - v_discount);

  IF v_total = 0 OR p_payment_method IN ('stripe', 'mercadopago', 'free') THEN
    v_order_status := 'paid';
  ELSE
    v_order_status := 'pending_payment';
  END IF;

  INSERT INTO public.orders (
    student_id,
    coupon_id,
    subtotal_usd,
    discount_usd,
    total_usd,
    payment_method,
    status,
    receipt_url,
    paid_at
  ) VALUES (
    v_user_id,
    v_coupon.id,
    v_subtotal,
    v_discount,
    v_total,
    p_payment_method,
    v_order_status,
    p_receipt_url,
    CASE WHEN v_order_status = 'paid' THEN now() ELSE NULL END
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id,
    cohort_id,
    unit_price_usd
  ) VALUES (
    v_order_id,
    p_cohort_id,
    v_subtotal
  );

  IF v_order_status = 'paid' THEN
    INSERT INTO public.enrollments (
      student_id,
      cohort_id,
      order_id,
      status
    ) VALUES (
      v_user_id,
      p_cohort_id,
      v_order_id,
      'active'
    )
    ON CONFLICT (student_id, cohort_id) DO UPDATE
      SET status = 'active', order_id = EXCLUDED.order_id
    RETURNING id INTO v_enrollment_id;

    UPDATE public.cohorts
    SET enrolled_count = (
      SELECT count(*) FROM public.enrollments
      WHERE cohort_id = p_cohort_id AND status IN ('active', 'completed')
    )
    WHERE id = p_cohort_id;
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'enrollment_id', v_enrollment_id,
    'status', v_order_status,
    'total_usd', v_total
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_approve_pending_order(
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_item record;
BEGIN
  IF NOT public.is_admin_or_coordinator() THEN
    RAISE EXCEPTION 'Se requiere rol coordinator o super_admin para aprobar pagos.';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada.';
  END IF;

  IF v_order.status = 'paid' THEN
    RETURN jsonb_build_object('order_id', p_order_id, 'status', 'paid');
  END IF;

  UPDATE public.orders
  SET status = 'paid', paid_at = now()
  WHERE id = p_order_id;

  FOR v_item IN
    SELECT cohort_id FROM public.order_items WHERE order_id = p_order_id AND cohort_id IS NOT NULL
  LOOP
    INSERT INTO public.enrollments (student_id, cohort_id, order_id, status)
    VALUES (v_order.student_id, v_item.cohort_id, p_order_id, 'active')
    ON CONFLICT (student_id, cohort_id) DO UPDATE
      SET status = 'active', order_id = EXCLUDED.order_id;

    UPDATE public.cohorts
    SET enrolled_count = (
      SELECT count(*) FROM public.enrollments
      WHERE cohort_id = v_item.cohort_id AND status IN ('active', 'completed')
    )
    WHERE id = v_item.cohort_id;
  END LOOP;

  INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, details)
  VALUES (
    auth.uid(),
    'TREASURY_ORDER_APPROVED',
    'orders',
    p_order_id::text,
    jsonb_build_object('student_id', v_order.student_id, 'total_usd', v_order.total_usd)
  );

  RETURN jsonb_build_object('order_id', p_order_id, 'status', 'paid');
END;
$$;
