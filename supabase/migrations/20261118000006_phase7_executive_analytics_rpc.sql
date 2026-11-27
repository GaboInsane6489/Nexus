-- =============================================================================
-- NEXUS PLATFORM — FASE 7: MOTOR DE ANALÍTICA EJECUTIVA Y TELEMETRÍA EN TIEMPO REAL (NIVEL 4)
-- Gobernado por: nexus-supabase-dba, nexus-architecture-guard, nexus-deductive-verification
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_get_executive_analytics_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_paths_count int;
  v_courses_count int;
  v_dag_edges_count int;
  v_lessons_count int;
  v_cohorts_count int;
  v_total_capacity int;
  v_total_enrolled int;
  v_occupancy_pct numeric(5,2);
  v_sessions_count int;
  v_eval_items_count int;
  v_badges_count int;
  v_certs_valid int;
  v_certs_revoked int;
  v_potential_revenue numeric(12,2);
BEGIN
  SELECT COUNT(*) INTO v_paths_count FROM public.learning_paths WHERE is_published = true;
  SELECT COUNT(*) INTO v_courses_count FROM public.courses WHERE is_published = true;
  SELECT COUNT(*) INTO v_dag_edges_count FROM public.course_prerequisites;
  SELECT COUNT(*) INTO v_lessons_count FROM public.lessons;

  SELECT
    COUNT(*),
    COALESCE(SUM(max_students), 0),
    COALESCE(SUM(enrolled_count), 0)
  INTO v_cohorts_count, v_total_capacity, v_total_enrolled
  FROM public.cohorts;

  IF v_total_capacity > 0 THEN
    v_occupancy_pct := round((v_total_enrolled::numeric / v_total_capacity::numeric) * 100.0, 2);
  ELSE
    v_occupancy_pct := 0.00;
  END IF;

  SELECT
    COALESCE(SUM(coh.enrolled_count * crs.price_individual), 0.00)
  INTO v_potential_revenue
  FROM public.cohorts coh
  JOIN public.courses crs ON crs.id = coh.course_id;

  SELECT COUNT(*) INTO v_sessions_count FROM public.class_sessions;
  SELECT COUNT(*) INTO v_eval_items_count FROM public.evaluation_items;
  SELECT COUNT(*) INTO v_badges_count FROM public.badges;

  SELECT
    COUNT(*) FILTER (WHERE is_revoked = false),
    COUNT(*) FILTER (WHERE is_revoked = true)
  INTO v_certs_valid, v_certs_revoked
  FROM public.certificates;

  RETURN jsonb_build_object(
    'curricular', jsonb_build_object(
      'published_paths', v_paths_count,
      'published_courses', v_courses_count,
      'dag_prerequisite_edges', v_dag_edges_count,
      'active_lessons', v_lessons_count
    ),
    'commercial_and_cohorts', jsonb_build_object(
      'open_cohorts', v_cohorts_count,
      'total_seats_capacity', v_total_capacity,
      'total_seats_enrolled', v_total_enrolled,
      'global_occupancy_pct', v_occupancy_pct,
      'estimated_cohort_tuition_usd', v_potential_revenue
    ),
    'academic_erp', jsonb_build_object(
      'scheduled_sessions', v_sessions_count,
      'weighted_evaluation_items', v_eval_items_count
    ),
    'gamification_and_certs', jsonb_build_object(
      'catalog_badges', v_badges_count,
      'valid_certificates_sha256', v_certs_valid,
      'revoked_certificates', v_certs_revoked
    ),
    'generated_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_get_executive_analytics_snapshot() TO anon, authenticated;
