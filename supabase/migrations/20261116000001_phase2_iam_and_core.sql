-- =============================================================================
-- NEXUS PLATFORM — FASE 2: FUNDACIÓN TÉCNICA, IAM MULTI-ROL, INDEXACIÓN Y RLS
-- Gobernado por: .agents/skills/nexus-supabase-dba/SKILL.md
-- Optimizado con: InitPlan Subselects (SELECT auth.uid()), Índices Compuestos,
-- Índices Parciales, Índices Cubrientes (INCLUDE) y Búsqueda Trigram (pg_trgm).
-- =============================================================================

-- 1. EXTENSIONES DE RENDIMIENTO Y CRIPTOGRAFÍA
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. TIPOS ENUMERADOS GLOBALES DEL SISTEMA (NIVEL 0)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'coordinator', 'instructor', 'student');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. FUNCIÓN GENÉRICA DE AUDITORÍA TEMPORAL (updated_at)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. TABLA: public.profiles (Identidad Académica y Personal)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  document_id text UNIQUE,
  phone text,
  avatar_url text,
  bio text,
  timezone text NOT NULL DEFAULT 'America/Caracas',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_profiles_username_format CHECK (username ~ '^[a-z0-9_]{3,32}$')
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. TABLA: public.user_roles (Asignación RBAC Multi-Rol en Instancia Única)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_roles_user UNIQUE (user_id)
);

DROP TRIGGER IF EXISTS trg_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trg_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. TABLA: public.audit_logs (Trazabilidad Inmutable para Administración y ERP)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_code text NOT NULL,
  entity_table text NOT NULL,
  entity_id uuid,
  previous_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 7. ARQUITECTURA DE INDEXACIÓN AVANZADA (ALTO RENDIMIENTO)
-- =============================================================================

-- 7.1 Índice Cubriente (Covering Index) para lecturas de sesión y RLS sin Heap Fetch (Index-Only Scan)
CREATE INDEX IF NOT EXISTS idx_user_roles_userid_covering_role
  ON public.user_roles (user_id) INCLUDE (role);

-- 7.2 Índice por Rol para filtrado rápido en la Consola de Gobierno IAM
CREATE INDEX IF NOT EXISTS idx_user_roles_role
  ON public.user_roles (role);

-- 7.3 Índice Parcial sobre usuarios activos ordenados por fecha (evita indexar cuentas inactivas)
CREATE INDEX IF NOT EXISTS idx_profiles_active_created_desc
  ON public.profiles (created_at DESC)
  WHERE is_active = true;

-- 7.4 Índices GIN Trigram (pg_trgm) para búsqueda instantánea (ILIKE '%termino%') en el Omnibox y Directorio IAM
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_trgm
  ON public.profiles USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm
  ON public.profiles USING gin (email gin_trgm_ops);

-- 7.5 Índices Compuestos y GIN en Auditoría para consultas de trazabilidad
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_lookup
  ON public.audit_logs (entity_table, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
  ON public.audit_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_newdata_gin
  ON public.audit_logs USING gin (new_data jsonb_path_ops);

-- =============================================================================
-- 8. FUNCIONES HELPER OPTIMIZADAS PARA RLS (CON INITPLAN CACHING)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role')::public.app_role,
    (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid()) LIMIT 1),
    'student'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT public.current_user_role()) = 'super_admin'::public.app_role;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT public.current_user_role()) IN ('super_admin'::public.app_role, 'coordinator'::public.app_role);
$$;

-- =============================================================================
-- 9. TRIGGERS DE SINCRONIZACIÓN JWT Y ONBOARDING ATÓMICO
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_role_to_auth_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role::text)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_role_to_auth ON public.user_roles;
CREATE TRIGGER trg_sync_role_to_auth
  AFTER INSERT OR UPDATE OF role ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_auth_metadata();

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_username text;
BEGIN
  generated_username := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  IF length(generated_username) < 3 THEN
    generated_username := 'user_' || substr(replace(NEW.id::text, '-', ''), 1, 6);
  ELSE
    generated_username := substr(generated_username, 1, 24) || '_' || substr(replace(NEW.id::text, '-', ''), 1, 4);
  END IF;

  INSERT INTO public.profiles (id, email, username, full_name, document_id, timezone)
  VALUES (
    NEW.id,
    NEW.email,
    generated_username,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'document_id', '')), ''),
    COALESCE(NEW.raw_user_meta_data ->> 'timezone', 'America/Caracas')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::public.app_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- =============================================================================
-- 10. POLÍTICAS ROW LEVEL SECURITY (OPTIMIZADAS CON (SELECT auth.uid()))
-- =============================================================================
-- Nota de Optimización PostgreSQL: Envolver auth.uid() y funciones estables en
-- un escalar (SELECT auth.uid()) fuerza al planificador de Postgres a evaluarlo
-- 1 sola vez por consulta (InitPlan) en lugar de re-evaluarlo por cada fila.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
CREATE POLICY "profiles_select_own_or_staff"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.is_admin_or_coordinator())
    OR (SELECT public.current_user_role()) = 'instructor'::public.app_role
  );

DROP POLICY IF EXISTS "profiles_update_own_or_super_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_super_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "user_roles_select_own_or_staff" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_staff"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_coordinator()));

DROP POLICY IF EXISTS "user_roles_manage_super_admin_only" ON public.user_roles;
CREATE POLICY "user_roles_manage_super_admin_only"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_super_admin()))
  WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "audit_logs_select_staff_only" ON public.audit_logs;
CREATE POLICY "audit_logs_select_staff_only"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin_or_coordinator()));

DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- =============================================================================
-- 11. FUNCIÓN RPC TRANSACCIONAL PARA CAMBIO DE ROL CON BLOQUEO PESIMISTA
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_assign_user_role(
  target_user_id uuid,
  new_role public.app_role,
  reason text DEFAULT 'Asignación administrativa desde consola IAM'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role public.app_role;
BEGIN
  IF NOT (SELECT public.is_super_admin()) THEN
    RAISE EXCEPTION 'FORBIDDEN: Solo super_admin puede modificar roles del sistema.';
  END IF;

  SELECT role INTO old_role FROM public.user_roles WHERE user_id = target_user_id FOR UPDATE;

  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, new_role, (SELECT auth.uid()))
  ON CONFLICT (user_id)
  DO UPDATE SET role = EXCLUDED.role, assigned_by = EXCLUDED.assigned_by, updated_at = now();

  INSERT INTO public.audit_logs (actor_id, action_code, entity_table, entity_id, previous_data, new_data)
  VALUES (
    (SELECT auth.uid()),
    'IAM_ROLE_ASSIGNED',
    'user_roles',
    target_user_id,
    jsonb_build_object('previous_role', old_role),
    jsonb_build_object('new_role', new_role, 'reason', reason)
  );

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id, 'new_role', new_role);
END;
$$;
