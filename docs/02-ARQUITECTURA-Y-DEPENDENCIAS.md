# 02 — Arquitectura de Software y Diagramas de Dependencias

> **Propósito de este documento**: Especificar la arquitectura técnica de **Nexus**, sus capas, el diseño modular orientado a dominios (*Feature-Sliced + Clean Domain Boundaries*), los diagramas de dependencias entre módulos, componentes e infraestructura, y los flujos de datos entre **Next.js (App Router)** y **Supabase**.

---

## 1. Arquitectura General del Sistema (Alto Nivel)

Nexus utiliza una arquitectura moderna **Server-First** apalancada en **Next.js App Router**, **React Server Components (RSC)**, **Server Actions** tipadas con **TypeScript** y **Supabase** como plataforma unificada de datos, identidad, seguridad a nivel de fila (RLS), almacenamiento y eventos en tiempo real.

```mermaid
flowchart TB
    subgraph Presentation["1. Capa de Presentación (Cliente & Edge)"]
        PublicPages["Rutas Públicas SSR / ISR<br/>(Catálogo, Rutas, /verify/[code])"]
        RoleDashboards["Dashboards Protegidos por Rol<br/>(Student, Instructor, Coordinator, Admin)"]
        UIKit["Design System Tailwind CSS v4<br/>(Componentes Atómicos + Grillas ERP)"]
        ClientStore["Estado Cliente & Realtime<br/>(TanStack Query + Zustand + Supabase Realtime)"]
    end

    subgraph ApplicationLayer["2. Capa de Aplicación y Orquestación (Next.js Server)"]
        EdgeMiddleware["Next.js Middleware<br/>(Refresco JWT + Guard RBAC por Ruta)"]
        ServerActions["Server Actions Tipadas<br/>(Validación Zod + Verificación Permisos)"]
        WebhookRoutes["Route Handlers (/api/webhooks)<br/>(Stripe / MercadoPago + Crons)"]
        DomainModules["Módulos de Dominio (Niveles 0 al 4)<br/>(Casos de Uso + Reglas Puras)"]
    end

    subgraph DataLayer["3. Capa de Persistencia y Seguridad (Supabase)"]
        SupaAuth["Supabase Auth<br/>(Sesiones + Custom JWT Claims de Rol)"]
        SupaRLS["Políticas Row Level Security (RLS)<br/>(Escudo de Seguridad por Fila)"]
        PostgresDB["PostgreSQL 15+<br/>(24 Tablas + Índices + Vistas)"]
        PLpgSQL["Funciones RPC Transaccionales (PL/pgSQL)<br/>(Matrícula, Cierre de Acta, XP Ledger)"]
        SupaStorage["Supabase Storage<br/>(Buckets: recursos, entregas, certificados, comprobantes)"]
    end

    subgraph ExternalServices["4. Servicios Externos"]
        PaymentGW["Pasarela de Pagos<br/>(Stripe / MercadoPago)"]
        MailService["Motor de Emails Transaccionales<br/>(Resend / Postmark)"]
    end

    PublicPages & RoleDashboards --> UIKit
    RoleDashboards --> ClientStore
    PublicPages & RoleDashboards --> EdgeMiddleware
    RoleDashboards --> ServerActions
    ServerActions --> DomainModules
    WebhookRoutes --> DomainModules
    DomainModules --> SupaAuth
    DomainModules --> SupaRLS
    SupaRLS --> PostgresDB
    DomainModules -->|"Llamadas Atómicas .rpc()"| PLpgSQL
    PLpgSQL --> PostgresDB
    DomainModules --> SupaStorage
    PostgresDB -->|"Eventos WebSocket"| ClientStore
    DomainModules --> PaymentGW
    PaymentGW -->|"Firma HMAC Webhook"| WebhookRoutes
    DomainModules --> MailService
```

---

## 2. Diagrama de Dependencias entre Módulos de Dominio (DAG Arquitectónico)

Para que el proyecto escale durante meses sin convertirse en código espagueti, todos los módulos en `src/modules/` obedecen una **jerarquía de 5 niveles (Nivel 0 a Nivel 4)**.

> **Regla Estricta de Compilación**: Las flechas en el siguiente diagrama significan **"depende de / importa de"**. Todas las flechas apuntan hacia abajo (hacia niveles inferiores). **Queda estrictamente prohibido cualquier ciclo o flecha hacia arriba.**

```mermaid
flowchart BT
    subgraph Level0["NIVEL 0: Núcleo Base e Identidad (Sin dependencias de negocio)"]
        Shared["shared<br/>(Clientes Supabase, UI Kit Tailwind v4, Utils, Tipos Base)"]
        IAM["modules/iam<br/>(Autenticación, Sesiones, Perfiles, Guardas RBAC)"]
    end

    subgraph Level1["NIVEL 1: Dominio Curricular"]
        Catalog["modules/catalog<br/>(Períodos Académicos, Cursos, Módulos, Lecciones, Rutas DAG, Prerrequisitos)"]
    end

    subgraph Level2["NIVEL 2: Dominio Comercial y Matrículas"]
        Commerce["modules/commerce<br/>(Órdenes Pago Único, Cupones, Comprobantes, Derechos de Ruta, Matrículas)"]
    end

    subgraph Level3["NIVEL 3: Dominio ERP Académico"]
        AcademicERP["modules/academic-erp<br/>(Cohortes, Calendario de Sesiones, Asistencia, Evaluaciones, Entregas, Gradebook, Actas)"]
    end

    subgraph Level4["NIVEL 4: Dominio de Retención, Certificación y Analítica"]
        Gamification["modules/gamification<br/>(XP Ledger Idempotente, Niveles, Rachas Diarias, Insignias, Leaderboards)"]
        Certificates["modules/certificates<br/>(Emisión por Conjunción Académica, Hash SHA-256, PDF, Verificador Público)"]
        Analytics["modules/analytics<br/>(KPIs de Ingresos, Tasa de Aprobación, Alertas de Deserción)"]
    end

    IAM --> Shared
    Catalog --> IAM
    Catalog --> Shared
    Commerce --> Catalog
    Commerce --> IAM
    Commerce --> Shared
    AcademicERP --> Commerce
    AcademicERP --> Catalog
    AcademicERP --> IAM
    AcademicERP --> Shared
    Gamification --> AcademicERP
    Gamification --> Catalog
    Gamification --> IAM
    Certificates --> AcademicERP
    Certificates --> Commerce
    Certificates --> Catalog
    Analytics --> Gamification
    Analytics --> Certificates
    Analytics --> AcademicERP
    Analytics --> Commerce
```

---

## 3. Diagrama de Dependencias Internas de un Módulo (Clean Feature Architecture)

Dentro de cada módulo (ej. `src/modules/academic-erp/`), las capas internas también siguen la **Regla de Dependencia Limpia**: la lógica de negocio (`domain`) no conoce ni a React ni a Supabase.

```mermaid
flowchart LR
    subgraph ExternalApp["Capa de Ruteo (src/app)"]
        Pages["Next.js Pages & Layouts (RSC)"]
    end

    subgraph ModuleBoundary["Frontera del Módulo (src/modules/<domain>/)"]
        Index["index.ts (API Pública del Módulo)"]
        
        subgraph Presentation["presentation/"]
            Actions["actions.ts (Server Actions)"]
            Components["components/ (React UI)"]
            Hooks["hooks/ (Client Hooks)"]
        end

        subgraph Application["application/"]
            UseCases["use-cases/ (Orquestadores)"]
            Schemas["schemas.ts (Contratos Zod)"]
        end

        subgraph Infrastructure["infrastructure/"]
            Queries["queries.ts (Lecturas Supabase)"]
            Mutations["mutations.ts (Escrituras / RPC)"]
        end

        subgraph Domain["domain/ (Núcleo Puro)"]
            Entities["entities.ts (Modelos)"]
            Rules["rules.ts (Fórmulas Puras)"]
            Errors["errors.ts (Errores de Dominio)"]
        end
    end

    Pages --> Index
    Index --> Components
    Index --> Actions
    Index --> Queries
    Components --> Actions
    Components --> Hooks
    Actions --> Schemas
    Actions --> UseCases
    UseCases --> Rules
    UseCases --> Entities
    UseCases --> Queries
    UseCases --> Mutations
    Queries --> Entities
    Mutations --> Entities
    Rules --> Entities
    Rules --> Errors
```

### ¿Por qué esta separación interna es vital para un proyecto de varios meses?
1. **Pruebas Unitarias Instantáneas (`domain/rules.ts`)**: Podemos probar todas las fórmulas de cálculo de notas ponderadas, porcentajes de asistencia, validación de grafos de prerrequisitos y curvas de XP en milisegundos con `Vitest`, sin necesidad de levantar la base de datos ni el navegador.
2. **Desacoplamiento de UI (`presentation/` vs `application/`)**: Si mañana cambia el diseño de una pantalla en Tailwind v4, las reglas de negocio y validaciones Zod en `application/` permanecen intactas.
3. **Contratos Claros (`index.ts`)**: Ningún otro módulo puede tocar las tripas privadas de `infrastructure/` de otro dominio.

---

## 4. Diagrama de Dependencias de Datos y Eventos Entre Módulos

Aunque `AcademicERP` (Nivel 3) **no puede importar código** de `Gamification` o `Certificates` (Nivel 4), cuando un estudiante entrega una tarea o aprueba una cohorte, los módulos de Nivel 4 deben reaccionar. Esto se resuelve mediante **Triggers / Funciones Transaccionales en PostgreSQL** y **Orquestadores de Nivel Superior**, manteniendo el acoplamiento en cero:

```mermaid
sequenceDiagram
    autonumber
    participant ERP as Módulo Academic-ERP (Nivel 3)
    participant DB as PostgreSQL (Funciones RPC / Triggers)
    participant GAM as Módulo Gamification (Nivel 4)
    participant CERT as Módulo Certificates (Nivel 4)

    Note over ERP,CERT: Desacoplamiento inverso mediante Base de Datos Transaccional
    ERP->>DB: Ejecuta rpc_close_cohort_gradebook(cohort_id)
    activate DB
    DB->>DB: 1. Calcula final_grade y attendance_pct (Reglas Nivel 3)
    DB->>DB: 2. Marca enrollments como 'completed' o 'failed'
    DB->>DB: 3. Dispara internamente fn_issue_certificate_on_completion() (Datos Nivel 4)
    DB->>DB: 4. Dispara internamente fn_award_xp('course_completed', 250) (Datos Nivel 4)
    DB-->>ERP: Retorna resumen de cierre de acta
    deactivate DB
    GAM->>DB: Lee xp_ledger y user_gamification actualizados
    CERT->>DB: Lee certificado emitido para descarga y verificación
```

---

## 5. Estrategia de Caché, Renderizado y Seguridad en Next.js + Supabase

| Tipo de Ruta / Vista | Estrategia de Renderizado | Mecanismo de Seguridad | Invalidación de Datos |
| :--- | :--- | :--- | :--- |
| **Catálogo de Cursos y Rutas** (`/courses`, `/paths`) | **ISR / Server Components** con caché etiquetado (`use cache` / `revalidateTag('catalog')`) | Lectura pública (`is_published = true` en RLS) | Al publicar o editar un curso desde Coordinación/Admin |
| **Verificador de Certificados** (`/verify/[code]`) | **SSR Dinámico** con cabeceras SEO / OpenGraph | Función RPC pública de solo lectura limitada por `verification_code` | Inmediata si un certificado se emite o revoca |
| **Aula Virtual del Estudiante** (`/student/...`) | **SSR Dinámico + Streaming (`<Suspense>`)** | Middleware verifica rol + RLS verifica `student_id = auth.uid()` y matrícula `active` | `revalidatePath` tras completar lección o entregar evaluación |
| **Libro de Calificaciones y Asistencia** (`/instructor/...`) | **SSR + Estado Optimista en Cliente (`useOptimistic`)** | RLS verifica `cohort.instructor_id = auth.uid()` y `cohort.status != 'closed'` | Mutación por celda o por lote vía Server Action |
| **Webhooks de Pago** (`/api/webhooks/payments`) | **Route Handler (`POST`)** | Verificación criptográfica de firma (`Stripe-Signature` / HMAC) + Cliente Supabase `Service Role` | Transacción atómica en base de datos |
