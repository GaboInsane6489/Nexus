---
name: nexus-ui-design-system
description: >-
  Standards for building the Nexus user interface using React 19, Next.js App Router, and Tailwind CSS v4.
  Enforces the signature "Luminous Alabaster, Liquid Platinum & Obsidian Ink" visual identity, strict Zero-Emoji policy (modern SVG icons only),
  fluid Mobile-First + Container Query responsive architecture without hardcoded offsets, and highly dynamic/intuitive UX.
  Use this skill when creating or styling UI components, layouts, and pages.
---

# Nexus UI Design System Skill (Luminous Alabaster & Obsidian Ink — Tailwind CSS v4)

Esta skill define las reglas obligatorias de diseño visual, iconografía vectorial, arquitectura responsive fluida e interactividad para **Nexus**.

> Referencia completa: Consulta siempre [`docs/07-SISTEMA-DE-DISENO-Y-UX-UI.md`](../../../docs/07-SISTEMA-DE-DISENO-Y-UX-UI.md).

---

## 1. Reglas Inquebrantables de UI/UX

1. **CERO EMOJIS (Strict Zero-Emoji Policy)**:
   - Prohibido usar emojis en cualquier parte de la interfaz (botones, menús, tarjetas de escuelas, rachas, notificaciones, estados vacíos).
   - Se utiliza exclusivamente **iconografía vectorial moderna de trazo fino** (`lucide-react` + SVGs geométricos personalizados con `strokeWidth={1.75}`).
   - En estados activos o de énfasis, los íconos SVG reciben color `text-[#090B0F]` (o `text-white` sobre superficies `btn-obsidian` / `nav-active-obsidian`) con transiciones sutiles de opacidad y contraste.
2. **Estética "Luminous Alabaster, Liquid Platinum & Obsidian Ink"**:
   - **Canvas principal**: Luminous Alabaster (`#F3F5F9`) con atmósfera `ambient-alabaster`.
   - **Superficies Liquid Platinum**: Tarjetas translúcidas con clase utilitaria `card-glass` (borde especular sutil y desenfoque).
   - **Tinta y Acción Primaria (Obsidian Ink)**: `#090B0F` aplicado en `btn-obsidian` y estado de navegación activo `nav-active-obsidian`, complementado por botones secundarios `btn-glass`.
   - **Acento Cálido**: Ámbar cálido (`#D97706`) para resaltados editoriales, indicadores de progreso clave y estados de atención.
   - **Tipografía Oficial**: `Playfair Display` (títulos editoriales), `Plus Jakarta Sans` (interfaz y cuerpo) y `JetBrains Mono` (códigos, métricas y datos tabulares).
3. **Responsive Fluido en Todo Dispositivo (Prohibido el Responsive Hardcoded)**:
   - Nunca uses valores mágicos fijos en píxeles para posicionar paneles (ej. prohibido `left-[235px]` fijo sin contexto).
   - **Layout Grid Relativo**: El App Shell usa `grid` o `flex` relativo donde los paneles acoplados (como el Drawer de Notificaciones) se posicionan de forma natural en el flujo en Desktop (`md:relative` o anclados al contenedor padre `left-full`) y como `fixed inset-x-0 bottom-0` o `fixed inset-0` (Sheet modal deslizable) en Móvil.
   - **Container Queries (`@container`)**: Las tarjetas de escuelas, cursos, gráficas y tablas deben declararse dentro de contenedores `@container` y usar variantes `@sm:`, `@md:`, `@lg:` para adaptarse automáticamente cuando el sidebar o el drawer de notificaciones se abren o cierran.
   - **Adaptación del Shell por Dispositivo**:
     - `Base (Móvil < 768px)`: Topbar compacto + **Bottom Navigation Dock** fijo de 5 acciones clave + Drawers a pantalla completa (`h-dvh`). Tablas ERP se transforman en tarjetas apiladas o listas maestras-detalle.
     - `Tablet (md: 768px - 1023px)`: Sidebar colapsado en modo **Icon Rail (`w-16`)** expandible sin empujar bruscamente el contenido; grillas de 2 columnas (`md:grid-cols-2`).
     - `Desktop & Ultrawide (lg: 1024px+, xl:, 2xl:)`: Sidebar completo colapsable (`lg:w-60`), grillas fluidas (`lg:grid-cols-3 2xl:grid-cols-4`) y paneles divididos de alta densidad.

---

## 2. Interactividad Dinámica y Experiencia Intuitiva

Nexus debe sentirse como una aplicación nativa instantánea (estilo Linear / Raycast / Platzi moderno):

1. **Command Palette Global (`⌘K` / `Ctrl+K`)**:
   - Modal instantáneo con búsqueda difusa en tiempo real para saltar a cualquier curso, ruta DAG, sesión en vivo, calificación del kardex o acción docente (*"Tomar asistencia"*, *"Calificar entregas"*).
2. **Filtros y Vistas Reactivas sin Recarga**:
   - Búsqueda en vivo en el catálogo de escuelas, filtrado instantáneo por píldoras en el Drawer de Notificaciones (`Sin leer`, `Académico`, `Cohortes`, `Lanzamientos`) y conmutadores de período académico con transiciones suaves.
3. **Micro-interacciones con Propósito Académico**:
   - Barras de progreso animadas con interpolación elástica (`cubic-bezier(0.16, 1, 0.3, 1)`).
   - Tooltips informativos instantáneos en el grafo de prerrequisitos DAG y en el desglose de pesos del libro de calificaciones ($\sum w_i = 100\%$).
   - Guardado optimista (`useOptimistic`) al marcar asistencia o editar celdas de notas en el ERP.
