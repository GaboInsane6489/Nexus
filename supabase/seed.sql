-- =============================================================================
-- NEXUS PLATFORM — DATOS CURRICULARES REALES DE FASE 3 (POSTGRESQL)
-- Períodos Académicos, Rutas de Aprendizaje (DAG), Cursos, Prerrequisitos y Módulos
-- =============================================================================

-- 1. PERÍODOS ACADÉMICOS (academic_terms)
INSERT INTO public.academic_terms (code, name, start_date, end_date, status)
VALUES
  ('2026-II', 'Segundo Semestre Académico 2026', '2026-08-01', '2026-12-15', 'in_progress'),
  ('2027-I',  'Primer Semestre Académico 2027',  '2027-01-18', '2027-06-20', 'enrollment_open'),
  ('2027-II', 'Segundo Semestre Académico 2027', '2027-08-02', '2027-12-18', 'planning')
ON CONFLICT (code) DO NOTHING;

-- 2. RUTAS DE APRENDIZAJE / FACULTADES (learning_paths)
INSERT INTO public.learning_paths (slug, faculty_name, title, summary, icon_key, price_bundle, estimated_weeks, is_published)
VALUES
  (
    'arquitectura-software-cloud',
    'Desarrollo Web & Cloud Architecture',
    'Ingeniería de Software Full-Stack con Next.js, TypeScript y Supabase',
    'Programa curricular universitario con prerrequisitos DAG: desde fundamentos algorítmicos y bases de datos relacionales hasta arquitecturas distribuidas con RLS.',
    'code',
    289.00,
    24,
    true
  ),
  (
    'ai-agents-data-science',
    'AI & Data Science Academy',
    'Ingeniería de Sistemas con Inteligencia Artificial y Agentes Autónomos',
    'Domina el diseño de pipelines vectoriales, orquestación de LLMs, evaluación determinística y despliegue productivo.',
    'cpu',
    319.00,
    20,
    true
  ),
  (
    'ciberseguridad-redes-rls',
    'Ciberseguridad & Redes',
    'Seguridad de Aplicaciones, Criptografía y Gobierno de Datos',
    'Auditoría ofensiva/defensiva, políticas Row Level Security de grado bancario, firmas SHA-256 y protección de infraestructura.',
    'shield',
    269.00,
    18,
    true
  ),
  (
    'diseno-sistemas-ui',
    'Diseño de Producto & Sistemas UI',
    'Design Systems de Alta Precisión con Tailwind CSS v4 y Accesibilidad',
    'Arquitectura de interfaces oscuras de alto contraste, Container Queries, micro-interacciones y ergonomía para sistemas ERP.',
    'palette',
    219.00,
    14,
    true
  ),
  (
    'finanzas-erp-ingenieria',
    'Finanzas Corporativas, Negocios & ERP',
    'Arquitectura de Sistemas ERP, Libros Contables e Integración de Pagos',
    'Modelado transaccional idempotente, conciliación de webhooks financieros, auditoría inmutable y métricas ejecutivas.',
    'dollar',
    249.00,
    16,
    true
  ),
  (
    'ingenieria-datos-postgresql',
    'Ingeniería de Datos & PostgreSQL',
    'Administración Avanzada de PostgreSQL 17, Indexación GIN/B-Tree y PL/pgSQL',
    'Optimización de planes de ejecución (InitPlan), índices cubrientes, funciones transaccionales y modelado relacional estricto.',
    'database',
    259.00,
    16,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. CATÁLOGO DE CURSOS DE LA MALLA CURRICULAR (courses)
INSERT INTO public.courses (code, slug, title, summary, level_label, price_individual, academic_credits, total_hours, min_passing_grade, min_attendance_pct, is_published)
VALUES
  (
    'CS-101',
    'fundamentos-typescript-algoritmos',
    'Fundamentos de Ingeniería con TypeScript Estricto y Algoritmos',
    'Tipado estático avanzado, estructuras de datos inmutables, complejidad algorítmica y contratos de dominio sin uso de any.',
    'Inicial',
    69.00,
    4,
    32,
    70.00,
    80.00,
    true
  ),
  (
    'DB-102',
    'modelado-postgresql-indexacion',
    'Modelado Relacional en PostgreSQL 17 e Indexación de Alto Rendimiento',
    'Diseño de esquemas normalizados, restricciones de integridad, índices compuestos, parciales, cubrientes (INCLUDE) y GIN Trigram.',
    'Intermedio',
    79.00,
    4,
    36,
    70.00,
    80.00,
    true
  ),
  (
    'SEC-201',
    'seguridad-rls-iam-supabase',
    'Seguridad Row Level Security (RLS), Autenticación JWT y Gobierno IAM',
    'Implementación de control de acceso multi-rol (RBAC), políticas RLS con InitPlan caching y funciones PL/pgSQL transaccionales.',
    'Intermedio',
    89.00,
    4,
    32,
    75.00,
    85.00,
    true
  ),
  (
    'WEB-301',
    'arquitectura-nextjs-ddd-modular',
    'Arquitectura Modular DDD con Next.js App Router y Tailwind CSS v4',
    'Diseño de sistemas escalables por niveles de dependencia (Nivel 0 a 4), Server Components, Server Actions con Zod y Container Queries.',
    'Avanzado',
    99.00,
    5,
    44,
    75.00,
    85.00,
    true
  ),
  (
    'ERP-401',
    'proyecto-integrador-erp-academico',
    'Proyecto Integrador Final: Motor ERP Académico y Certificación SHA-256',
    'Construcción de libro de calificaciones ponderado, detector de riesgo de deserción, ledger idempotente de XP y certificados verificables.',
    'Magistral',
    119.00,
    6,
    48,
    80.00,
    90.00,
    true
  )
ON CONFLICT (code) DO NOTHING;

-- 4. VINCULACIÓN DE LOS CURSOS A LA RUTA PRINCIPAL (learning_path_items)
INSERT INTO public.learning_path_items (learning_path_id, course_id, step_order, is_mandatory)
SELECT lp.id, c.id, v.step_order, true
FROM public.learning_paths lp
JOIN (
  VALUES
    ('CS-101', 1),
    ('DB-102', 2),
    ('SEC-201', 3),
    ('WEB-301', 4),
    ('ERP-401', 5)
) AS v(course_code, step_order) ON true
JOIN public.courses c ON c.code = v.course_code
WHERE lp.slug = 'arquitectura-software-cloud'
ON CONFLICT (learning_path_id, course_id) DO NOTHING;

-- 5. GRAFO DIRIGIDO ACÍCLICO DE PRERREQUISITOS (course_prerequisites)
-- Grafo DAG:
--   CS-101 -> DB-102 (requiere 70 pts)
--   CS-101 -> SEC-201 (requiere 70 pts)
--   DB-102 -> SEC-201 (requiere 75 pts)
--   DB-102 -> WEB-301 (requiere 75 pts)
--   SEC-201 -> WEB-301 (requiere 75 pts)
--   WEB-301 -> ERP-401 (requiere 80 pts)
INSERT INTO public.course_prerequisites (course_id, required_course_id, min_grade_required)
SELECT target_c.id, req_c.id, edges.min_grade
FROM (
  VALUES
    ('DB-102',  'CS-101',  70.00),
    ('SEC-201', 'CS-101',  70.00),
    ('SEC-201', 'DB-102',  75.00),
    ('WEB-301', 'DB-102',  75.00),
    ('WEB-301', 'SEC-201', 75.00),
    ('ERP-401', 'WEB-301', 80.00)
) AS edges(target_code, req_code, min_grade)
JOIN public.courses target_c ON target_c.code = edges.target_code
JOIN public.courses req_c ON req_c.code = edges.req_code
ON CONFLICT (course_id, required_course_id) DO NOTHING;

-- 6. MÓDULOS Y LECCIONES DE EJEMPLO REAL EN POSTGRESQL
DO $$
DECLARE
  v_course_cs101 uuid;
  v_course_db102 uuid;
  v_mod1 uuid;
  v_mod2 uuid;
BEGIN
  SELECT id INTO v_course_cs101 FROM public.courses WHERE code = 'CS-101';
  SELECT id INTO v_course_db102 FROM public.courses WHERE code = 'DB-102';

  IF v_course_cs101 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.course_modules WHERE course_id = v_course_cs101) THEN
    INSERT INTO public.course_modules (course_id, title, sort_order)
    VALUES (v_course_cs101, 'Módulo 1: Sistema de Tipos Estricto e Invariantes de Dominio', 1)
    RETURNING id INTO v_mod1;

    INSERT INTO public.lessons (module_id, title, content_type, duration_minutes, is_free_preview, sort_order)
    VALUES
      (v_mod1, 'Por qué prohibimos any: Contratos Determinísticos en Sistemas ERP', 'video', 16, true, 1),
      (v_mod1, 'Uniones Discriminadas y Patrón ActionResult<T>', 'reading', 14, true, 2),
      (v_mod1, 'Grafos Dirigidos Acíclicos (DAG) aplicados a Mallas Curriculares', 'video', 22, false, 3);
  END IF;

  IF v_course_db102 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.course_modules WHERE course_id = v_course_db102) THEN
    INSERT INTO public.course_modules (course_id, title, sort_order)
    VALUES (v_course_db102, 'Módulo 1: Arquitectura de Índices y Planes de Ejecución en Postgres 17', 1)
    RETURNING id INTO v_mod2;

    INSERT INTO public.lessons (module_id, title, content_type, duration_minutes, is_free_preview, sort_order)
    VALUES
      (v_mod2, 'Anatomía de un B-Tree vs GIN Trigram (pg_trgm)', 'video', 18, true, 1),
      (v_mod2, 'Índices Cubrientes (INCLUDE) e Index-Only Scans', 'reading', 15, false, 2),
      (v_mod2, 'Optimización InitPlan en Políticas RLS con (SELECT auth.uid())', 'video', 25, false, 3);
  END IF;
END $$;

-- 7. SEMILLA DE CUPONES Y BECAS OFICIALES (FASE 4 - public.coupons)
INSERT INTO public.coupons (code, description, discount_pct, max_uses, current_uses, is_active, valid_until)
VALUES
  ('NEXUS20',   'Descuento Institucional de Convocatoria 2027-I (20% OFF)', 20.00, 200, 14, true, '2027-06-30T23:59:59Z'),
  ('EARLY2027', 'Beneficio Matrícula Temprana Ingeniería (35% OFF)',        35.00, 100, 28, true, '2027-03-01T23:59:59Z'),
  ('BECA100',   'Beca de Excelencia Académica aprobada por Coordinación',  100.00,  25,  3, true, '2027-12-31T23:59:59Z')
ON CONFLICT (code) DO NOTHING;

-- 8. SEMILLA DE COHORTES REALES EN PERÍODO 2027-I (FASE 4 - public.cohorts)
INSERT INTO public.cohorts (
  code, name, course_id, academic_term_id, schedule_label, max_students, enrolled_count, start_date, end_date, status
)
SELECT
  v.cohort_code,
  v.cohort_name,
  c.id,
  t.id,
  v.schedule_label,
  v.max_students,
  v.enrolled_count,
  '2027-01-18'::date,
  '2027-06-20'::date,
  v.status::public.cohort_status
FROM public.academic_terms t
JOIN (
  VALUES
    ('CS101-2027I-A',  'Cohorte A · Fundamentos de Ingeniería & TypeScript', 'CS-101',  'Lun & Mié 19:00 - 21:00 (GMT-4)', 30, 18, 'active'),
    ('CS101-2027I-B',  'Cohorte B · Intensivo Fin de Semana TypeScript',     'CS-101',  'Sábados 09:00 - 13:00 (GMT-4)',   25,  9, 'upcoming'),
    ('DB102-2027I-A',  'Cohorte A · Modelado PostgreSQL 17 & Indexación',    'DB-102',  'Mar & Jue 19:00 - 21:00 (GMT-4)', 25, 13, 'active'),
    ('SEC201-2027I-A', 'Cohorte A · Seguridad RLS, JWT & Gobierno IAM',      'SEC-201', 'Lun & Mié 20:00 - 22:00 (GMT-4)', 20,  8, 'upcoming'),
    ('WEB301-2027I-A', 'Cohorte A · Arquitectura Modular DDD con Next.js',   'WEB-301', 'Mar & Jue 20:00 - 22:00 (GMT-4)', 20, 11, 'upcoming'),
    ('ERP401-2027I-A', 'Cohorte Magistral · Proyecto Integrador Final ERP',  'ERP-401', 'Viernes 18:00 - 22:00 (GMT-4)',   15,  6, 'upcoming')
) AS v(cohort_code, cohort_name, course_code, schedule_label, max_students, enrolled_count, status) ON true
JOIN public.courses c ON c.code = v.course_code
WHERE t.code = '2027-I'
ON CONFLICT (code) DO NOTHING;

-- 9. SEMILLA DE SESIONES Y RUBROS EVALUATIVOS PONDERADOS (FASE 5 - ERP ACADÉMICO)
INSERT INTO public.class_sessions (cohort_id, session_number, title, starts_at, ends_at, meeting_or_room_url, is_attendance_taken)
SELECT
  c.id,
  s.session_num,
  s.session_title,
  s.starts_at::timestamptz,
  s.ends_at::timestamptz,
  'https://meet.nexus.edu/' || lower(c.code) || '-s' || s.session_num,
  s.taken
FROM public.cohorts c
JOIN (
  VALUES
    ('CS101-2027I-A', 1, 'Sesión 1: Contratos de Dominio y Tipos Estrictos en TypeScript', '2027-01-18T23:00:00Z', '2027-01-19T01:00:00Z', true),
    ('CS101-2027I-A', 2, 'Sesión 2: Invariantes, Uniones Discriminadas y ActionResult<T>', '2027-01-20T23:00:00Z', '2027-01-21T01:00:00Z', true),
    ('CS101-2027I-A', 3, 'Sesión 3: Estructuras de Datos y Grafos Dirigidos Acíclicos (DAG)', '2027-01-25T23:00:00Z', '2027-01-26T01:00:00Z', true),
    ('CS101-2027I-A', 4, 'Sesión 4: Complejidad Algorítmica y Búsqueda en Profundidad (DFS)', '2027-01-27T23:00:00Z', '2027-01-28T01:00:00Z', false),
    ('CS101-2027I-A', 5, 'Sesión 5: Defensa de Arquitectura y Revisión de Parcial 1',         '2027-02-01T23:00:00Z', '2027-02-02T01:00:00Z', false),
    ('DB102-2027I-A', 1, 'Sesión 1: Arquitectura Interna de PostgreSQL 17 y B-Tree',          '2027-01-19T23:00:00Z', '2027-01-20T01:00:00Z', true),
    ('DB102-2027I-A', 2, 'Sesión 2: Índices Cubrientes (INCLUDE) e Índices Parciales',        '2027-01-21T23:00:00Z', '2027-01-22T01:00:00Z', true),
    ('DB102-2027I-A', 3, 'Sesión 3: Optimización InitPlan en Políticas RLS',                  '2027-01-26T23:00:00Z', '2027-01-27T01:00:00Z', false),
    ('DB102-2027I-A', 4, 'Sesión 4: Transacciones PL/pgSQL y Bloqueo Pesimista FOR UPDATE',   '2027-01-28T23:00:00Z', '2027-01-29T01:00:00Z', false)
) AS s(cohort_code, session_num, session_title, starts_at, ends_at, taken)
  ON c.code = s.cohort_code
ON CONFLICT (cohort_id, session_number) DO NOTHING;

-- 10. SEMILLA DE INSIGNIAS Y CERTIFICADOS VERIFICABLES SHA-256 (FASE 6 - NIVEL 4)
INSERT INTO public.badges (code, name, description, icon_key, xp_bonus)
VALUES
  ('FIRST_STEP',         'Primer Paso Académico',           'Completar la primera lección oficial dentro de cualquier curso o cohorte.', 'sparkles', 50),
  ('STREAK_7',           'Constancia de Acero (7 Días)',    'Mantener una racha ininterrumpida de 7 días de estudio activo.',            'flame',    100),
  ('STREAK_30',          'Hábito Maestro (30 Días)',        'Alcanzar 30 días consecutivos de disciplina académica en Nexus.',           'rocket',   500),
  ('PERFECT_ATTENDANCE', 'Asistencia Perfecta (100%)',      'Aprobar el acta de una cohorte con 100.00% de asistencia registrada.',      'calendar', 200),
  ('HONOR_ROLL',         'Cuadro de Honor Magna Cum Laude', 'Aprobar el acta de una cohorte con calificación ponderada >= 95.00 pts.',   'award',    300),
  ('PATH_GRADUATE',      'Graduado de Ruta Curricular DAG', 'Aprobar todos los cursos obligatorios de un Learning Path completo.',       'shield',   1000)
ON CONFLICT (code) DO NOTHING;
