-- =============================================================================
-- NEXUS PLATFORM — FASE 3: DOMINIO CURRICULAR, CATÁLOGO Y MOTOR DE RUTAS DAG (NIVEL 1)
-- Gobernado por: nexus-supabase-dba, nexus-academic-erp-engine, nexus-deductive-verification
-- =============================================================================

-- 1. TIPOS ENUMERADOS DEL DOMINIO CURRICULAR (NIVEL 1)
DO $$ BEGIN
  CREATE TYPE public.term_status AS ENUM ('planning', 'enrollment_open', 'in_progress', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lesson_content_type AS ENUM ('video', 'reading', 'resource', 'quiz_link');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABLA: public.academic_terms (Períodos Académicos Institucionales)
CREATE TABLE IF NOT EXISTS public.academic_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status public.term_status NOT NULL DEFAULT 'planning',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_academic_terms_dates CHECK (end_date > start_date)
);

CREATE TRIGGER trg_academic_terms_updated_at
  BEFORE UPDATE ON public.academic_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. TABLA: public.learning_paths (Escuelas / Programas Curriculares con Grafo DAG)
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  faculty_name text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  icon_key text NOT NULL DEFAULT 'code',
  price_bundle numeric(10,2) NOT NULL DEFAULT 0.00,
  estimated_Weeks int NOT NULL DEFAULT 12,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_learning_paths_price CHECK (price_bundle >= 0)
);

CREATE TRIGGER trg_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. TABLA: public.courses (Catálogo Maestro de Cursos / Materias)
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  level_label text NOT NULL DEFAULT 'Intermedio',
  price_individual numeric(10,2) NOT NULL DEFAULT 0.00,
  academic_credits int NOT NULL DEFAULT 3,
  total_hours int NOT NULL DEFAULT 24,
  min_passing_grade numeric(5,2) NOT NULL DEFAULT 70.00,
  min_attendance_pct numeric(5,2) NOT NULL DEFAULT 80.00,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_courses_price CHECK (price_individual >= 0),
  CONSTRAINT chk_courses_passing_grade CHECK (min_passing_grade BETWEEN 0 AND 100),
  CONSTRAINT chk_courses_attendance_pct CHECK (min_attendance_pct BETWEEN 0 AND 100)
);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. TABLA: public.learning_path_items (Composición Secuencial de la Ruta)
CREATE TABLE IF NOT EXISTS public.learning_path_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  step_order int NOT NULL DEFAULT 1,
  is_mandatory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_path_course UNIQUE (learning_path_id, course_id)
);

-- 6. TABLA: public.course_prerequisites (Aristas del Grafo Dirigido Acíclico - DAG)
CREATE TABLE IF NOT EXISTS public.course_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  required_course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  min_grade_required numeric(5,2) NOT NULL DEFAULT 70.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_course_prereq UNIQUE (course_id, required_course_id),
  CONSTRAINT chk_no_self_prerequisite CHECK (course_id <> required_course_id),
  CONSTRAINT chk_prereq_min_grade CHECK (min_grade_required BETWEEN 0 AND 100)
);

-- 7. VALIDADOR DE GRAFOS ACÍCLICOS (DAG ANTI-CYCLE TRIGGER EN POSTGRESQL)
CREATE OR REPLACE FUNCTION public.enforce_dag_no_cycles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  cycle_found boolean;
BEGIN
  IF NEW.course_id = NEW.required_course_id THEN
    RAISE EXCEPTION 'DAG_CYCLE_DETECTED: Un curso no puede ser prerrequisito de sí mismo.';
  END IF;

  -- Búsqueda recursiva CTE: Verifica si NEW.course_id ya es prerrequisito directo o indirecto de NEW.required_course_id
  WITH RECURSIVE prereq_chain AS (
    SELECT cp.required_course_id AS ancestor_id
    FROM public.course_prerequisites cp
    WHERE cp.course_id = NEW.required_course_id
    UNION
    SELECT cp.required_course_id
    FROM public.course_prerequisites cp
    INNER JOIN prereq_chain pc ON cp.course_id = pc.ancestor_id
  )
  SELECT EXISTS (
    SELECT 1 FROM prereq_chain WHERE ancestor_id = NEW.course_id
  ) INTO cycle_found;

  IF cycle_found THEN
    RAISE EXCEPTION 'DAG_CYCLE_DETECTED: Agregar este prerrequisito crearía una dependencia circular en la malla curricular.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_dag_no_cycles
  BEFORE INSERT OR UPDATE ON public.course_prerequisites
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_dag_no_cycles();

-- 8. TABLA: public.course_modules (Módulos / Unidades Temáticas de un Curso)
CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. TABLA: public.lessons (Lecciones dentro de cada Módulo)
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type public.lesson_content_type NOT NULL DEFAULT 'video',
  video_url text,
  markdown_body text,
  duration_minutes int NOT NULL DEFAULT 10,
  is_free_preview boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_lessons_duration CHECK (duration_minutes >= 0)
);

CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 10. INDEXACIÓN AVANZADA DE NIVEL 1 (B-TREE, PARCIALES, CUBRIENTES Y TRIGRAM)
-- =============================================================================

-- 10.1 Índices sobre Claves Foráneas y Ordenamiento Curricular
CREATE INDEX IF NOT EXISTS idx_learning_path_items_path_order
  ON public.learning_path_items (learning_path_id, step_order ASC)
  INCLUDE (course_id, is_mandatory);

CREATE INDEX IF NOT EXISTS idx_learning_path_items_course
  ON public.learning_path_items (course_id);

CREATE INDEX IF NOT EXISTS idx_course_prereq_course
  ON public.course_prerequisites (course_id)
  INCLUDE (required_course_id, min_grade_required);

CREATE INDEX IF NOT EXISTS idx_course_prereq_required_course
  ON public.course_prerequisites (required_course_id);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_order
  ON public.course_modules (course_id, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_lessons_module_order
  ON public.lessons (module_id, sort_order ASC);

-- 10.2 Índices Parciales para el Catálogo Público (Solo registros publicados)
CREATE INDEX IF NOT EXISTS idx_learning_paths_published
  ON public.learning_paths (created_at DESC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_courses_published_code
  ON public.courses (code ASC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_academic_terms_status
  ON public.academic_terms (status, start_date DESC);

-- 10.3 Índices GIN Trigram (extensions.gin_trgm_ops) para búsqueda instantánea en Omnibox
CREATE INDEX IF NOT EXISTS idx_courses_title_trgm
  ON public.courses USING gin (title extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_learning_paths_title_trgm
  ON public.learning_paths USING gin (title extensions.gin_trgm_ops);

-- =============================================================================
-- 11. POLÍTICAS ROW LEVEL SECURITY (SIN DUPLICIDAD DE SELECT - ADVISOR 0006)
-- =============================================================================

ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 11.1 Políticas para public.academic_terms
CREATE POLICY "academic_terms_select_all"
  ON public.academic_terms FOR SELECT
  USING (true);

CREATE POLICY "academic_terms_insert_staff"
  ON public.academic_terms FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "academic_terms_update_staff"
  ON public.academic_terms FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "academic_terms_delete_admin"
  ON public.academic_terms FOR DELETE TO authenticated
  USING ((SELECT public.is_super_admin()));

-- 11.2 Políticas para public.learning_paths
CREATE POLICY "learning_paths_select_published_or_staff"
  ON public.learning_paths FOR SELECT
  USING (is_published = true OR (SELECT public.is_admin_or_coordinator()));

CREATE POLICY "learning_paths_insert_staff"
  ON public.learning_paths FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "learning_paths_update_staff"
  ON public.learning_paths FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "learning_paths_delete_admin"
  ON public.learning_paths FOR DELETE TO authenticated
  USING ((SELECT public.is_super_admin()));

-- 11.3 Políticas para public.courses
CREATE POLICY "courses_select_published_or_staff"
  ON public.courses FOR SELECT
  USING (is_published = true OR (SELECT public.is_admin_or_coordinator()));

CREATE POLICY "courses_insert_staff"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "courses_update_staff"
  ON public.courses FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "courses_delete_admin"
  ON public.courses FOR DELETE TO authenticated
  USING ((SELECT public.is_super_admin()));

-- 11.4 Políticas para public.learning_path_items
CREATE POLICY "learning_path_items_select_all"
  ON public.learning_path_items FOR SELECT
  USING (true);

CREATE POLICY "learning_path_items_insert_staff"
  ON public.learning_path_items FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "learning_path_items_update_staff"
  ON public.learning_path_items FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "learning_path_items_delete_staff"
  ON public.learning_path_items FOR DELETE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()));

-- 11.5 Políticas para public.course_prerequisites
CREATE POLICY "course_prerequisites_select_all"
  ON public.course_prerequisites FOR SELECT
  USING (true);

CREATE POLICY "course_prerequisites_insert_staff"
  ON public.course_prerequisites FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "course_prerequisites_update_staff"
  ON public.course_prerequisites FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "course_prerequisites_delete_staff"
  ON public.course_prerequisites FOR DELETE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()));

-- 11.6 Políticas para public.course_modules
CREATE POLICY "course_modules_select_all"
  ON public.course_modules FOR SELECT
  USING (true);

CREATE POLICY "course_modules_insert_staff"
  ON public.course_modules FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "course_modules_update_staff"
  ON public.course_modules FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "course_modules_delete_staff"
  ON public.course_modules FOR DELETE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()));

-- 11.7 Políticas para public.lessons
CREATE POLICY "lessons_select_all"
  ON public.lessons FOR SELECT
  USING (true);

CREATE POLICY "lessons_insert_staff"
  ON public.lessons FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "lessons_update_staff"
  ON public.lessons FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()))
  WITH CHECK ((SELECT public.is_admin_or_coordinator()));

CREATE POLICY "lessons_delete_staff"
  ON public.lessons FOR DELETE TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()));
