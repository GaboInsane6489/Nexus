# 07 — Sistema de Diseño, Arquitectura Responsive y UX Interactiva (Luminous Alabaster, Liquid Platinum & Obsidian Ink)

> **Propósito de este documento**: Definir la identidad visual **Luminous Alabaster (`#F3F5F9`), Liquid Platinum (`card-glass`) & Obsidian Ink (`#090B0F`)** con acento ámbar (`#D97706`) y tipografía `Playfair Display` + `Plus Jakarta Sans` + `JetBrains Mono`, el sistema de **iconografía vectorial moderna (Cero Emojis)**, la **arquitectura responsive fluida multi-dispositivo en Tailwind CSS v4 (sin valores hardcoded)** y los patrones de **interactividad dinámica** de **Nexus**.

---

## 1. Filosofía Visual y Regla "Cero Emojis"

Para proyectar una imagen tecnológica de primer nivel que supere los estándares de la industria:

1. **Política Estricta de Cero Emojis (`Zero-Emoji Standard`)**:
   - Queda prohibido el uso de emojis del sistema en cualquier pantalla, tarjeta, alerta, insignia o menú. Los emojis se renderizan distinto en Windows, macOS, iOS y Android, rompiendo la estética premium.
   - **Iconografía Vectorial Unificada**: Se utiliza `lucide-react` complementado con emblemas SVG geométricos personalizados (`viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.75"`, `stroke-linecap="round"`, `stroke-linejoin="round"`).
   - **Acabado Liquid Platinum en Iconos**: Los íconos de escuelas, rachas y estados activos utilizan trazos en tinta obsidiana (`#090B0F`) o acento ámbar (`#D97706`) sobre contenedores `card-glass` en platino translúcido con bordes sutiles (`border-slate-900/10`) y reflejo especular.

2. **Sistema Cromático "Luminous Alabaster, Liquid Platinum & Obsidian Ink"**:
   - **Lienzo y Superficies Luminosas**:
     - `--color-alabaster` (`#F3F5F9`): Fondo base luminoso del canvas principal.
     - `card-glass` (`Liquid Platinum`): Superficie de tarjetas con vidrio esmerilado, gradiente platino translúcido y borde sutil de alta precisión.
     - `--color-obsidian-ink` (`#090B0F`): Tinta primaria de alto contraste para tipografía estructural, encabezados y controles activos.
   - **Acento Ámbar y Tipografía Editorial**:
     - `--color-amber-accent` (`#D97706`): Acento cálido para estados destacados, indicadores de progreso, alertas tempranas y llamadas a la acción clave.
     - **Sistema Tipográfico**:
       - `Playfair Display`: Títulos editoriales de alto impacto y encabezados principales.
       - `Plus Jakarta Sans`: Tipografía de interfaz, cuerpo de texto, formularios y navegación.
       - `JetBrains Mono`: Códigos de curso, hashes SHA-256, métricas numéricas, calificaciones y porcentajes tabulares.

---

## 2. Arquitectura Responsive Fluida en Tailwind CSS v4 (Sin Hardcoding)

La interfaz de **Nexus** no usa anchos ni posiciones fijas rígidas (`hardcoded`) que rompan la experiencia en pantallas pequeñas, tablets o monitores ultrawide. Se construye mediante **Flexbox/Grid relativo**, **Variables CSS dinámicas** y **Container Queries (`@container`)** nativas de Tailwind v4.

```mermaid
flowchart TD
    subgraph ResponsiveEngine["Motor Responsive Adaptativo (Tailwind CSS v4)"]
        Viewport["Detección Fluida de Viewport + Container Queries (@container)"]
        
        subgraph Mobile["Móvil (< 768px : Base -> sm:)"]
            M1["Topbar Compacto Sticky (h-14) con Omnibox Modal"]
            M2["Bottom Navigation Dock Fijo (5 vistas principales con iconos SVG)"]
            M3["Drawer de Notificaciones como Bottom Sheet / Full Overlay (h-dvh)"]
            M4["Grillas de 1 columna (grid-cols-1) y Tablas ERP en modo Tarjeta Expandible"]
        end

        subgraph Tablet["Tablet (768px - 1023px : md:)"]
            T1["Sidebar en modo Icon Rail (md:w-16) expandible con transición suave"]
            T2["Drawer acoplado relativo al Rail (left-full) con Backdrop Blur"]
            T3["Grillas de 2 columnas (@md:grid-cols-2) y Split View apilado"]
        end

        subgraph Desktop["Desktop & Ultrawide (1024px+ : lg: / xl: / 2xl:)"]
            D1["Sidebar Completo Colapsable (lg:w-60 -> lg:w-16 con estado persistente)"]
            D2["Workspace con Container Queries (@container/main) que reacomoda columnas al abrir Drawers"]
            D3["Grillas de 3 a 4 columnas (@lg:grid-cols-3 @2xl:grid-cols-4)"]
            D4["Libro de Calificaciones ERP completo con columnas sticky"]
        end

        Viewport --> Mobile
        Viewport --> Tablet
        Viewport --> Desktop
    end
```

### 2.1 Patrones Técnicos de Tailwind v4 para Evitar el Hardcoding

| Problema Común (Hardcoded) | Solución Arquitectónica en Nexus (Tailwind v4) |
| :--- | :--- |
| Posicionar el Drawer de Notificaciones con `left-[235px]` fijo (se rompe en móvil o al colapsar el sidebar). | Contenedor padre `relative flex` donde el Sidebar define el flujo y el Drawer usa `fixed inset-0 z-50 md:absolute md:inset-y-0 md:left-full md:w-88 lg:w-96`. Así, si el sidebar mide `4rem` (colapsado) o `15rem` (expandido), `md:left-full` lo acopla exactamente al borde derecho sin un solo píxel hardcodeado. |
| Usar solo `@media (min-width)` para las tarjetas de escuelas (se aplastan cuando se abre un panel lateral). | Declarar el área principal como `@container/workspace` y usar clases de **Container Query**: `grid grid-cols-1 @sm/workspace:grid-cols-2 @xl/workspace:grid-cols-3 @4xl/workspace:grid-cols-4 gap-3.5`. |
| Usar `100vh` que se corta con la barra de direcciones en navegadores móviles (Safari/Chrome iOS/Android). | Usar siempre unidades dinámicas de viewport de Tailwind v4: `min-h-dvh` y `h-dvh`, más `pb-[env(safe-area-inset-bottom)]` en el Bottom Dock móvil. |
| Tipografías gigantes que desbordan en pantallas de `360px` de ancho. | Escala tipográfica responsiva fluida: `text-lg sm:text-xl lg:text-2xl` y truncado inteligente (`min-w-0 truncate`, `line-clamp-2`). |

---

## 3. Interactividad Dinámica y Experiencia de Usuario Intuitiva

Nexus está diseñado para sentirse instantáneo, vivo y sumamente intuitivo en cada interacción:

### 3.1 Sistema de Interacciones en Tiempo Real
1. **Omnibox & Command Palette (`⌘K` / `Ctrl+K`)**:
   - Al hacer clic en el buscador superior o presionar `⌘K`, se abre una paleta de comandos flotante con filtrado instantáneo por teclado (`↑` `↓` `Enter` `Esc`).
   - Busca simultáneamente en **Escuelas**, **Rutas DAG**, **Cursos**, **Acciones Rápidas del ERP** (*"Consultar mi Kardex"*, *"Subir justificativo de asistencia"*) y el **Asistente IA**.
2. **Filtrado Reactivo y Conmutación Instantánea**:
   - En la vista **Inicio / Escuelas**, el usuario puede escribir para filtrar facultades en tiempo real o desplegar el acordeón animado de **Nuevos Lanzamientos y Cohortes Abiertas**.
   - En el **Drawer de Notificaciones**, las píldoras (`Todas`, `Sin leer`, `Académico`, `Lanzamientos`) filtran los eventos instantáneamente con contador dinámico de no leídos y botón de *"Marcar todas como leídas"*.
3. **Gráficas y Simuladores Académicos Interactivos**:
   - En **Mi Progreso y Kardex**, pasar el cursor o tocar cada barra de la semana muestra el detalle exacto de clases vistas, minutos estudiados y puntos XP ganados ese día.
   - En **Aula & ERP Académico**, el estudiante cuenta con un **Simulador Interactivo de Nota Final**: puede deslizar un control sobre sus evaluaciones pendientes (ej. *Proyecto Final*) para ver en vivo cómo impactará su promedio ponderado final y qué nota mínima necesita para aprobar y desbloquear su certificado.

---

## 4. Anatomía de las Vistas y Rutas del App Router (Diseño Vectorial & Responsive)

Las rutas reales de **Nexus** en Next.js App Router aplican el sistema **Luminous Alabaster, Liquid Platinum & Obsidian Ink** con `@container` queries y cero emojis:

### 4.1 Inicio y Explorador de Facultades (`/`)
- **Banner de Convocatoria Académica con Countdown en Vivo**: Diseño adaptativo (`flex-col lg:flex-row`) con reloj regresivo funcional segundo a segundo y CTA en Obsidian Ink (`#090B0F`) con acento ámbar (`#D97706`).
- **Separador Interactivo de Novedades**: Píldora central de nuevas cohortes y cursos lanzados que despliega suavemente las tarjetas de estreno en `card-glass`.
- **Grilla Adaptativa de Escuelas (`@container`)**: Tarjetas con emblema vectorial SVG de alto contraste, indicador de rutas de aprendizaje y cohortes activas, y filtro de búsqueda instantáneo.

### 4.2 Rutas de Aprendizaje DAG (`/paths`) y Comercio (`/commerce`)
- **`/paths`**: Visualizador y gestor de rutas curriculares con grafo dirigido acíclico (DAG) de prerrequisitos, estado de desbloqueo por curso y progreso acumulado.
- **`/commerce`**: Catálogo transaccional de pago único, aplicación de cupones/becas, aprobación de órdenes pendientes y activación inmediata de matrículas en cohortes con cupo disponible.

### 4.3 Aula & ERP Académico (`/erp`)
- Desglose de rubros ponderados ($\sum w_i = 100\%$), toma y consulta de asistencia por sesión con estados vectoriales claros, simulador interactivo de proyección de nota final y cierre/rectificación de actas.

### 4.4 Mi Progreso y Kardex ERP (`/progress`) y Perfil Verificable (`/profile`)
- **`/progress`**: En móvil y tablet se apila verticalmente (`grid-cols-1`); en escritorio se distribuye en proporción `xl:grid-cols-12` (`8 columnas` para la gráfica semanal interactiva + tarjetas de Kardex ERP y `4 columnas` para el Leaderboard semanal de la cohorte). Incluye racha activa, promedio ponderado (`0-100`), porcentaje de asistencia con umbral mínimo y ranking vectorial.
- **`/profile`**: Banner geométrico en Liquid Platinum, cabecera responsiva con insignia de nivel, acciones adaptativas (`w-full sm:w-auto`) y grilla responsiva (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`) de métricas académicas, insignias y certificados SHA-256.

### 4.5 Verificación Pública (`/verify`), Analítica (`/analytics`) y Gestión IAM (`/admin/users`)
- **`/verify`**: Portal público SSR de validación criptográfica SHA-256 para certificados emitidos (`VALID`, `REVOKED`, `NOT_FOUND`).
- **`/analytics`**: Tablero ejecutivo con métricas en tiempo real de catálogo, ingresos/cupos, desempeño ERP y gamificación.
- **`/admin/users`**: Consola de gobierno IAM para asignación de roles (`super_admin`, `coordinator`, `instructor`, `student`) y auditoría operativa.
