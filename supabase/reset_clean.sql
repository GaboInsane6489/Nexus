-- ============================================================================
-- NEXUS: Clean Database Reset (Eliminación de Datos Demo/Sintéticos)
-- Conserva la estructura (28+ tablas, RLS, RPCs), el catálogo base de badges
-- y los usuarios super_admin reales.
-- ============================================================================

BEGIN;

DELETE FROM public.certificates;
DELETE FROM public.user_badges;
DELETE FROM public.xp_ledger;
DELETE FROM public.user_gamification;
DELETE FROM public.lesson_progress;
DELETE FROM public.grade_rectifications;
DELETE FROM public.submissions;
DELETE FROM public.evaluation_items;
DELETE FROM public.attendance_justifications;
DELETE FROM public.attendance_records;
DELETE FROM public.class_sessions;
DELETE FROM public.path_entitlements;
DELETE FROM public.enrollments;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.cohorts;
DELETE FROM public.coupons;
DELETE FROM public.lessons;
DELETE FROM public.course_modules;
DELETE FROM public.course_prerequisites;
DELETE FROM public.learning_path_items;
DELETE FROM public.courses;
DELETE FROM public.learning_paths;
DELETE FROM public.academic_terms;

-- Eliminar cuentas de prueba si existen
DELETE FROM auth.users WHERE email = 'nexus.ui.tester.2026@gmail.com';

COMMIT;
