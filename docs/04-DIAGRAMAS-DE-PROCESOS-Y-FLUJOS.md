# 04 — Diagramas de Procesos de Negocio y Máquinas de Estado

> **Propósito de este documento**: Modelar todos los procesos operativos, comerciales y académicos de **Nexus** mediante diagramas de secuencia detallados y diagramas de máquinas de estado (`Statecharts`). Estos diagramas son el plano directo para programar los casos de uso y funciones RPC en las Fases 2 a 6.

---

## 1. Proceso 1: Compra Individual (Curso o Ruta) -> Activación de Matrícula

Cubre tanto el flujo automático por pasarela (Stripe/MercadoPago) como el flujo institucional por comprobante bancario o uso de crédito de ruta previamente adquirida.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Estudiante
    participant UI as Next.js UI (Checkout)
    participant SA as Server Action (commerce)
    participant DB as Supabase PostgreSQL
    participant GW as Pasarela (Stripe / MP)
    actor Coord as Coordinador / Finanzas

    Student->>UI: Elige Cohorte de Curso o Ruta de Aprendizaje
    UI->>SA: initiateCheckout(itemId, cohortId, paymentMethod)
    SA->>DB: Ejecuta fn_validate_enrollment_eligibility(studentId, courseId, cohortId)
    Note right of DB: Verifica:<br/>1. Cupo disponible en Cohorte<br/>2. Prerrequisitos DAG aprobados<br/>3. No estar ya matriculado
    alt No cumple prerrequisitos o sin cupo
        DB-->>SA: Retorna código de bloqueo (PREREQ_MISSING | COHORT_FULL)
        SA-->>UI: Muestra error detallado y qué curso previo debe aprobar
    else Elegible para matrícula
        SA->>DB: Crea registro en ORDERS (status: 'pending') y ORDER_ITEMS
        alt Pago Online (Tarjeta / Billetera)
            SA->>GW: Crea Checkout Session con metadata {order_id, cohort_id}
            GW-->>UI: Redirige a pasarela de pago
            Student->>GW: Realiza el pago
            GW->>SA: POST /api/webhooks/payments (Firma verificada)
            SA->>DB: RPC rpc_confirm_order_and_enroll(order_id, provider_ref)
        else Pago por Transferencia Bancaria
            Student->>UI: Sube comprobante PDF/Imagen a Supabase Storage
            UI->>SA: submitPaymentReceipt(orderId, fileUrl)
            SA->>DB: Actualiza ORDERS a status: 'under_review'
            Coord->>UI: Revisa comprobante en Panel de Tesorería
            Coord->>SA: approveManualOrder(orderId)
            SA->>DB: RPC rpc_confirm_order_and_enroll(order_id, 'MANUAL_APPROVED')
        end
        Note over DB: Transacción Atómica en rpc_confirm_order_and_enroll:<br/>1. ORDERS -> 'paid'<br/>2. Incrementa enrolled_count en COHORTS<br/>3. Crea ENROLLMENTS (status: 'active') o PATH_ENTITLEMENTS<br/>4. Otorga XP inicial en XP_LEDGER
        DB-->>Student: Notificación Realtime + Email de Bienvenida al Aula Virtual
    end
```

---

## 2. Proceso 2: Toma de Asistencia, Cálculo de Riesgo y Justificaciones

Describe cómo interactúan el **Instructor**, el **Estudiante** y el **Coordinador** en el control de asistencia de cada sesión de clase y cómo se dispara el sistema de alerta temprana de deserción.

```mermaid
sequenceDiagram
    autonumber
    actor Inst as Instructor
    actor Stud as Estudiante
    actor Coord as Coordinador Académico
    participant UI as Next.js App
    participant SA as Server Action (academic-erp)
    participant DB as Supabase PostgreSQL

    Inst->>UI: Abre Sesión de Clase N en su Cohorte activa
    UI->>SA: saveSessionAttendance(sessionId, records[])
    SA->>DB: RPC rpc_record_session_attendance(sessionId, records[])
    activate DB
    DB->>DB: 1. Upsert en ATTENDANCE_RECORDS (present=1.0, late=0.5, absent=0.0)
    DB->>DB: 2. Marca CLASS_SESSIONS.is_attendance_taken = true
    DB->>DB: 3. Para cada alumno presente a tiempo -> rpc_award_xp('session_ontime', +25 XP)
    DB->>DB: 4. Recalcula ENROLLMENTS.attendance_pct y max_possible_attendance
    alt max_possible_attendance < min_attendance_pct
        DB->>DB: Marca academic_risk_level = 'critical_dropout_risk'
        DB-->>Coord: Alerta en Dashboard de Coordinación (Riesgo por Inasistencia)
    end
    deactivate DB
    DB-->>UI: Confirmación y estadísticas de la sesión

    opt Flujo de Justificación de Inasistencia
        Stud->>UI: Sube certificado médico / justificativo para Sesión N
        UI->>SA: requestAttendanceJustification(attendanceRecordId, reason, fileUrl)
        SA->>DB: Inserta en ATTENDANCE_JUSTIFICATIONS (status: 'pending')
        Coord->>UI: Revisa evidencia en Bandeja de Justificaciones
        Coord->>SA: resolveJustification(justificationId, 'approved')
        SA->>DB: RPC rpc_resolve_attendance_justification()
        Note right of DB: 1. Cambia ATTENDANCE_RECORDS.status a 'excused' (peso 1.0)<br/>2. Recalcula attendance_pct y actualiza academic_risk_level
    end
```

---

## 3. Proceso 3: Evaluación, Calificación Ponderada, Cierre de Acta y Certificación

Modela el flujo completo desde que el instructor configura los rubros de evaluación ($\sum w_i = 100\%$), los alumnos entregan, el instructor califica y finalmente se cierra el acta de la cohorte disparando los certificados.

```mermaid
sequenceDiagram
    autonumber
    actor Inst as Instructor
    actor Stud as Estudiante
    actor Coord as Coordinador
    participant SA as Server Actions (academic-erp)
    participant DB as Supabase PostgreSQL
    participant Cert as Motor Certificados & Gamificación

    Inst->>SA: configureEvaluationItems(cohortId, items[])
    SA->>DB: Valida que suma de weight_pct == 100.00% y guarda EVALUATION_ITEMS

    Stud->>SA: submitAssessment(evaluationId, fileUrl, text)
    SA->>DB: Verifica now() <= due_date -> Inserta en SUBMISSIONS
    DB->>Cert: Si entregó >= 24h antes -> Otorga +30 XP ('submission_early')

    Inst->>SA: gradeSubmission(submissionId, score, feedback)
    SA->>DB: Actualiza SUBMISSIONS (score, feedback, graded_at)
    DB->>DB: Trigger actualiza promedio parcial en ENROLLMENTS.final_grade
    DB->>Cert: Si score >= 90.00 -> Otorga +50 XP ('assessment_excellence')

    Note over Inst,Coord: Fin del Período Lectivo de la Cohorte
    Inst->>SA: requestCohortClosure(cohortId)
    Coord->>SA: executeCohortClosure(cohortId)
    SA->>DB: RPC Transaccional rpc_close_cohort_gradebook(cohortId)
    activate DB
    DB->>DB: 1. Verifica que suma de pesos = 100% y todas las sesiones tengan asistencia
    DB->>DB: 2. Calcula final_grade y attendance_pct definitivos por alumno
    loop Para cada Enrollment de la Cohorte
        alt final_grade >= min_passing_grade AND attendance_pct >= min_attendance_pct
            DB->>DB: enrollment.status = 'completed'
            DB->>Cert: Emite registro en CERTIFICATES (código NEX-YYYY-XXXX + SHA256)
            DB->>Cert: Otorga +250 XP ('course_completed') + Desbloquea siguiente curso en DAG
        else Reprobado por Nota o Asistencia
            DB->>DB: enrollment.status = 'failed_grade' o 'failed_attendance'
        end
    end
    DB->>DB: 3. Cambia COHORTS.status = 'closed' (Bloquea escrituras futuras)
    deactivate DB
```

---

## 4. Proceso 4: Rectificación Auditada de Calificación en Acta Cerrada

En un ERP universitario real, un acta cerrada es sagrada, pero pueden existir errores materiales o reclamos válidos. Este flujo garantiza trazabilidad total:

```mermaid
sequenceDiagram
    autonumber
    actor Inst as Instructor
    actor Coord as Coordinador / Super Admin
    participant SA as Server Action
    participant DB as Supabase PostgreSQL

    Inst->>SA: createGradeRectificationRequest(submissionId, newScore, reason, evidenceUrl)
    SA->>DB: Verifica que cohort.status == 'closed'
    DB->>DB: Crea registro en GRADE_RECTIFICATIONS (status: 'pending')
    DB-->>Coord: Notifica solicitud pendiente de auditoría

    Coord->>SA: reviewGradeRectification(rectificationId, decision: 'approved')
    SA->>DB: RPC Transaccional rpc_approve_grade_rectification(rectificationId)
    activate DB
    DB->>DB: 1. Registra en AUDIT_LOGS (quién, cuándo, nota anterior, nota nueva, evidencia)
    DB->>DB: 2. Actualiza SUBMISSIONS.score = new_score
    DB->>DB: 3. Recalcula ENROLLMENTS.final_grade
    alt El nuevo promedio supera min_passing_grade y antes estaba reprobado
        DB->>DB: Cambia ENROLLMENTS.status a 'completed'
        DB->>DB: Emite el Certificado correspondiente
    end
    deactivate DB
```

---

## 5. Máquinas de Estado del Sistema (`Statecharts`)

### 5.1 Máquina de Estados de una Cohorte (`cohort_status`)

```mermaid
stateDiagram-v2
    [*] --> upcoming: Coordinador crea Cohorte y asigna Instructor
    upcoming --> cancelled: Cohorte cancelada por falta de quórum (Reembolso/Reubicación)
    upcoming --> active: Llega start_date / Coordinador inicia período lectivo

    state active {
        [*] --> DictadoClases
        DictadoClases --> TomaAsistencia: En cada ClassSession
        DictadoClases --> RecepcionEntregas: En cada EvaluationItem
    }

    active --> grading: Finalizan clases (end_date), ventana final de calificación docente
    grading --> closed: Ejecución de rpc_close_cohort_gradebook (Acta Sellada)
    closed --> [*]: Solo admite Rectificaciones Auditadas
    cancelled --> [*]
```

### 5.2 Máquina de Estados de una Orden de Compra (`order_status`)

```mermaid
stateDiagram-v2
    [*] --> pending: Estudiante inicia Checkout
    pending --> paid: Webhook Pasarela (Stripe / MercadoPago confirmado)
    pending --> under_review: Estudiante sube comprobante de transferencia bancaria
    pending --> failed: Pago rechazado o sesión expirada
    under_review --> paid: Coordinador/Admin aprueba comprobante en Tesorería
    under_review --> failed: Comprobante inválido / rechazado
    paid --> refunded: Super Admin ejecuta reembolso (Anula matrícula asociada)
    failed --> [*]
    refunded --> [*]
```
