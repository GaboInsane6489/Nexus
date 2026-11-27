# 05 — Diagramas de Funcionalidad y Lógica Algorítmica de Motores

> **Propósito de este documento**: Especificar los diagramas de funcionalidad y la lógica algorítmica interna de los **4 Motores Principales de Nexus**:
> 1. Motor de Rutas de Aprendizaje y Prerrequisitos (DAG Engine)
> 2. Motor del Libro de Calificaciones Ponderado y Asistencia (ERP Engine)
> 3. Motor de Gamificación, Rachas e Insignias (Gamification Engine)
> 4. Motor de Emisión y Verificación Criptográfica de Certificados (Certificate Engine)

---

## 1. Motor 1: Rutas de Aprendizaje y Grafo de Prerrequisitos (DAG Engine)

En **Nexus**, una Ruta de Aprendizaje (`LearningPath`) no es una simple lista plana de videos; es una **malla curricular modelada como un Grafo Dirigido Acíclico (DAG)** donde cada nodo es un `Course` y las aristas dirigidas representan `course_prerequisites`.

### 1.1 Diagrama de Funcionalidad de Desbloqueo Curricular

```mermaid
flowchart TD
    subgraph GrafoRuta["Malla Curricular de una Ruta (Ejemplo Ingeniería)"]
        C1["CS-101: Fundamentos de Programación<br/>(Nivel 1 - Sin Prerrequisitos)"]
        C2["CS-102: Estructuras de Datos<br/>(Nivel 2 - Requiere CS-101 >= 70)"]
        C3["DB-101: Diseño de Bases de Datos<br/>(Nivel 2 - Requiere CS-101 >= 70)"]
        C4["WEB-201: Arquitectura Next.js & Supabase<br/>(Nivel 3 - Requiere CS-102 y DB-101)"]
        C5["PROY-301: Proyecto Integrador Final<br/>(Nivel 4 - Requiere WEB-201)"]

        C1 --> C2
        C1 --> C3
        C2 --> C4
        C3 --> C4
        C4 --> C5
    end

    subgraph EvaluadorNodo["Algoritmo Evaluador de Estado por Nodo (Por Estudiante)"]
        EvalStart(["Evaluar Curso X para Estudiante S"]) --> HasCompleted{"¿Tiene matrícula 'completed'<br/>en Curso X?"}
        HasCompleted -->|"Sí"| StateCompleted["ESTADO: APROBADO (Verde)<br/>Muestra Nota y Certificado"]
        HasCompleted -->|"No"| HasActive{"¿Tiene matrícula 'active'<br/>en Curso X?"}
        HasActive -->|"Sí"| StateActive["ESTADO: CURSANDO (Azul)<br/>Acceso directo al Aula Virtual"]
        HasActive -->|"No"| CheckParents{"¿Todos los cursos padre P<br/>en COURSE_PREREQUISITES<br/>están APROBADOS?"}
        CheckParents -->|"No"| StateLocked["ESTADO: BLOQUEADO (Gris)<br/>Muestra qué prerrequisito falta"]
        CheckParents -->|"Sí"| CheckEntitlement{"¿Tiene crédito de Ruta<br/>en PATH_ENTITLEMENTS?"}
        CheckEntitlement -->|"Sí"| StateReadyRedeem["ESTADO: DESBLOQUEADO CON CRÉDITO<br/>Botón: Elegir Cohorte sin pagar extra"]
        CheckEntitlement -->|"No"| StateReadyBuy["ESTADO: DISPONIBLE PARA COMPRA<br/>Botón: Comprar Curso Individual"]
    end
```

### 1.2 Algoritmo de Detección de Ciclos al Configurar Prerrequisitos
Cuando un `coordinator` intenta agregar la regla *"El curso $B$ requiere aprobar previamente el curso $A$"* ($A \to B$):
1. Si $A == B$, se rechaza inmediatamente (auto-referencia).
2. Se ejecuta una búsqueda en profundidad (DFS) o `WITH RECURSIVE` en SQL partiendo de $B$ para listar todos los cursos que dependen directa o indirectamente de $B$.
3. Si $A$ aparece en el conjunto de descendientes de $B$, agregar $A \to B$ formaría un ciclo cerrado ($A \to \dots \to B \to A$), por lo que el motor rechaza la operación con el error `DAG_CYCLE_DETECTED`.

---

## 2. Motor 2: Libro de Calificaciones Ponderado y Control de Asistencia (ERP Engine)

### 2.1 Diagrama Funcional del Cálculo Académico en Tiempo Real

```mermaid
flowchart LR
    subgraph Entradas["Entradas de la Cohorte"]
        Rubros["EVALUATION_ITEMS<br/>(Rubro i con peso w_i)"]
        Entregas["SUBMISSIONS<br/>(Calificación S_i entre 0 y 100)"]
        Sesiones["CLASS_SESSIONS<br/>(M sesiones programadas)"]
        RegistrosAsist["ATTENDANCE_RECORDS<br/>(present=1, excused=1, late=0.5, absent=0)"]
    end

    subgraph ProcesadorNotas["Sub-Motor de Calificaciones"]
        ValidaPesos{"¿Suma(w_i) == 100%?"}
        CalcParcial["Promedio Acumulado:<br/>Suma(S_i * w_i / 100)"]
        ProyeccionNota["Nota Necesaria en rubros<br/>restantes para llegar a min_passing_grade"]
    end

    subgraph ProcesadorAsistencia["Sub-Motor de Asistencia"]
        CalcAsistActual["% Asistencia Actual:<br/>(Suma puntos / Sesiones dictadas) * 100"]
        CalcAsistMax["% Asistencia Máxima Posible:<br/>((Puntos + Sesiones restantes) / Total) * 100"]
        ClasificadorRiesgo{"Comparar Asist. Máxima<br/>vs min_attendance_pct"}
    end

    subgraph Dictamen["Estado de Matrícula (ENROLLMENTS)"]
        Normal["Riesgo: normal"]
        Warning["Riesgo: warning (Margen <= 5%)"]
        Critical["Riesgo: critical_dropout_risk<br/>(Matemáticamente reprobado por inasistencia)"]
        DictamenFinal["Al Cerrar Acta:<br/>completed | failed_grade | failed_attendance"]
    end

    Rubros & Entregas --> ValidaPesos
    ValidaPesos --> CalcParcial
    CalcParcial --> ProyeccionNota
    Sesiones & RegistrosAsist --> CalcAsistActual
    CalcAsistActual --> CalcAsistMax
    CalcAsistMax --> ClasificadorRiesgo
    ClasificadorRiesgo -->|">= min + 5%"| Normal
    ClasificadorRiesgo -->|"Entre min y min + 5%"| Warning
    ClasificadorRiesgo -->|"< min"| Critical
    CalcParcial & CalcAsistActual --> DictamenFinal
```

### 2.2 Especificación Matemática del Dictamen al Cierre de Acta
Sea:
- $G_{\text{min}}$ la nota mínima aprobatoria del curso (`courses.min_passing_grade`, ej. `70.00`).
- $A_{\text{min}}$ el porcentaje mínimo de asistencia del curso (`courses.min_attendance_pct`, ej. `80.00`).
- $G_{\text{final}}$ la nota final ponderada redondeada a 2 decimales.
- $A_{\text{final}}$ el porcentaje de asistencia sobre el total de sesiones dictadas en la cohorte.

Al ejecutar el cierre de acta, la función determinística asigna:
1. Si $A_{\text{final}} < A_{\text{min}} \implies \text{status} = \texttt{'failed\_attendance'}$ (Reprobado por inasistencia, independientemente de la nota).
2. Si $A_{\text{final}} \ge A_{\text{min}} \land G_{\text{final}} < G_{\text{min}} \implies \text{status} = \texttt{'failed\_grade'}$ (Reprobado por calificación).
3. Si $A_{\text{final}} \ge A_{\text{min}} \land G_{\text{final}} \ge G_{\text{min}} \implies \text{status} = \texttt{'completed'}$ (Aprobado $\to$ Dispara Certificado y XP).

---

## 3. Motor 3: Gamificación Anti-Farming (XP, Rachas, Niveles e Insignias)

### 3.1 Diagrama de Funcionalidad del Pipeline de Gamificación

```mermaid
flowchart TD
    Event(["Evento Académico Verificado<br/>(user_id, event_type, reference_id)"]) --> IdempotencyCheck{"¿Existe ya en XP_LEDGER<br/>(user_id, event_type, reference_id)?"}

    IdempotencyCheck -->|"Sí (Intento repetido)"| Ignore(["Abortar silenciosamente (Idempotente)"])
    IdempotencyCheck -->|"No (Primera vez)"| EvalStreak["Evaluar Fecha de Actividad en USER_GAMIFICATION<br/>(Según timezone del estudiante)"]

    EvalStreak --> DiffDays{"Diferencia entre hoy<br/>y last_activity_date"}
    DiffDays -->|"0 días (Mismo día)"| KeepStreak["Mantiene current_streak_days"]
    DiffDays -->|"1 día (Día consecutivo)"| IncStreak["current_streak_days + 1<br/>(Si llega a múltiplo de 7 -> +1 streak_freeze)"]
    DiffDays -->|"2 días y tiene streak_freeze > 0"| UseFreeze["Consume 1 streak_freeze<br/>Conserva current_streak_days"]
    DiffDays -->|">= 2 días sin freeze"| ResetStreak["Reinicia current_streak_days = 1"]

    KeepStreak & IncStreak & UseFreeze & ResetStreak --> CalcMult["Calcular Multiplicador por Racha:<br/>1.0x (<7d) | 1.2x (7-29d) | 1.5x (>=30d)"]
    CalcMult --> InsertLedger["Insertar fila en XP_LEDGER<br/>final_xp = ROUND(base_xp * multiplier)"]
    InsertLedger --> UpdateTotal["Actualizar total_xp en USER_GAMIFICATION"]
    UpdateTotal --> CalcLevel["Recalcular Nivel:<br/>Mientras total_xp >= 100 * (L)^1.5 -> L++"]
    CalcLevel --> CheckBadges["Evaluar Catálogo de Insignias (BADGES)"]
    CheckBadges --> NotifyUI(["Emitir Evento Realtime (XP + Nivel + Insignia)"])
```

### 3.2 Catálogo Inicial de Insignias (`BADGES`) Automáticas

| Código (`code`) | Nombre de la Insignia | Condición Lógica de Desbloqueo | Bono XP |
| :--- | :--- | :--- | :-: |
| `FIRST_STEP` | **Primer Paso Académico** | Completar la primera lección de cualquier curso. | `+50 XP` |
| `STREAK_7` | **Constancia de Acero (7 Días)** | Alcanzar `current_streak_days >= 7`. | `+100 XP` |
| `STREAK_30` | **Hábito Maestro (30 Días)** | Alcanzar `current_streak_days >= 30`. | `+500 XP` |
| `PERFECT_ATTENDANCE` | **Asistencia Perfecta** | Aprobar una cohorte cerrada con `attendance_pct == 100.00%`. | `+200 XP` |
| `HONOR_ROLL` | **Cuadro de Honor (`Magna Cum Laude`)** | Aprobar una cohorte cerrada con `final_grade >= 95.00`. | `+300 XP` |
| `PATH_GRADUATE` | **Graduado de Programa Completo** | Aprobar todos los cursos obligatorios de un `LearningPath`. | `+1000 XP` |

---

## 4. Motor 4: Emisión y Verificación de Certificados (`Certificate Engine`)

### 4.1 Diagrama de Funcionalidad de Emisión y Verificación Pública

```mermaid
flowchart LR
    subgraph Emision["1. Flujo de Emisión (Al aprobar Matrícula)"]
        TriggerApprove(["Matrícula pasa a 'completed'"]) --> Snapshot["Captura Snapshot Inmutable:<br/>Nombre, Documento, Curso, Créditos, Nota, Asistencia"]
        Snapshot --> GenCode["Genera Código Único:<br/>NEX-{YYYY}-{8_CHARS}"]
        GenCode --> GenHash["Calcula Hash Criptográfico SHA-256:<br/>HMAC(enrollment_id + doc_id + grade + issued_at)"]
        GenHash --> SaveCert["Guarda en tabla CERTIFICATES"]
        SaveCert --> RenderPDF["Genera PDF Oficial con Código QR<br/>apuntando a /verify/NEX-YYYY-XXXX"]
    end

    subgraph Verificacion["2. Flujo de Verificación Pública (Reclutadores / Empresas)"]
        ScanQR(["Empleador escanea QR o abre<br/>/verify/NEX-2027-8K4M9P2X"]) --> LookupDB{"¿Existe código en<br/>CERTIFICATES?"}
        LookupDB -->|"No"| Invalid["Muestra Pantalla: CERTIFICADO NO ENCONTRADO"]
        LookupDB -->|"Sí"| CheckRevoked{"¿is_revoked == true?"}
        CheckRevoked -->|"Sí"| Revoked["Muestra Alerta Roja: CERTIFICADO REVOCADO<br/>(Muestra fecha y motivo administrativo)"]
        CheckRevoked -->|"No"| Valid["Muestra Sello Verde Oficial: CERTIFICADO VÁLIDO<br/>Datos del Graduado + Curso + Hash SHA-256 + Botón LinkedIn"]
    end
```
