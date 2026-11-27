---
name: nexus-supabase-dba
description: >-
  Guides the creation of PostgreSQL migrations, Row Level Security (RLS) policies across the 4 roles
  (super_admin, coordinator, instructor, student), PL/pgSQL transactional functions, and database triggers in Supabase.
  Use this skill whenever designing tables, writing SQL migrations, configuring RLS, or creating RPC functions.
---

# Nexus Supabase DBA & Security Skill

Esta skill estandariza el diseño de base de datos, migraciones SQL y seguridad Row Level Security (RLS) en Supabase para **Nexus**.

> **Regla Deductiva Crítica (`nexus-deductive-verification`)**: Un archivo `.sql` escrito en `supabase/migrations/` es únicamente una **propuesta en disco**. Nunca afirmes que una tabla, función RPC, trigger o política RLS "ya está lista o implementada en Supabase" hasta que:
> 1. El usuario haya creado el proyecto en Supabase y configurado `.env.local`.
> 2. El script SQL se haya ejecutado realmente en PostgreSQL (vía SQL Editor de Supabase o Supabase CLI `supabase db push`).
> 3. Se haya verificado mediante una consulta real que las tablas y políticas existen y responden sin error.

## 1. Convenciones de Nomenclatura SQL

- **Tablas y Columnas**: `snake_case`, nombres de tablas en plural (`learning_paths`, `evaluation_items`, `attendance_records`).
- **Claves Primarias**: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- **Auditoría Temporal**: Todas las tablas transaccionales deben incluir `created_at timestamptz NOT NULL DEFAULT now()` y `updated_at timestamptz NOT NULL DEFAULT now()` (con trigger automático de actualización).
- **Dinero y Calificaciones**: Nunca usar `float` o `real`. Usar siempre `numeric(10,2)` para montos financieros y `numeric(5,2)` para calificaciones y porcentajes (`0.00` a `100.00`).

## 2. Arquitectura de Autenticación y RBAC en RLS

Para evitar `JOIN` costosos en cada política RLS, el rol activo del usuario (`super_admin`, `coordinator`, `instructor`, `student`) se sincroniza en `auth.users.raw_app_meta_data->>'role'` mediante un custom access token hook o trigger sobre `public.user_roles`.

### Funciones Helper SQL Obligatorias
Toda migración inicial debe contar con estas funciones `SECURITY DEFINER` estables:
- `public.current_user_role() RETURNS text`: Lee el rol desde `auth.jwt() -> 'app_metadata' ->> 'role'`.
- `public.is_admin_or_coordinator() RETURNS boolean`: Retorna `true` si el rol es `super_admin` o `coordinator`.
- `public.is_cohort_instructor(target_cohort_id uuid) RETURNS boolean`: Verifica si `auth.uid()` es el `instructor_id` asignado a la cohorte.
- `public.is_enrolled_student(target_cohort_id uuid) RETURNS boolean`: Verifica si `auth.uid()` tiene una matrícula `active` o `completed` en la cohorte.

## 3. Matriz de Políticas RLS por Dominio

1. **Catálogo (`courses`, `learning_paths`, `course_modules`, `lessons`)**:
   - `SELECT` público para registros con `is_published = true` (excepto el contenido privado de `lessons` como URLs de video/archivos, que requiere estar matriculado en una cohorte activa del curso o ser staff).
   - `INSERT / UPDATE / DELETE` permitido solo a `super_admin` y `coordinator` (`instructor` puede editar contenido de lecciones si está asignado como autor/docente).
2. **Comercio (`orders`, `order_items`)**:
   - `SELECT`: El `student` solo ve sus propias órdenes (`student_id = auth.uid()`); `super_admin` y `coordinator` ven todas.
   - `UPDATE`: Prohibido desde el cliente para estudiantes; solo el service role (webhook de pago) o `super_admin` puede cambiar `payment_status`.
3. **ERP Académico (`enrollments`, `attendance_records`, `submissions`, `evaluation_items`)**:
   - `student`: Solo `SELECT` de sus propios registros de matrícula, asistencia y notas; `INSERT/UPDATE` únicamente en `submissions` mientras la fecha actual sea menor o igual a `due_date` y la cohorte esté `active`.
   - `instructor`: `SELECT` y `INSERT/UPDATE` de asistencia y calificaciones únicamente para cohortes donde `instructor_id = auth.uid()` y `cohort.status IN ('active', 'grading')`.
   - `coordinator` / `super_admin`: Acceso total y capacidad de cerrar actas (`cohort.status = 'closed'`).
4. **Notificaciones (`public.notifications`)**:
   - RLS obligatorio (`TO authenticated` con `(SELECT auth.uid())`): Cada usuario solo puede hacer `SELECT` y `UPDATE` (marcar como leída) de sus propias notificaciones (`user_id = (SELECT auth.uid())`).
   - `INSERT`: Restringido a funciones `SECURITY DEFINER`, `service_role` o roles administrativos (`super_admin` / `coordinator`) según flujo.

## 4. Operaciones que DEBEN ser Funciones RPC Transaccionales (`PL/pgSQL`)

Nunca ejecutes múltiples llamadas separadas desde el cliente para estos flujos críticos; encapsúlalos siempre en una función PostgreSQL transaccional (`rpc`):
1. `rpc_confirm_order_and_enroll`: Marca la orden como `paid`, descuenta el cupo de la cohorte con bloqueo pesimista (`FOR UPDATE`), crea los registros en `enrollments` e inicializa el libro de gamificación.
2. `rpc_approve_pending_order`: Permite a `super_admin` o `coordinator` aprobar una orden pendiente (`under_review` / transferencia manual), actualizarla a `paid`, activar la matrícula correspondiente y registrar la auditoría.
3. `rpc_close_cohort_gradebook`: Valida que los pesos de evaluación sumen `100%`, calcula `final_grade` y `attendance_pct` de todos los matriculados, determina `completed` vs `failed`, emite certificados para los aprobados y sella la cohorte en estado `closed`.
4. `rpc_award_xp_idempotent`: Inserta en `xp_ledger` con `ON CONFLICT DO NOTHING`, recalcula `total_xp` y `current_level` en `user_gamification`, y evalúa desbloqueo de insignias.
5. `rpc_issue_certificate_on_completion`: Evalúa la conjunción de certificación (`final_grade >= min_passing_grade`, `attendance_pct >= min_attendance_pct` y orden `paid`) y emite de forma idempotente el registro verificable en `certificates` con código único y hash criptográfico.

## 5. Protocolo de Indexación Avanzada, Consultas y Optimización RLS

Para que **Nexus** mantenga tiempos de respuesta sub-20ms incluso con cientos de miles de registros:

1. **Optimización `InitPlan` en Políticas RLS (`(SELECT auth.uid())`)**:
   - **Prohibido** escribir `USING (user_id = auth.uid())` directamente.
   - **Obligatorio** escribir `USING (user_id = (SELECT auth.uid()))` y `TO authenticated`. Envolver `auth.uid()` y las funciones helper en un `(SELECT ...)` hace que el optimizador de PostgreSQL almacene en caché el resultado una sola vez por consulta (*InitPlan*), logrando mejoras de hasta **100x** en escaneos de tablas grandes.
2. **Estrategia de Índices por Caso de Uso**:
   - **Toda clave foránea (`FK`) utilizada en `JOIN` o políticas RLS debe estar indexada**.
   - **Índices Cubrientes (`INCLUDE`)**: En tablas consultadas por cada petición como `user_roles`, usa `CREATE INDEX ... ON user_roles (user_id) INCLUDE (role)` para lograr *Index-Only Scans* sin tocar el *Heap*.
   - **Índices Parciales (`WHERE`)**: Indexa solo el subconjunto caliente (ej. `WHERE is_active = true` o `WHERE status = 'active'`).
   - **Índices GIN Trigram (`pg_trgm`)**: Para búsquedas de texto con `ILIKE '%termino%'` en nombres, correos o títulos de cursos.
3. **Protocolo Estricto de Consultas en Repositorios (`src/modules/*/infrastructure/queries.ts`)**:
   - **Prohibido `select('*')` en producción**: Especifica siempre las columnas exactas necesarias (ej. `.select('id, email, username, full_name, document_id, timezone, is_active, created_at')`) para reducir el payload de red y aprovechar *Index-Only Scans*.
   - **Paginación Basada en Cursores o Límite Estricto**: Toda consulta de listado debe incluir `.range(from, to)` o `.limit(N)` explícito; nunca traigas tablas sin acotar.
   - **Cero Consultas N+1**: Usa relaciones embebidas de PostgREST (`.select('id, full_name, user_roles(role)')`) o vistas/RPC en lugar de iterar consultas dentro de un bucle `for`.

## 6. Limpieza y Reinicio Controlado (`supabase/reset_clean.sql`)

- El script `supabase/reset_clean.sql` permite restablecer de forma limpia y determinista los datos de dominio y tablas en el esquema `public` (respetando el orden de dependencias y claves foráneas) antes de re-ejecutar migraciones o semillas (`supabase/seed.sql`) en entornos de desarrollo o staging.
- Nunca ejecutes `supabase/reset_clean.sql` sobre producción sin respaldo previo y confirmación explícita.
