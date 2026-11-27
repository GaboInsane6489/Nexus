# Contexto Maestro y Reglas de Ingeniería — Proyecto NEXUS

Este archivo define el contexto permanente, las reglas arquitectónicas y los estándares de ingeniería para **Nexus** (Sistema Educativo Híbrido: LMS Comercial + ERP Académico). Todo agente o desarrollador que trabaje en este repositorio debe respetar estas directrices en cada fase del proyecto.

---

## 1. Identidad del Producto y Stack Tecnológico

- **Producto**: Plataforma educativa multi-rol en una sola instancia que combina **ERP Académico** (períodos, cohortes, matrículas, control de asistencia, calificaciones ponderadas, actas) con **LMS Comercial y Gamificado** (venta individual de cursos/programas por pago único, rutas de aprendizaje personalizadas con prerrequisitos DAG, puntos XP, rachas diarias, insignias y certificados verificables).
- **Roles del Sistema (`app_role`)**:
  1. `super_admin`: Gobierno total del sistema, finanzas, pasarelas, configuración y auditoría.
  2. `coordinator`: Gestión de períodos académicos, creación de rutas, apertura de cohortes, asignación docente, justificación de asistencias y cierre/rectificación de actas.
  3. `instructor`: Gestión pedagógica de sus cohortes asignadas, toma de asistencia, creación/calificación de evaluaciones y retroalimentación.
  4. `student`: Compra individual de cursos/programas, avance en rutas personalizadas, entrega de evaluaciones, seguimiento de asistencia/notas (kardex), gamificación y certificados.
- **Stack Obligatorio**:
  - **Framework**: Next.js (App Router, Server Components por defecto, Server Actions para mutaciones).
  - **Lenguaje**: TypeScript en modo estricto (`strict: true`, prohibido el uso de `any`).
  - **UI & Estilos**: React + Tailwind CSS v4 (configuración CSS-first mediante `@theme` y variables CSS nativas).
  - **Identidad Visual y Estándares UX/UI**:
    - **Paleta Oficial**: **Luminous Alabaster (`#F3F5F9`)**, **Liquid Platinum (`card-glass`)** y **Obsidian Ink (`#090B0F`)** con acento ámbar cálido (`#D97706`). Prohibido el verde estilo Platzi.
    - **Cero Emojis (Zero-Emoji Policy)**: Queda estrictamente prohibido el uso de emojis en cualquier componente de interfaz, botón, notificación, badge o estado. Toda la iconografía debe ser vectorial de alto nivel (`lucide-react` o SVGs geométricos personalizados con `stroke-width` consistente de `1.5` a `1.75`).
    - **Responsive Nativo y Fluido (Sin Hardcoding)**: Prohibido usar offsets o dimensiones rígidas hardcodeadas que rompan en móvil o tablet. Es obligatorio el diseño *Mobile-First* con clases utilitarias de Tailwind v4 (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`), unidades dinámicas de viewport (`dvh`), y **Container Queries (`@container`)** para componentes modulares.
    - **Interactividad Dinámica e Intuitiva**: Uso obligatorio de actualizaciones optimistas (`useOptimistic`), Command Palette interactivo (`⌘K`), transiciones fluidas de estado, filtros instantáneos y navegación por teclado.
  - **Backend & Persistencia**: Supabase (PostgreSQL, Supabase Auth con Custom JWT Claims, Row Level Security obligatorio en todas las tablas, Supabase Storage y Supabase Realtime).
  - **Validación**: Esquemas `zod` compartidos entre formularios de cliente y Server Actions.

---

## 2. Reglas de Arquitectura Modular y Dirección de Dependencias

El sistema se divide en **5 niveles estrictos de dependencia**. Un módulo **NUNCA** puede importar código de un módulo de nivel superior:

1. **Nivel 0 (`shared`, `modules/iam`)**: Utilidades base, clientes Supabase, UI Kit atómico, autenticación y control de acceso basado en roles (RBAC).
2. **Nivel 1 (`modules/catalog`)**: Períodos académicos, cursos, módulos, lecciones y grafo de rutas de aprendizaje (`learning_paths` + prerrequisitos). Depende solo de Nivel 0.
3. **Nivel 2 (`modules/commerce`)**: Órdenes de compra (pago único), detalle de órdenes, pasarela de pagos y activación de matrículas (`enrollments`). Depende de Niveles 0 y 1.
4. **Nivel 3 (`modules/academic-erp`)**: Cohortes, sesiones sincrónicas/presenciales, registros de asistencia, rubros de evaluación, entregas y libro de calificaciones (`gradebook`). Depende de Niveles 0, 1 y 2.
5. **Nivel 4 (`modules/gamification`, `modules/certificates`, `modules/analytics`)**: Motor de XP/rachas/insignias, emisión/verificación de certificados y reportes ejecutivos. Consume eventos o estados de Niveles 0 a 3.

### Estructura Interna de Cada Módulo (`src/modules/<nombre>/`)
Cada módulo de dominio debe encapsular sus capas y exponer únicamente su API pública a través de `index.ts`:
- `domain/`: Tipos, interfaces, entidades y reglas puras de negocio (sin dependencias de React ni de infraestructura).
- `application/`: Casos de uso, validadores Zod y orquestadores de lógica.
- `infrastructure/`: Repositorios y consultas a Supabase / servicios externos.
- `presentation/`: Componentes React específicos del dominio, hooks y Server Actions (`actions.ts`).
- `index.ts`: Fachada pública del módulo (prohibido importar archivos internos de otro módulo saltándose su `index.ts`).

---

## 3. Reglas Inquebrantables de Base de Datos, Lógica de Negocio y Metodología Deductiva

0. **Metodología Deductiva desde Hechos Reales (Prohibido Inducir o Asumir)**:
   - **Nada se induce ni se da por supuesto**: Escribir un archivo `.sql` local o hacer que `next build` compile NO significa que Supabase esté listo ni que una fase esté terminada.
   - **Prohibido declarar completitud sin verificación real**: Ninguna fase, tabla, trigger o integración se marca como `[x] Completada` hasta que el proyecto real en Supabase esté creado, las variables en `.env.local` estén conectadas, los esquemas/tablas estén creados en el motor PostgreSQL real y las consultas/mutaciones hayan sido probadas contra datos reales.
   - **Prohibido enmascarar con Mocks silenciosos**: No uses datos falsos en `cookies` o memoria para simular que Supabase ya funciona. Si la base de datos aún no está conectada o creada, el sistema y el agente deben reportar explícitamente qué paso real falta ejecutar.
1. **Seguridad RLS Primero**: Ninguna tabla en el esquema `public` de Supabase puede existir sin `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
2. **Integridad Financiera y de Matrículas**: Una matrícula (`enrollments`) solo pasa a estado `active` mediante una transacción verificada (webhook de pago confirmado o beca/asignación autorizada por `super_admin`/`coordinator` registrada en auditoría).
3. **Invariante del Libro de Calificaciones**: La suma de los pesos (`weight_pct`) de los rubros de evaluación (`evaluation_items`) de una cohorte debe sumar exactamente `100.00%` para permitir el cierre del acta.
4. **Inmutabilidad de Actas Cerradas**: Cuando una cohorte pasa a estado `closed`, las notas y asistencias quedan bloqueadas por políticas RLS y triggers SQL. Cualquier cambio posterior requiere un registro en `grade_rectifications` aprobado por `coordinator` o `super_admin`.
5. **Conjunción de Certificación**: Un certificado solo se emite si y solo si:
   - `final_grade >= course.min_passing_grade`
   - `attendance_pct >= course.min_attendance_pct`
   - La orden asociada está en estado `paid`.
6. **Idempotencia en Gamificación**: Todo otorgamiento de XP debe registrarse en `xp_ledger` con clave única compuesta `(user_id, event_type, reference_id)` para impedir el *farming* o duplicación de puntos.

---

## 4. Uso de Skills y Documentación de Referencia

Antes de diseñar o implementar cualquier funcionalidad, consulta siempre:
- La documentación maestra en [`/docs`](./docs/00-CONTEXTO-Y-SKILLS.md).
- Las **Skills especializadas** ubicadas en `.agents/skills/`:
  - `nexus-deductive-verification`: Obligatoria en todo momento. Impide inducir o asumir estados no verificados (ej. asumir que Supabase o las tablas existen sin haberlas creado y probado realmente).
  - `nexus-architecture-guard`: Para crear nuevos módulos, rutas o validar arquitectura.
  - `nexus-supabase-dba`: Para crear tablas, funciones RPC, triggers o políticas RLS.
  - `nexus-academic-erp-engine`: Para lógica de notas, asistencia, cohortes y prerrequisitos.
  - `nexus-gamification-certs`: Para lógica de experiencia (XP), rachas, insignias y certificados.
  - `nexus-ui-design-system`: Para construir interfaces con Tailwind CSS v4.
