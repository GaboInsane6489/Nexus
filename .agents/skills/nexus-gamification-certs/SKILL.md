---
name: nexus-gamification-certs
description: >-
  Governs the gamification engine (idempotent XP ledger, progressive level curve, daily streaks with freeze protection,
  badge unlocking, cohort leaderboards) and the verifiable certificate issuance engine (cryptographic hash, QR, public SSR verification).
  Use this skill when working on XP, streaks, badges, leaderboards, or certificates.
---

# Nexus Gamification & Verifiable Certificates Skill

Esta skill define las reglas matemáticas, de seguridad e idempotencia para los motores de **Gamificación** y **Certificación Verificable** de **Nexus**.

## 1. Libro Mayor de Experiencia (`xp_ledger`) y Regla Anti-Farming

Nunca sumes XP incrementando directamente un contador suelto desde el frontend. Todo punto de experiencia debe ser el resultado de una transacción en `xp_ledger`:

- **Clave de Idempotencia**: `UNIQUE (user_id, event_type, reference_id)`.
- **Tabla de Recompensas Base**:
  - `lesson_completed`: `+15 XP` (`reference_id = lesson_id`)
  - `session_attended_ontime`: `+25 XP` (`reference_id = session_id`)
  - `submission_early` (entregado $\ge 24\text{h}$ antes del límite): `+30 XP` (`reference_id = evaluation_id`)
  - `assessment_excellence` (nota $\ge 90.00$): `+50 XP` (`reference_id = evaluation_id`)
  - `course_completed`: `+250 XP` (`reference_id = enrollment_id`)
  - `learning_path_completed`: `+1000 XP` (`reference_id = learning_path_id`)

## 2. Curva de Niveles y Sistema de Rachas (`Streaks`)

1. **Fórmula de Nivel Progresivo**:
   El XP total acumulado requerido para alcanzar el nivel $L$ ($L \ge 1$) está dado por:
   $$\text{XP}_{\text{requerido}}(L) = \lfloor 100 \times (L - 1)^{1.5} \rfloor$$
   *(Nivel 1 = 0 XP, Nivel 2 = 100 XP, Nivel 3 = 282 XP, Nivel 5 = 800 XP, Nivel 10 = 2700 XP).*
2. **Lógica de Racha Diaria (`current_streak_days`)**:
   - Se evalúa según la fecha en la zona horaria del estudiante al completar cualquier actividad académica válida (`lesson_completed`, `submission`, `session_attended`).
   - Si `last_activity_date == hoy`: mantiene la racha actual.
   - Si `last_activity_date == ayer`: `current_streak_days += 1`.
   - Si `last_activity_date < ayer`:
     - Si tiene `streak_freezes_available > 0` y solo faltó 1 día: consume 1 `streak_freeze` y conserva la racha.
     - En caso contrario: se reinicia `current_streak_days = 1`.
3. **Multiplicador por Racha**:
   - Racha $\ge 7$ días: Multiplicador `1.2x` sobre el XP base de lecciones.
   - Racha $\ge 30$ días: Multiplicador `1.5x` sobre el XP base de lecciones.

## 3. Motor de Certificados Verificables

### Condición Estricta de Emisión
Un certificado se emite única y exclusivamente cuando la matrícula (`enrollment`) cumple:
1. `enrollment.status = 'completed'`
2. `enrollment.final_grade >= course.min_passing_grade`
3. `enrollment.attendance_pct >= course.min_attendance_pct`
4. `order.payment_status = 'paid'`

### Estructura de Verificación Pública (`/verify/[code]`)
- **Código Público Legible**: Formato `NEX-{YEAR}-{8_CHAR_ALPHANUMERIC}` (ej. `NEX-2027-8K4M9P2X`).
- **Hash de Integridad (`signature_hash`)**: SHA-256 generado en servidor sobre `enrollment_id + student_document_id + course_code + final_grade + issued_at + SECRET_SALT`.
- **Página Pública `/verify/[code]`**:
  - Renderizada en servidor (SSR) con metadatos OpenGraph para compartir en LinkedIn.
  - Muestra: Nombre completo del graduado, Curso/Programa, Créditos/Horas, Fecha de emisión, Nota Final (opcional según privacidad del alumno), Insignia obtenida y estado **VÁLIDO / REVOCADO**.
