---
name: nexus-deductive-verification
description: >-
  Enforces strict deductive engineering based on verified empirical facts rather than induction, assumptions, or silent mocks.
  Use this skill before claiming any task, migration, integration, or phase is complete, and whenever working with external
  infrastructure like Supabase, environment variables, database schemas, or APIs.
---

# Nexus Deductive Verification Skill (Hechos Reales vs. Inducción)

Esta skill gobierna la metodología de trabajo de **Nexus**: **Nada se induce ni se asume; todo se deduce a partir de hechos reales y verificables.**

---

## 1. Principio Fundamental: Qué es Inducir vs. Deducir en Ingeniería

- **PROHIBIDO INDUCIR / ASUMIR**:
  - Escribir un archivo `.sql` en una carpeta local y afirmar que *"la base de datos y las políticas RLS ya están listas"*. (Hecho real: el archivo es solo texto en disco hasta que se ejecuta en un motor PostgreSQL real y se comprueba su existencia).
  - Poner datos *mock/hardcoded* o *fallbacks* en `cookies` cuando no hay `.env.local` y afirmar que *"el módulo IAM con Supabase ya está completado"*.
  - Marcar una fase del roadmap como `[x] Completada` solo porque `next build` compiló el frontend sin haber conectado ni probado la infraestructura real.

- **OBLIGATORIO DEDUCIR DESDE HECHOS REALES**:
  1. **Hecho de Configuración**: ¿Existe físicamente el archivo `.env.local` con credenciales reales (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)? Si no existe, el hecho deducido es: **Supabase NO está conectado**.
  2. **Hecho de Base de Datos**: ¿El usuario ya creó el proyecto en el Dashboard de Supabase y ejecutó las migraciones SQL? ¿Responde la API de Supabase confirmando que las tablas `profiles`, `user_roles`, `audit_logs` existen? Si no, el hecho deducido es: **El esquema SQL está redactado localmente, pero NO existe en base de datos**.
  3. **Hecho de Integración E2E**: ¿Se creó un usuario real en `auth.users`, se disparó el trigger real en PostgreSQL y se leyó la fila real desde `public.profiles` respetando RLS? Solo cuando esto ocurre se puede deducir que la fase está completada.

---

## 2. Protocolo de Verificación de Estado antes de Reportar al Usuario

Siempre separa tu reporte de avance en **dos categorías estrictas**:

1. **Lo que existe como hecho verificado hoy**:
   - Ejemplo: *"Se redactó el script SQL en `supabase/migrations/...` y el código TypeScript compila con `tsc --noEmit`."*
2. **Lo que falta en la realidad física (Bloqueadores / Pasos Reales Pendientes)**:
   - Ejemplo: *"El proyecto en Supabase aún no ha sido creado ni conectado en `.env.local`, y las tablas aún no existen en PostgreSQL. Por lo tanto, la Fase 2 está EN PROGRESO, no terminada."*

---

## 3. Regla contra Mocks Silenciosos en Infraestructura

- En `src/modules/*/infrastructure/`, nunca ocultes la ausencia de Supabase devolviendo datos falsos como si vinieran de la base de datos.
- Si `NEXT_PUBLIC_SUPABASE_URL` no está configurado o la tabla no existe en Supabase, el sistema debe informar con transparencia diagnóstica qué variable de entorno o tabla real falta configurar.

---

## 4. Regla Zero-Hardcode & No-Mock-Widgets

- **Prohibido renderizar datos sintéticos en UI**: No uses arreglos hardcodeados en componentes, *countdowns* ficticios, *leaderboards* inventados ni simuladores de rol basados en `cookies`.
- **Estados vacíos explícitos**: Cuando una tabla real en Supabase tenga `0` filas para una consulta válida, la interfaz debe renderizar un estado vacío explícito e informativo (sin rellenar con datos de ejemplo).
