'use client';

import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  FileEdit,
  FileWarning,
  Lock,
  Plus,
  Save,
  ShieldCheck,
  Sliders,
  Users,
  Video,
} from 'lucide-react';
import type { AppRole } from '@/modules/iam';
import type { AttendanceStatus, EvaluationType } from '../../domain/entities';
import {
  calculateWeightedGrade,
  determineFinalEnrollmentVerdict,
  evaluateStudentAttendanceAndRisk,
} from '../../domain/rules';
import type { CohortErpFullBundle } from '../../infrastructure/queries';
import {
  closeCohortGradebookAction,
  createClassSessionAction,
  createEvaluationItemAction,
  gradeSubmissionAction,
  recordAttendanceAction,
  rectifyGradeAction,
} from '../actions';

interface AcademicErpWorkspaceClientProps {
  bundles: CohortErpFullBundle[];
  currentUserRole: AppRole;
  currentUserId: string;
}

export function AcademicErpWorkspaceClient({
  bundles,
  currentUserRole,
  currentUserId,
}: AcademicErpWorkspaceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const canManageAcademic =
    currentUserRole === 'instructor' ||
    currentUserRole === 'coordinator' ||
    currentUserRole === 'super_admin';
  const canCloseAndRectify =
    currentUserRole === 'coordinator' || currentUserRole === 'super_admin';

  const [selectedCohortId, setSelectedCohortId] = useState<string>(
    bundles[0]?.cohortId ?? ''
  );

  const activeBundle =
    bundles.find((b) => b.cohortId === selectedCohortId) ?? bundles[0];

  const [selectedEnrollmentByCohort, setSelectedEnrollmentByCohort] = useState<
    Record<string, string>
  >({});

  const activeEnrollment = useMemo(() => {
    if (!activeBundle) return undefined;
    if (currentUserRole === 'student') {
      return (
        activeBundle.enrollments.find((e) => e.studentId === currentUserId) ??
        activeBundle.enrollments[0]
      );
    }
    const chosenId = selectedEnrollmentByCohort[activeBundle.cohortId];
    return (
      activeBundle.enrollments.find((e) => e.enrollmentId === chosenId) ??
      activeBundle.enrollments[0]
    );
  }, [activeBundle, currentUserRole, currentUserId, selectedEnrollmentByCohort]);

  const activeEnrollmentId = activeEnrollment?.enrollmentId ?? '';
  const isActaClosed = activeBundle?.cohortStatus === 'closed';

  // Borradores locales de calificación por `${enrollmentId}:${evaluationId}`
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, number>>({});
  // Borradores locales optimistas de asistencia por `${enrollmentId}:${sessionId}`
  const [attendanceDrafts, setAttendanceDrafts] = useState<
    Record<string, AttendanceStatus>
  >({});

  // Formularios de creación rápida (Sesión / Rubro) y Rectificación
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<EvaluationType>('assignment');
  const [newItemWeight, setNewItemWeight] = useState('25');
  const [newItemDueDate, setNewItemDueDate] = useState(() =>
    new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)
  );

  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDate, setNewSessionDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [newSessionUrl, setNewSessionUrl] = useState('');

  const [rectifySubmissionId, setRectifySubmissionId] = useState('');
  const [rectifyNewScore, setRectifyNewScore] = useState('');
  const [rectifyReason, setRectifyReason] = useState('');

  const scoresByItem = useMemo(() => {
    const map: Record<string, number> = {};
    if (!activeBundle || !activeEnrollmentId) return map;

    for (const item of activeBundle.evaluationItems) {
      const draftKey = `${activeEnrollmentId}:${item.id}`;
      if (draftKey in scoreDrafts) {
        map[item.id] = scoreDrafts[draftKey];
        continue;
      }
      const sub = activeBundle.submissions.find(
        (s) =>
          s.evaluationId === item.id && s.enrollmentId === activeEnrollmentId
      );
      map[item.id] = sub?.score ?? 0;
    }
    return map;
  }, [activeBundle, activeEnrollmentId, scoreDrafts]);

  const attendanceBySession = useMemo(() => {
    const map: Record<string, AttendanceStatus | undefined> = {};
    if (!activeBundle || !activeEnrollmentId) return map;

    for (const ses of activeBundle.sessions) {
      const draftKey = `${activeEnrollmentId}:${ses.id}`;
      if (draftKey in attendanceDrafts) {
        map[ses.id] = attendanceDrafts[draftKey];
        continue;
      }
      const rec = activeBundle.attendanceRecords.find(
        (r) => r.sessionId === ses.id && r.enrollmentId === activeEnrollmentId
      );
      map[ses.id] = rec?.status;
    }
    return map;
  }, [activeBundle, activeEnrollmentId, attendanceDrafts]);

  const gradeCalc = useMemo(() => {
    if (!activeBundle) {
      return {
        finalGrade: 0,
        totalConfiguredWeightPct: 0,
        isWeightInvariantValid: false,
      };
    }
    return calculateWeightedGrade(activeBundle.evaluationItems, scoresByItem);
  }, [activeBundle, scoresByItem]);

  const attendanceCalc = useMemo(() => {
    if (!activeBundle) {
      return {
        currentAttendancePct: 100,
        maxPossibleAttendancePct: 100,
        riskLevel: 'normal' as const,
        effectivePresentUnits: 0,
        dictatedSessionsCount: 0,
        totalSessionsCount: 0,
      };
    }
    const recordedStatuses = activeBundle.sessions
      .map((s) => attendanceBySession[s.id])
      .filter((st): st is AttendanceStatus => st !== undefined);

    return evaluateStudentAttendanceAndRisk(
      recordedStatuses,
      activeBundle.sessions.length,
      activeBundle.minAttendancePct
    );
  }, [activeBundle, attendanceBySession]);

  const finalVerdict = useMemo(() => {
    if (!activeBundle) return 'completed';
    return determineFinalEnrollmentVerdict(
      gradeCalc.finalGrade,
      attendanceCalc.currentAttendancePct,
      activeBundle.minPassingGrade,
      activeBundle.minAttendancePct
    );
  }, [activeBundle, gradeCalc.finalGrade, attendanceCalc.currentAttendancePct]);

  const studentSubmissionsForRectify = useMemo(() => {
    if (!activeBundle || !activeEnrollmentId) return [];
    return activeBundle.submissions.filter(
      (s) => s.enrollmentId === activeEnrollmentId && s.score !== null
    );
  }, [activeBundle, activeEnrollmentId]);

  if (!activeBundle) {
    return (
      <div className="pt-4 sm:pt-6 animate-reveal">
        <div className="card-glass rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#090B0F] text-white flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h1 className="font-serif text-2xl text-[#090B0F] tracking-tight">
            Sin cohortes activas
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Aún no hay cohortes registradas o asignadas en tu libro académico. Explora el
            catálogo comercial o tus rutas de aprendizaje para inscribirte.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/commerce"
              className="btn-obsidian px-5 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2"
            >
              Ir al Catálogo
            </Link>
            <Link
              href="/paths"
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-white border border-slate-900/15 text-[#090B0F] hover:border-slate-900/35 transition"
            >
              Explorar Rutas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function handleSaveGrade(evaluationId: string) {
    if (!activeEnrollmentId) return;
    const score = scoresByItem[evaluationId] ?? 0;
    setFeedback(null);
    startTransition(async () => {
      const res = await gradeSubmissionAction({
        evaluationId,
        enrollmentId: activeEnrollmentId,
        score,
      });
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error.message });
        return;
      }
      setFeedback({
        type: 'success',
        message: res.message ?? 'Calificación guardada en PostgreSQL.',
      });
      router.refresh();
    });
  }

  function handleRecordAttendance(sessionId: string, status: AttendanceStatus) {
    if (!activeEnrollmentId || isActaClosed || !canManageAcademic) return;
    const draftKey = `${activeEnrollmentId}:${sessionId}`;
    setAttendanceDrafts((prev) => ({ ...prev, [draftKey]: status }));
    setFeedback(null);
    startTransition(async () => {
      const res = await recordAttendanceAction({
        sessionId,
        records: [{ enrollmentId: activeEnrollmentId, status }],
      });
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error.message });
        return;
      }
      setFeedback({
        type: 'success',
        message: res.message ?? 'Asistencia registrada.',
      });
      router.refresh();
    });
  }

  function handleCreateEvaluationItem(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await createEvaluationItemAction({
        cohortId: activeBundle.cohortId,
        title: newItemTitle,
        type: newItemType,
        weightPct: Number(newItemWeight),
        dueDate: new Date(newItemDueDate).toISOString(),
        allowLateSubmission: false,
        sortOrder: activeBundle.evaluationItems.length + 1,
      });
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error.message });
        return;
      }
      setNewItemTitle('');
      setShowNewItemForm(false);
      setFeedback({
        type: 'success',
        message: res.message ?? 'Rubro creado correctamente.',
      });
      router.refresh();
    });
  }

  function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const startsAt = new Date(`${newSessionDate}T19:00:00Z`).toISOString();
    const endsAt = new Date(`${newSessionDate}T21:00:00Z`).toISOString();
    startTransition(async () => {
      const res = await createClassSessionAction({
        cohortId: activeBundle.cohortId,
        sessionNumber: activeBundle.sessions.length + 1,
        title: newSessionTitle,
        startsAt,
        endsAt,
        meetingOrRoomUrl: newSessionUrl || null,
      });
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error.message });
        return;
      }
      setNewSessionTitle('');
      setNewSessionUrl('');
      setShowNewSessionForm(false);
      setFeedback({
        type: 'success',
        message: res.message ?? 'Sesión programada correctamente.',
      });
      router.refresh();
    });
  }

  function handleCloseActa() {
    if (!canCloseAndRectify) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await closeCohortGradebookAction({
        cohortId: activeBundle.cohortId,
      });
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error.message });
        return;
      }
      setFeedback({
        type: 'success',
        message: res.message ?? 'Acta de cohorte cerrada correctamente.',
      });
      router.refresh();
    });
  }

  function handleRectifyGrade(e: React.FormEvent) {
    e.preventDefault();
    const targetSub = studentSubmissionsForRectify.find(
      (s) => s.id === rectifySubmissionId
    );
    if (!targetSub) {
      setFeedback({
        type: 'error',
        message: 'Selecciona una entrega calificada para rectificar.',
      });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await rectifyGradeAction({
        submissionId: targetSub.id,
        previousScore: targetSub.score ?? 0,
        newScore: Number(rectifyNewScore),
        justificationReason: rectifyReason,
      });
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error.message });
        return;
      }
      setRectifyNewScore('');
      setRectifyReason('');
      setFeedback({
        type: 'success',
        message: res.message ?? 'Rectificación aplicada correctamente.',
      });
      router.refresh();
    });
  }

  return (
    <div className="pt-2 sm:pt-3 space-y-7 animate-reveal">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-900/10 text-[11px] font-semibold text-[#090B0F] mb-2 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
            <span>MÓDULO ACADEMIC-ERP · NIVEL 3 (DATOS EN VIVO DESDE POSTGRESQL)</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#090B0F] tracking-tight">
            Libro de Calificaciones Ponderado, Asistencia y Actas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestiona cohortes reales verificando la invariante{' '}
            <code className="text-[#090B0F] font-semibold">SUM(weight_pct) = 100.00%</code> y
            el sellado inmutable de actas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {bundles.map((b) => (
            <button
              key={b.cohortId}
              type="button"
              onClick={() => {
                setSelectedCohortId(b.cohortId);
                setFeedback(null);
              }}
              className={`px-3.5 py-2 rounded-full text-xs font-mono transition cursor-pointer border ${
                b.cohortId === activeBundle.cohortId
                  ? 'bg-[#090B0F] text-white font-bold border-[#090B0F] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-900/10 hover:border-slate-900/25'
              }`}
            >
              {b.cohortCode} ({b.audit.totalWeightPct}%)
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-600/25 text-emerald-900'
              : 'bg-red-500/10 border-red-600/25 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="card-glass rounded-3xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#090B0F] text-xs font-mono font-bold text-white">
              {activeBundle.cohortCode}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900/5 text-[11px] font-mono text-slate-700">
              {activeBundle.cohortStatus}
            </span>
            <span className="text-xs text-slate-500">
              {activeBundle.scheduleLabel} · Mín. Aprobación:{' '}
              <strong className="text-[#090B0F]">
                {activeBundle.minPassingGrade} pts
              </strong>{' '}
              / Asistencia:{' '}
              <strong className="text-[#090B0F]">
                {activeBundle.minAttendancePct}%
              </strong>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#090B0F]">
            {activeBundle.courseTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-900/10">
          {gradeCalc.isWeightInvariantValid ? (
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-600/25 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Invariante Pesos: {gradeCalc.totalConfiguredWeightPct.toFixed(2)}%
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-900 text-xs font-mono font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Pesos: {gradeCalc.totalConfiguredWeightPct.toFixed(2)}% (Cierre Bloqueado)
            </span>
          )}

          {canCloseAndRectify && (
            <button
              type="button"
              disabled={
                isPending || isActaClosed || !activeBundle.audit.canCloseActa
              }
              onClick={handleCloseActa}
              className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                isActaClosed
                  ? 'bg-amber-500 text-white cursor-default shadow-sm'
                  : !activeBundle.audit.canCloseActa || isPending
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'btn-obsidian cursor-pointer'
              }`}
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={2} />
              <span>
                {isActaClosed
                  ? 'Acta Sellada (Modo Inmutable)'
                  : 'Sellar Acta de Cohorte'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Estudiante (para Instructor / Coordinador / Admin) */}
      <div className="card-glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Users className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold text-[#090B0F]">
            {currentUserRole === 'student'
              ? 'Mi Expediente Académico:'
              : `Estudiante (${activeBundle.enrollments.length} matriculados):`}
          </span>
          {activeEnrollment ? (
            <span className="font-mono text-[#090B0F]">
              {activeEnrollment.fullName}
              {activeEnrollment.email ? ` (${activeEnrollment.email})` : ''}
            </span>
          ) : (
            <span className="text-slate-500">Sin matrículas en esta cohorte.</span>
          )}
        </div>

        {canManageAcademic && activeBundle.enrollments.length > 0 && (
          <select
            aria-label="Seleccionar estudiante"
            value={activeEnrollmentId}
            onChange={(e) =>
              setSelectedEnrollmentByCohort((prev) => ({
                ...prev,
                [activeBundle.cohortId]: e.target.value,
              }))
            }
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-900/15 text-xs font-medium text-[#090B0F] focus:outline-none focus:border-[#090B0F]"
          >
            {activeBundle.enrollments.map((enr) => (
              <option key={enr.enrollmentId} value={enr.enrollmentId}>
                {enr.fullName} — {enr.finalGrade.toFixed(1)} pts (
                {enr.attendancePct.toFixed(0)}%)
              </option>
            ))}
          </select>
        )}
      </div>

      {isActaClosed && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 space-y-3 text-xs text-amber-900">
          <div className="flex items-start gap-3">
            <FileWarning className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" strokeWidth={2} />
            <div>
              <p className="font-bold">
                ACTA_CLOSED_IMMUTABLE — Trigger PostgreSQL{' '}
                <code>trg_immutable_submissions_on_closed</code> Activo
              </p>
              <p className="mt-0.5">
                Las calificaciones y asistencias han quedado bloqueadas contra edición directa.
                Cualquier modificación posterior requiere registrar una solicitud auditada en{' '}
                <code>public.grade_rectifications</code> aprobada por Coordinación.
              </p>
            </div>
          </div>

          {canCloseAndRectify && studentSubmissionsForRectify.length > 0 && (
            <form
              onSubmit={handleRectifyGrade}
              className="pt-3 border-t border-amber-500/25 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end"
            >
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Entrega a Rectificar
                </label>
                <select
                  required
                  value={rectifySubmissionId}
                  onChange={(e) => setRectifySubmissionId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-500/35 text-xs text-[#090B0F]"
                >
                  <option value="">Seleccionar...</option>
                  {studentSubmissionsForRectify.map((sub) => {
                    const ev = activeBundle.evaluationItems.find(
                      (i) => i.id === sub.evaluationId
                    );
                    return (
                      <option key={sub.id} value={sub.id}>
                        {ev?.title ?? 'Rubro'} (Actual: {sub.score})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Nueva Nota (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  required
                  value={rectifyNewScore}
                  onChange={(e) => setRectifyNewScore(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-500/35 text-xs text-[#090B0F]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Justificación (mín. 10 car.)
                </label>
                <input
                  type="text"
                  minLength={10}
                  required
                  placeholder="Motivo auditado..."
                  value={rectifyReason}
                  onChange={(e) => setRectifyReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-500/35 text-xs text-[#090B0F]"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 rounded-lg bg-[#090B0F] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileEdit className="w-3.5 h-3.5" />
                Rectificar Nota
              </button>
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 @3xl/workspace:grid-cols-12 gap-5">
        {/* Panel Izquierdo: Rubros de Evaluación */}
        <div className="@3xl/workspace:col-span-7 card-glass rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-900/10 pb-3.5 gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#090B0F] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>
                  Rubros de Evaluación ({activeBundle.evaluationItems.length})
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {canManageAcademic
                  ? 'Ajusta la nota del estudiante seleccionado y guarda en PostgreSQL'
                  : 'Desglose ponderado de tus calificaciones registradas'}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {canManageAcademic && !isActaClosed && (
                <button
                  type="button"
                  onClick={() => setShowNewItemForm((v) => !v)}
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-900/15 text-[11px] font-bold text-[#090B0F] inline-flex items-center gap-1 hover:border-slate-900/35 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Rubro
                </button>
              )}
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">
                  Nota Final Ponderada
                </span>
                <span className="text-2xl font-bold text-[#090B0F] font-mono whitespace-nowrap">
                  {gradeCalc.finalGrade.toFixed(2)}{' '}
                  <span className="text-xs text-slate-500">/ 100</span>
                </span>
              </div>
            </div>
          </div>

          {showNewItemForm && canManageAcademic && !isActaClosed && (
            <form
              onSubmit={handleCreateEvaluationItem}
              className="p-4 rounded-2xl bg-slate-900/[0.03] border border-slate-900/10 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end text-xs"
            >
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Título del Rubro
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Ej. Proyecto Final"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-900/15 text-[#090B0F]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tipo
                </label>
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as EvaluationType)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-900/15 text-[#090B0F]"
                >
                  <option value="assignment">assignment</option>
                  <option value="exam">exam</option>
                  <option value="quiz">quiz</option>
                  <option value="project">project</option>
                  <option value="participation">participation</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Peso (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step="0.01"
                  required
                  value={newItemWeight}
                  onChange={(e) => setNewItemWeight(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-900/15 text-[#090B0F]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Fecha Límite
                </label>
                <input
                  type="date"
                  required
                  value={newItemDueDate}
                  onChange={(e) => setNewItemDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-900/15 text-[#090B0F]"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewItemForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-900/15 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-obsidian px-4 py-1.5 rounded-lg font-bold cursor-pointer disabled:opacity-50"
                >
                  Crear Rubro
                </button>
              </div>
            </form>
          )}

          {activeBundle.evaluationItems.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              Esta cohorte aún no tiene rubros de evaluación configurados.
            </p>
          ) : (
            <div className="space-y-3">
              {activeBundle.evaluationItems.map((item) => {
                const currentScore = scoresByItem[item.id] ?? 0;
                const pointsContribution = Number(
                  ((currentScore * item.weightPct) / 100).toFixed(2)
                );

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white/85 border border-slate-900/[0.08] space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase text-amber-700 font-semibold">
                          {item.type} · Peso: {item.weightPct.toFixed(2)}%
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-[#090B0F] truncate">
                          {item.title}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-bold text-[#090B0F] font-mono">
                          {currentScore.toFixed(1)} pts
                        </span>
                        <span className="text-[11px] text-emerald-700 font-mono font-semibold block">
                          Aporta: +{pointsContribution.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {canManageAcademic && activeEnrollmentId && (
                      <div className="flex items-center gap-3 pt-1">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.5}
                          disabled={isActaClosed || isPending}
                          value={currentScore}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setScoreDrafts((prev) => ({
                              ...prev,
                              [`${activeEnrollmentId}:${item.id}`]: val,
                            }));
                          }}
                          className="w-full accent-[#090B0F] cursor-pointer disabled:opacity-40"
                        />
                        <button
                          type="button"
                          disabled={isActaClosed || isPending}
                          onClick={() => handleSaveGrade(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#090B0F] text-white font-bold text-[11px] inline-flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40"
                        >
                          <Save className="w-3 h-3" />
                          Guardar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Derecho: Control de Asistencia */}
        <div className="@3xl/workspace:col-span-5 card-glass rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900/10 pb-3.5 gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#090B0F] flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-amber-600" />
                  <span>Control de Asistencia</span>
                </h3>
                <p className="text-xs text-slate-500">
                  P = Presente · J = Justificado · T = Tardanza · A = Ausente
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {canManageAcademic && !isActaClosed && (
                  <button
                    type="button"
                    onClick={() => setShowNewSessionForm((v) => !v)}
                    className="px-3 py-1.5 rounded-full bg-white border border-slate-900/15 text-[11px] font-bold text-[#090B0F] inline-flex items-center gap-1 hover:border-slate-900/35 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Sesión
                  </button>
                )}
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Asistencia</span>
                  <span className="text-2xl font-bold text-[#090B0F] font-mono">
                    {attendanceCalc.currentAttendancePct.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {showNewSessionForm && canManageAcademic && !isActaClosed && (
              <form
                onSubmit={handleCreateSession}
                className="p-3.5 rounded-2xl bg-slate-900/[0.03] border border-slate-900/10 space-y-2.5 text-xs"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Título de la Sesión #{activeBundle.sessions.length + 1}
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    placeholder="Ej. Arquitectura de Datos"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-900/15 text-[#090B0F]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      required
                      value={newSessionDate}
                      onChange={(e) => setNewSessionDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-900/15 text-[#090B0F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Sala / URL (opcional)
                    </label>
                    <input
                      type="text"
                      value={newSessionUrl}
                      onChange={(e) => setNewSessionUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-900/15 text-[#090B0F]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewSessionForm(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-900/15 text-slate-600 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-obsidian px-4 py-1.5 rounded-lg font-bold cursor-pointer disabled:opacity-50"
                  >
                    Programar
                  </button>
                </div>
              </form>
            )}

            {activeBundle.sessions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                Esta cohorte aún no tiene sesiones dictadas en calendario.
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeBundle.sessions.map((ses) => {
                  const currentStatus = attendanceBySession[ses.id];
                  return (
                    <div
                      key={ses.id}
                      className="p-3 rounded-2xl bg-white/85 border border-slate-900/[0.08] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Sesión #{ses.sessionNumber}
                        </span>
                        <p className="text-xs font-semibold text-[#090B0F] truncate">
                          {ses.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {(
                          [
                            { key: 'present', label: 'P' },
                            { key: 'late', label: 'T' },
                            { key: 'absent', label: 'A' },
                            { key: 'excused', label: 'J' },
                          ] as const
                        ).map((btn) => (
                          <button
                            key={btn.key}
                            type="button"
                            disabled={
                              !canManageAcademic ||
                              !activeEnrollmentId ||
                              isActaClosed ||
                              isPending
                            }
                            onClick={() => handleRecordAttendance(ses.id, btn.key)}
                            className={`w-7 h-7 rounded-lg font-mono text-[11px] font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-default ${
                              currentStatus === btn.key
                                ? 'bg-[#090B0F] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-500 hover:text-[#090B0F] border border-slate-900/[0.08]'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/[0.04] border border-slate-900/[0.08] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Nivel de Riesgo Académico:</span>
              <span
                className={`font-mono font-bold ${
                  attendanceCalc.riskLevel === 'normal'
                    ? 'text-emerald-700'
                    : attendanceCalc.riskLevel === 'warning'
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}
              >
                {attendanceCalc.riskLevel.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-900/10">
              <span className="text-[#090B0F] font-semibold">
                Dictamen (Nota + Asistencia):
              </span>
              {finalVerdict === 'completed' ? (
                <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  APROBADO (completed)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono font-bold text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  REPROBADO ({finalVerdict})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
