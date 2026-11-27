# 03 — Esquema de Base de Datos (ERD), Diccionario de Tablas y Seguridad RLS

> **Propósito de este documento**: Definir el modelo de datos completo en **PostgreSQL (Supabase)** para **Nexus**, dividido en 4 diagramas Entidad-Relación (ERD) por dominio, el diccionario de las **24 tablas del sistema**, sus tipos enumerados (`ENUMs`), índices críticos y las políticas de seguridad **Row Level Security (RLS)**.

---

## 1. Tipos Enumerados Globales (`PostgreSQL ENUMs`)

Antes de crear las tablas, el esquema define tipos enumerados estrictos para garantizar integridad referencial:

```sql
CREATE TYPE app_role AS ENUM ('super_admin', 'coordinator', 'instructor', 'student');
CREATE TYPE term_status AS ENUM ('planning', 'enrollment_open', 'in_progress', 'closed');
CREATE TYPE cohort_status AS ENUM ('upcoming', 'active', 'grading', 'closed', 'cancelled');
CREATE TYPE order_status AS ENUM ('pending', 'under_review', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('stripe', 'mercadopago', 'bank_transfer', 'scholarship');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'failed_grade', 'failed_attendance', 'dropped');
CREATE TYPE risk_level AS ENUM ('normal', 'warning', 'critical_dropout_risk');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent', 'excused');
CREATE TYPE evaluation_type AS ENUM ('exam', 'quiz', 'assignment', 'project', 'participation');
CREATE TYPE rectification_status AS ENUM ('pending', 'approved', 'rejected');
```

---

## 2. Diagramas Entidad-Relación (ERD) por Dominio

### 2.1 Dominio 1: Identidad (IAM) y Catálogo Curricular (Rutas DAG y Cursos)

```mermaid
erDiagram
    PROFILES ||--o{ USER_ROLES : "posee"
    PROFILES ||--o{ AUDIT_LOGS : "ejecuta"
    ACADEMIC_TERMS ||--o{ COHORTS : "enmarca"
    LEARNING_PATHS ||--o{ LEARNING_PATH_ITEMS : "estructura"
    COURSES ||--o{ LEARNING_PATH_ITEMS : "integra"
    COURSES ||--o{ COURSE_PREREQUISITES : "requiere_aprobar"
    COURSES ||--o{ COURSE_MODULES : "divide_en"
    COURSE_MODULES ||--o{ LESSONS : "contiene"

    PROFILES {
        uuid id PK "FK a auth.users.id"
        string email UK
        string full_name
        string document_id UK "DNI / Cédula / Matrícula"
        string phone
        string avatar_url
        string timezone "Default: America/La_Paz o local"
        boolean is_active
        timestamptz created_at
    }

    USER_ROLES {
        uuid id PK
        uuid user_id FK
        app_role role "super_admin | coordinator | instructor | student"
        uuid assigned_by FK
        timestamptz created_at
    }

    ACADEMIC_TERMS {
        uuid id PK
        string code UK "Ej: 2027-I"
        string name "Primer Semestre 2027"
        date start_date
        date end_date
        term_status status
    }

    LEARNING_PATHS {
        uuid id PK
        string slug UK
        string title
        text description
        numeric price_bundle "Precio pago único de ruta"
        boolean is_published
        timestamptz created_at
    }

    COURSES {
        uuid id PK
        string code UK "Ej: ING-101"
        string slug UK
        string title
        text summary
        numeric price_individual "Precio pago único individual"
        int academic_credits
        int total_hours
        numeric min_passing_grade "Default: 70.00"
        numeric min_attendance_pct "Default: 80.00"
        boolean is_published
    }

    LEARNING_PATH_ITEMS {
        uuid id PK
        uuid learning_path_id FK
        uuid course_id FK
        int step_order "Nivel secuencial en el grafo"
        boolean is_mandatory
    }

    COURSE_PREREQUISITES {
        uuid id PK
        uuid course_id FK "Curso destino"
        uuid required_course_id FK "Curso requisito previo"
        numeric min_grade_required "Nota mínima requerida"
    }

    COURSE_MODULES {
        uuid id PK
        uuid course_id FK
        string title
        int sort_order
    }

    LESSONS {
        uuid id PK
        uuid module_id FK
        string title
        string content_type "video | reading | resource | quiz_link"
        string video_url
        text markdown_body
        int duration_minutes
        boolean is_free_preview
        int sort_order
    }
```

### 2.2 Dominio 2: Comercio (Órdenes Pago Único) y Matrículas

```mermaid
erDiagram
    PROFILES ||--o{ ORDERS : "compra"
    COUPONS ||--o{ ORDERS : "descuenta"
    ORDERS ||--|{ ORDER_ITEMS : "incluye"
    ORDERS ||--o{ PATH_ENTITLEMENTS : "otorga_creditos_ruta"
    ORDERS ||--o{ ENROLLMENTS : "financia"
    COHORTS ||--o{ ENROLLMENTS : "inscribe"

    COUPONS {
        uuid id PK
        string code UK "Ej: BECA2027"
        numeric discount_pct "0.00 a 100.00"
        int max_uses
        int current_uses
        timestamptz valid_until
    }

    ORDERS {
        uuid id PK
        string invoice_number UK
        uuid student_id FK
        uuid coupon_id FK
        numeric subtotal_amount
        numeric discount_amount
        numeric total_amount
        string currency "USD | local"
        payment_method method
        order_status payment_status
        string provider_reference "ID de Stripe/MercadoPago"
        string receipt_file_url "URL comprobante si transferencia"
        uuid reviewed_by FK "Admin/Coord que aprobó transferencia"
        timestamptz paid_at
        timestamptz created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        string item_type "single_course | learning_path | retake_fee"
        uuid course_id FK "Nullable si es ruta"
        uuid learning_path_id FK "Nullable si es curso"
        uuid target_cohort_id FK "Cohorte seleccionada al comprar"
        numeric unit_price
    }

    PATH_ENTITLEMENTS {
        uuid id PK
        uuid student_id FK
        uuid order_id FK
        uuid learning_path_id FK
        uuid course_id FK
        boolean is_consumed "True cuando activa cohorte del curso"
        uuid consumed_enrollment_id FK
    }

    ENROLLMENTS {
        uuid id PK
        uuid student_id FK
        uuid cohort_id FK
        uuid order_id FK
        enrollment_status status
        numeric final_grade "0.00 a 100.00"
        numeric attendance_pct "0.00 a 100.00"
        risk_level academic_risk_level
        timestamptz enrolled_at
        timestamptz completed_at
    }
```

### 2.3 Dominio 3: ERP Académico (Cohortes, Asistencia, Evaluaciones y Actas)

```mermaid
erDiagram
    COURSES ||--o{ COHORTS : "abre_instancia"
    PROFILES ||--o{ COHORTS : "dicta_como_instructor"
    COHORTS ||--o{ CLASS_SESSIONS : "agenda"
    CLASS_SESSIONS ||--o{ ATTENDANCE_RECORDS : "registra"
    ENROLLMENTS ||--o{ ATTENDANCE_RECORDS : "asiste"
    ATTENDANCE_RECORDS ||--o| ATTENDANCE_JUSTIFICATIONS : "justifica"
    COHORTS ||--o{ EVALUATION_ITEMS : "pondera"
    EVALUATION_ITEMS ||--o{ SUBMISSIONS : "recibe"
    ENROLLMENTS ||--o{ SUBMISSIONS : "entrega"
    SUBMISSIONS ||--o{ GRADE_RECTIFICATIONS : "audita_cambio"
    ENROLLMENTS ||--o{ LESSON_PROGRESS : "avanza"

    COHORTS {
        uuid id PK
        string code UK "Ej: ING101-2027I-A"
        uuid course_id FK
        uuid academic_term_id FK
        uuid instructor_id FK
        int max_students
        int enrolled_count
        date start_date
        date end_date
        cohort_status status "upcoming | active | grading | closed"
        uuid closed_by FK
        timestamptz closed_at
    }

    CLASS_SESSIONS {
        uuid id PK
        uuid cohort_id FK
        int session_number
        string title
        timestamptz starts_at
        timestamptz ends_at
        string meeting_Or_room_url
        boolean is_attendance_taken
    }

    ATTENDANCE_RECORDS {
        uuid id PK
        uuid session_id FK
        uuid enrollment_id FK
        attendance_status status "present | late | absent | excused"
        uuid recorded_by FK
        timestamptz recorded_at
    }

    ATTENDANCE_JUSTIFICATIONS {
        uuid id PK
        uuid attendance_record_id FK
        uuid requested_by FK
        text reason
        string evidence_file_url
        rectification_status status "pending | approved | rejected"
        uuid reviewed_by FK
    }

    EVALUATION_ITEMS {
        uuid id PK
        uuid cohort_id FK
        string title "Parcial 1, Proyecto Final"
        evaluation_type type
        numeric weight_pct "Peso sobre 100%"
        timestamptz due_date
        boolean allow_late_submission
        int sort_order
    }

    SUBMISSIONS {
        uuid id PK
        uuid evaluation_id FK
        uuid enrollment_id FK
        string file_url
        text submission_text
        numeric score "0.00 a 100.00"
        text instructor_feedback
        timestamptz submitted_at
        uuid graded_by FK
        timestamptz graded_at
    }

    GRADE_RECTIFICATIONS {
        uuid id PK
        uuid submission_id FK
        uuid requested_by_instructor_id FK
        numeric previous_score
        numeric new_score
        text justification_reason
        string evidence_url
        rectification_status status
        uuid approved_by_coordinator_id FK
        timestamptz resolved_at
    }

    LESSON_PROGRESS {
        uuid id PK
        uuid enrollment_id FK
        uuid lesson_id FK
        boolean is_completed
        int watched_seconds
        timestamptz completed_at
    }
```

### 2.4 Dominio 4: Gamificación (XP, Rachas, Insignias) y Certificados Verificables

```mermaid
erDiagram
    PROFILES ||--|| USER_GAMIFICATION : "mantiene_estado"
    PROFILES ||--o{ XP_LEDGER : "registra_transaccion_xp"
    PROFILES ||--o{ USER_BADGES : "desbloquea"
    BADGES ||--o{ USER_BADGES : "otorga"
    ENROLLMENTS ||--o| CERTIFICATES : "certifica"

    USER_GAMIFICATION {
        uuid user_id PK
        int total_xp
        int current_level
        int current_streak_days
        int longest_streak_days
        int streak_freezes_available
        date last_activity_date
        timestamptz updated_at
    }

    XP_LEDGER {
        uuid id PK
        uuid user_id FK
        string event_type "lesson_completed | session_ontime | submission_early | course_completed"
        uuid reference_id "ID de lección, sesión o evaluación"
        int base_xp
        numeric multiplier "Ej: 1.0, 1.2, 1.5"
        int final_xp_awarded
        timestamptz created_at
    }

    BADGES {
        uuid id PK
        string code UK "Ej: FIRST_COURSE, PERFECT_ATTENDANCE"
        string name
        string description
        string icon_url
        int xp_bonus
    }

    USER_BADGES {
        uuid id PK
        uuid user_id FK
        uuid badge_id FK
        uuid cohort_id FK "Opcional: cohorte donde la ganó"
        timestamptz awarded_at
    }

    CERTIFICATES {
        uuid id PK
        string verification_code UK "Ej: NEX-2027-8K4M9P2X"
        uuid enrollment_id FK UK
        uuid student_id FK
        uuid course_id FK
        numeric final_grade_snapshot
        numeric attendance_pct_snapshot
        string signature_hash "SHA-256 de integridad"
        string pdf_storage_path
        boolean is_revoked
        text revoked_reason
        timestamptz issued_at
    }
```

---

## 3. Restricciones Únicas e Índices Críticos de Rendimiento

Para garantizar que el sistema soporte decenas de miles de matrículas, asistencias y transacciones de XP sin degradación:

1. **Claves Compuestas de Unicidad (`UNIQUE CONSTRAINTS`)**:
   - `enrollments`: `UNIQUE (student_id, cohort_id)` — Un estudiante no puede matricularse dos veces en la misma cohorte.
   - `attendance_records`: `UNIQUE (session_id, enrollment_id)` — Solo un registro de asistencia por alumno y sesión.
   - `submissions`: `UNIQUE (evaluation_id, enrollment_id)` — Una entrega activa por rubro evaluativo y matrícula.
   - `xp_ledger`: `UNIQUE (user_id, event_type, reference_id)` — **Barrera física Anti-Farming** a nivel de motor de base de datos.
   - `course_prerequisites`: `UNIQUE (course_id, required_course_id)` + `CHECK (course_id <> required_course_id)`.

2. **Índices Compuestos (`B-Tree Indexes`)**:
   - `idx_enrollments_cohort_status ON enrollments(cohort_id, status)` (acelera el libro de calificaciones del profesor).
   - `idx_cohorts_instructor_term ON cohorts(instructor_id, academic_term_id, status)` (acelera el dashboard docente).
   - `idx_xp_ledger_user_created ON xp_ledger(user_id, created_at DESC)` (acelera el historial de puntos y rankings).
   - `idx_certificates_verification_code ON certificates(verification_code)` (búsqueda $O(\log n)$ instantánea en `/verify/[code]`).

---

## 4. Especificación de Políticas Row Level Security (RLS)

Todas las 24 tablas tienen `ROW LEVEL SECURITY` activado. A continuación se resumen las reglas de acceso en PostgreSQL:

| Tabla | Política `SELECT` | Política `INSERT` | Política `UPDATE` | Política `DELETE` |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | Propio usuario, profesores de su cohorte o staff (`coordinator`, `super_admin`) | Automático vía Trigger de `auth.users` | Solo propio usuario (campos no sensibles) o `super_admin` | Solo `super_admin` |
| `courses`, `learning_paths` | Público si `is_published = true`; staff ve todos | `super_admin`, `coordinator` | `super_admin`, `coordinator` | Solo `super_admin` |
| `lessons` | Metadatos públicos; `video_url` y `markdown_body` solo si `is_free_preview = true` OR `is_enrolled_student()` OR staff | `super_admin`, `coordinator`, `instructor` asignado | `super_admin`, `coordinator`, `instructor` asignado | `super_admin`, `coordinator` |
| `orders` | `student_id = auth.uid()` OR `is_admin_or_coordinator()` | `student_id = auth.uid()` | Solo vía RPC `SECURITY DEFINER` o `super_admin` | Nadie (inmutable, se usa estado) |
| `enrollments` | `student_id = auth.uid()` OR `is_cohort_instructor(cohort_id)` OR `is_admin_or_coordinator()` | Solo vía RPC transaccional al confirmar pago | Solo vía RPC de cálculo de notas / asistencia | Nadie (se usa `status = 'dropped'`) |
| `attendance_records` | Alumno dueño de la matrícula, instructor de la cohorte o staff | Instructor de la cohorte (si `cohort.status = 'active'`) o staff | Instructor (si `cohort.status = 'active'`) o Coordinador (justificaciones) | Prohibido |
| `submissions` | Alumno dueño, instructor de la cohorte o staff | Alumno dueño (si `now() <= due_date` o `allow_late_submission`) | Alumno (antes de ser calificado) / Instructor (`score`, `feedback` mientras `cohort.status IN ('active','grading')`) | Prohibido |
| `grade_rectifications` | Instructor solicitante, `coordinator` y `super_admin` | Instructor de la cohorte (cuando `cohort.status = 'closed'`) | Solo `coordinator` o `super_admin` | Prohibido (auditoría) |
| `xp_ledger` | Alumno dueño o miembros de su cohorte (para leaderboard) | Solo vía función interna `rpc_award_xp_idempotent` | Prohibido (Libro contable inmutable) | Prohibido |
| `certificates` | Público por `verification_code` (vía vista/RPC segura); dueño y staff | Solo vía función de cierre de acta / aprobación | Solo `super_admin` (para `is_revoked = true`) | Prohibido |
