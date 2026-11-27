---
name: nexus-academic-erp-engine
description: >-
  Governs the core academic ERP business logic: academic periods, cohorts, DAG prerequisite validation,
  weighted gradebook calculations, session attendance tracking, early dropout warning rules, and acta rectifications.
  Use this skill when implementing or modifying any feature related to courses, cohorts, grades, attendance, or prerequisites.
---

# Nexus Academic ERP Engine Skill

Esta skill contiene las reglas exactas y fórmulas del motor académico de **Nexus** (ERP Universitario / Escolar + Rutas de Aprendizaje).

## 1. Validación de Prerrequisitos en Rutas de Aprendizaje (DAG)

- Los cursos dentro de una ruta (`learning_path_items`) y el catálogo general pueden declarar prerrequisitos en `course_prerequisites (course_id, required_course_id, min_grade_required)`.
- **Regla Acíclica**: Al agregar un prerrequisito $A \to B$, se debe verificar mediante búsqueda en grafo (DFS o consulta recursiva CTE en SQL) que $B$ no dependa directa o indirectamente de $A$.
- **Regla de Matrícula**: Un estudiante solo puede matricularse en una cohorte del curso $C$ si para todo prerrequisito $P$ de $C$, existe una matrícula del estudiante en $P$ con `status = 'completed'` (o una convalidación formal registrada por `coordinator`).

## 2. Motor del Libro de Calificaciones Ponderado (`Gradebook`)

Cada cohorte define sus rubros evaluativos (`evaluation_items`), por ejemplo:
- Parcial 1 (`weight_pct = 25.00`)
- Parcial 2 (`weight_pct = 25.00`)
- Laboratorios / Quizzes (`weight_pct = 20.00`)
- Proyecto Final (`weight_pct = 30.00`)

### Fórmulas e Invariantes
1. **Escala Estándar**: Todas las notas (`score`) se almacenan en escala `0.00` a `100.00`.
2. **Suma de Pesos**:
   $$\sum_{i=1}^{n} \text{weight\_pct}_i = 100.00$$
   Mientras la suma sea distinta de `100.00`, la cohorte muestra una advertencia de configuración y **no permite el cierre de acta**.
3. **Cálculo de Nota Acumulada y Final**:
   $$\text{final\_grade} = \text{ROUND}\left(\sum_{i=1}^{n} \left(\text{COALESCE}(\text{score}_i, 0) \times \frac{\text{weight\_pct}_i}{100}\right), 2\right)$$
4. **Entregas No Realizadas**: Si vence el `due_date` y el cierre de notas se ejecuta sin entrega del alumno, el puntaje computado para ese rubro es `0.00` (salvo prórroga autorizada).

## 3. Motor de Control de Asistencia y Riesgo Académico

Cada cohorte tiene $M$ sesiones programadas (`class_sessions`). Para cada estudiante matriculado se registra un estado por sesión:
- `present` = `1.0`
- `excused` (Justificación aprobada por Coordinación con soporte documental) = `1.0`
- `late` (Llegada tardía) = `0.5`
- `absent` = `0.0`

### Cálculo y Alerta Temprana (Early Warning System)
1. **Porcentaje Actual de Asistencia** (sobre sesiones dictadas $M_{\text{dictadas}}$):
   $$\text{attendance\_pct} = \left(\frac{\sum_{j=1}^{M_{\text{dictadas}}} a_j}{M_{\text{dictadas}}}\right) \times 100$$
2. **Porcentaje Máximo Alcanzable** (asumiendo asistencia perfecta en las sesiones restantes $M_{\text{restantes}} = M_{\text{total}} - M_{\text{dictadas}}$):
   $$\text{max\_possible\_attendance} = \left(\frac{\left(\sum_{j=1}^{M_{\text{dictadas}}} a_j\right) + M_{\text{restantes}}}{M_{\text{total}}}\right) \times 100$$
3. **Disparador de Riesgo**:
   - Si $\text{max\_possible\_attendance} < \text{course.min\_attendance\_pct} + 5\%$, la matrícula marca `academic_risk_level = 'warning'`.
   - Si $\text{max\_possible\_attendance} < \text{course.min\_attendance\_pct}$, la matrícula marca `academic_risk_level = 'critical_dropout_risk'` y notifica a Coordinación.

## 4. Cierre de Acta y Flujo de Rectificación

- Cuando `cohort.status` pasa a `'closed'`, ningún profesor puede modificar `submissions` ni `attendance_records`.
- Si se detecta un error material posterior al cierre, el profesor crea una solicitud en `grade_rectifications (submission_id, old_score, new_score, reason, evidence_url)`.
- Solo un `coordinator` o `super_admin` puede aprobar la rectificación, lo cual actualiza la nota, recalcula `final_grade` y deja rastro inmutable en `audit_logs`.
