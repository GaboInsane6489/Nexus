---
name: nexus-architecture-guard
description: >-
  Enforces the modular Feature-First/DDD architecture, strict dependency hierarchy (Levels 0 to 4),
  Next.js App Router conventions, Server Actions patterns, and TypeScript strictness for the Nexus platform.
  Use this skill whenever creating a new module, adding routes, structuring folders, or reviewing architectural boundaries.
---

# Nexus Architecture Guard Skill

Esta skill garantiza que cada línea de código agregada a **Nexus** durante los próximos meses mantenga una arquitectura limpia, escalable y desacoplada.

## 1. Jerarquía Estricta de Dependencias (DAG de Módulos)

Antes de importar cualquier función, componente o tipo entre módulos de `src/modules/`, verifica su nivel:

| Nivel | Módulos | Puede Importar De | Prohibido Importar De |
| :-: | :--- | :--- | :--- |
| **Nivel 0** | `shared`, `modules/iam` | Solo librerías externas y entre sí (`iam` -> `shared`) | Niveles 1, 2, 3, 4 |
| **Nivel 1** | `modules/catalog` | Nivel 0 | Niveles 2, 3, 4 |
| **Nivel 2** | `modules/commerce` | Niveles 0, 1 | Niveles 3, 4 |
| **Nivel 3** | `modules/academic-erp` | Niveles 0, 1, 2 | Nivel 4 |
| **Nivel 4** | `modules/gamification`, `modules/certificates`, `modules/analytics` | Niveles 0, 1, 2, 3 | Ningún nivel inferior puede importarlos |

> **Regla de Oro de Encapsulamiento**: Todo módulo en `src/modules/<domain>/` debe exportar su API pública únicamente a través de `src/modules/<domain>/index.ts`. Queda prohibido hacer imports profundos como `@/modules/catalog/infrastructure/courseRepository`.

## 2. Plantilla Estándar de un Módulo de Dominio

Cuando crees un módulo nuevo en `src/modules/<domain>/`, sigue exactamente esta estructura:

```text
src/modules/<domain>/
├── domain/
│   ├── entities.ts          # Interfaces y tipos de dominio puros
│   ├── rules.ts             # Funciones puras de negocio (testeables sin DB)
│   └── errors.ts            # Errores de dominio tipados
├── application/
│   ├── schemas.ts           # Esquemas Zod para validación de entrada/salida
│   └── use-cases/           # Orquestadores de lógica de negocio
├── infrastructure/
│   ├── queries.ts           # Consultas de lectura a Supabase (Server-side)
│   └── mutations.ts         # Operaciones de escritura / llamadas RPC a Supabase
├── presentation/
│   ├── actions.ts           # Next.js Server Actions ('use server')
│   ├── components/          # Componentes React propios del dominio
│   └── hooks/               # Hooks de cliente (TanStack Query / Realtime)
└── index.ts                 # Barrel file público (solo exporta lo necesario)
```

## 3. Patrones de Next.js App Router y Server Actions

1. **Server Components por Defecto**: Las páginas en `src/app/` deben ser `async` Server Components que obtienen datos directamente desde `application` / `infrastructure` sin pasar por API Routes innecesarias.
2. **Contrato Estándar de Server Actions**: Toda Server Action en `presentation/actions.ts` debe retornar un objeto `ActionResult<T>` discriminado (nunca lanzar excepciones crudas al cliente):
   ```typescript
   export type ActionResult<T = void> =
     | { success: true; data: T; message?: string }
     | { success: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
   ```
3. **Flujo Obligatorio dentro de una Server Action**:
   - Paso 1: Verificar sesión y rol con el guard de `modules/iam`.
   - Paso 2: Validar payload con `schema.safeParse(input)` de Zod.
   - Paso 3: Ejecutar caso de uso o función transaccional de Supabase.
   - Paso 4: Ejecutar `revalidatePath` / `revalidateTag` según corresponda y retornar `ActionResult`.

## 4. Checklist de Validación Arquitectónica

- [ ] ¿Se respetó la dirección de dependencias (Nivel 0 -> Nivel 4)?
- [ ] ¿Se evitó el uso de `any` y de `as unknown as` injustificados?
- [ ] ¿La lógica matemática/negocio reside en `domain/rules.ts` o funciones SQL, y NO dentro de un componente `.tsx`?
- [ ] ¿Los archivos en `src/app/` son delgados (solo enrutamiento, composición de layouts y carga inicial)?
