'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sliders,
  CalendarCheck,
  FileWarning,
  Video,
} from 'lucide-react';
import type {
  AttendanceStatus,
  CohortErpBundle,
} from '../../domain/entities';
import {
  calculateWeightedGrade,
  determineFinalEnrollmentVerdict,
  evaluateStudentAttendanceAndRisk,
} from '../../domain/rules';

interface AcademicErpWorkspaceClientProps {
  bundles: CohortErpBundle[];
}

export function AcademicErpWorkspaceClient({
  bundles,
}: AcademicErpWorkspaceClientProps) {
  const [selectedCohortId, setSelectedCohortId] = useState<string>(
    bundles[0]?.cohortId ?? ''
  );
  const [isActaClosedSimulated, setIsActaClosedSimulated] = useState(false);

  const activeBundle =
    bundles.find((b) => b.cohortId === selectedCohortId) ?? bundles[0];

  // Estado interactivo de calificaciones por EvaluationItem real de PostgreSQL
  const [scoresByItem, setScoresByItem] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const b of bundles) {
      b.evaluationItems.forEach((item, idx) => {
        initial[item.id] = idx === 0 ? 96 : idx === 1 ? 90 : idx === 2 ? 95 : 93;
      });
    }
    return initial;
  });

  // Estado interactivo de asistencia por ClassSession real de PostgreSQL
  const [attendanceBySession, setAttendanceBySession] = useState<
    Record<string, AttendanceStatus>
  >(() => {
    const initial: Record<string, AttendanceStatus> = {};
    for (const b of bundles) {
      b.sessions.forEach((ses, idx) => {
        initial[ses.id] = idx === 2 ? 'late' : 'present';
      });
    }
    return initial;
  });

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
    const statuses = activeBundle.sessions.map(
      (s) => attendanceBySession[s.id] ?? 'present'
    );
    return evaluateStudentAttendanceAndRisk(
      statuses,
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

  if (!activeBundle) {
    return null;
  }

  return (
    <div className="space-y-7">
      {/* 1. Cabecera y Selector de Cohorte Real en PostgreSQL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-white mb-2">
            <BookOpen
              className="w-3.5 h-3.5 text-white svg-neon-glow"
              strokeWidth={1.75}
            />
            <span>
              MÓDULO ACADEMIC-ERP · NIVEL 3 (DATOS EN VIVO DESDE POSTGRESQL)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Libro de Calificaciones Ponderado, Matriz de Asistencia y Cierre de Acta
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Conmuta entre las cohortes reales para verificar la invariante{' '}
            <code className="text-slate-200">SUM(weight_pct) = 100.00%</code> y el
            trigger de inmutabilidad de actas cerradas.
          </p>
        </div>

        {/* Píldoras Conmutadoras de Cohorte */}
        <div className="flex flex-wrap items-center gap-2">
          {bundles.map((b) => (
            <button
              key={b.cohortId}
              onClick={() => {
                setSelectedCohortId(b.cohortId);
                setIsActaClosedSimulated(false);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono transition cursor-pointer border ${
                b.cohortId === activeBundle.cohortId
                  ? 'bg-white text-obsidian-950 font-bold border-white shadow-[0_0_16px_rgba(255,255,255,0.3)]'
                  : 'bg-[#101319] text-slate-300 border-white/10 hover:border-white/30'
              }`}
            >
              {b.cohortCode} ({b.audit.totalWeightPct}%)
            </button>
          ))}
        </div>
      </div>

      {/* 2. Barra de Auditoría ERP de la Cohorte (fn_get_cohort_erp_audit) */}
      <div className="card-obsidian rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono font-bold text-white">
              {activeBundle.cohortCode}
            </span>
            <span className="text-xs text-slate-400">
              {activeBundle.scheduleLabel} · Mín. Aprobación:{' '}
              <strong className="text-white">
                {activeBundle.minPassingGrade} pts
              </strong>{' '}
              / Asistencia:{' '}
              <strong className="text-white">
                {activeBundle.minAttendancePct}%
              </strong>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            {activeBundle.courseTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
          {gradeCalc.isWeightInvariantValid ? (
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Invariante Pesos: {gradeCalc.totalConfiguredWeightPct.toFixed(2)}% ✓
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/35 text-amber-200 text-xs font-mono font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Suma de Pesos Incompleta: {gradeCalc.totalConfiguredWeightPct.toFixed(2)}%
              (Cierre Bloqueado)
            </span>
          )}

          <button
            type="button"
            disabled={!gradeCalc.isWeightInvariantValid}
            onClick={() => setIsActaClosedSimulated((prev) => !prev)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              !gradeCalc.isWeightInvariantValid
                ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                : isActaClosedSimulated
                ? 'bg-amber-400 text-obsidian-950 cursor-pointer'
                : 'btn-neon-silver cursor-pointer'
            }`}
          >
            <Lock className="w-3.5 h-3.5" strokeWidth={2} />
            <span>
              {isActaClosedSimulated
                ? 'Acta Sellada (Modo Inmutable Activo)'
                : 'Sellar Acta de Cohorte'}
            </span>
          </button>
        </div>
      </div>

      {isActaClosedSimulated && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/35 flex items-start gap-3 text-xs text-amber-200">
          <FileWarning className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="font-bold text-white">
              ACTA_CLOSED_IMMUTABLE — Trigger PostgreSQL{' '}
              <code>trg_immutable_submissions_on_closed</code> Activo
            </p>
            <p className="mt-0.5 text-slate-200">
              Las calificaciones y asistencias han quedado bloqueadas contra edición directa.
              Cualquier modificación posterior requiere registrar una solicitud auditada en{' '}
              <code>public.grade_rectifications</code> aprobada por un Coordinador.
            </p>
          </div>
        </div>
      )}

      {/* 3. Grilla Principal: Rubros Ponderados (Izquierda) + Matriz de Asistencia (Derecha) */}
      <div className="grid grid-cols-1 @3xl/workspace:grid-cols-12 gap-5">
        {/* Columna Izquierda (7/12): Libro de Calificaciones Ponderado */}
        <div className="@3xl/workspace:col-span-7 card-obsidian rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-white svg-neon-glow" />
                <span>
                  Rubros de Evaluación en `public.evaluation_items` (
                  {activeBundle.evaluationItems.length})
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Desliza cada calificación para calcular el promedio ponderado en tiempo real
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Nota Final Ponderada</span>
              <span className="text-2xl font-bold text-white font-mono">
                {gradeCalc.finalGrade.toFixed(2)}{' '}
                <span className="text-xs text-slate-400">/ 100</span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {activeBundle.evaluationItems.map((item) => {
              const currentScore = scoresByItem[item.id] ?? 85;
              const pointsContribution = Number(
                ((currentScore * item.weightPct) / 100).toFixed(2)
              );

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#0B0E14] border border-white/10 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-sky-300">
                        {item.type} · Peso: {item.weightPct.toFixed(2)}%
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {item.title}
                      </h4>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-bold text-white font-mono">
                        {currentScore.toFixed(1)} pts
                      </span>
                      <span className="text-[11px] text-emerald-300 font-mono block">
                        Aporta: +{pointsContribution.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    disabled={isActaClosedSimulated}
                    value={currentScore}
                    onChange={(e) =>
                      setScoresByItem((prev) => ({
                        ...prev,
                        [item.id]: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-white cursor-pointer disabled:opacity-40"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha (5/12): Matriz de Asistencia Rápida + Alerta Temprana */}
        <div className="@3xl/workspace:col-span-5 card-obsidian rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-white svg-neon-glow" />
                  <span>Control de Asistencia (`public.class_sessions`)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  P = Presente (1.0) · J = Justificado (1.0) · T = Tardanza (0.5) · A =
                  Ausente (0.0)
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Asistencia</span>
                <span className="text-2xl font-bold text-white font-mono">
                  {attendanceCalc.currentAttendancePct.toFixed(0)}%
                </span>
              </div>
            </div>

            {activeBundle.sessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">
                Esta cohorte (`upcoming`) aún no tiene sesiones dictadas en calendario.
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeBundle.sessions.map((ses) => {
                  const currentStatus =
                    attendanceBySession[ses.id] ?? 'present';
                  return (
                    <div
                      key={ses.id}
                      className="p-3 rounded-xl bg-[#0B0E14] border border-white/10 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Sesión #{ses.sessionNumber}
                        </span>
                        <p className="text-xs font-semibold text-white truncate">
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
                            disabled={isActaClosedSimulated}
                            onClick={() =>
                              setAttendanceBySession((prev) => ({
                                ...prev,
                                [ses.id]: btn.key,
                              }))
                            }
                            className={`w-7 h-7 rounded-lg font-mono text-[11px] font-bold transition cursor-pointer disabled:opacity-40 ${
                              currentStatus === btn.key
                                ? 'bg-white text-obsidian-950 shadow-[0_0_10px_rgba(255,255,255,0.35)]'
                                : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/10'
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

          {/* Tarjeta de Dictamen Final y Alerta Temprana de Deserción */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-white/15 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Nivel de Riesgo Académico:</span>
              <span
                className={`font-mono font-bold ${
                  attendanceCalc.riskLevel === 'normal'
                    ? 'text-emerald-300'
                    : attendanceCalc.riskLevel === 'warning'
                    ? 'text-amber-300'
                    : 'text-red-300'
                }`}
              >
                {attendanceCalc.riskLevel.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-slate-300 font-semibold">
                Dictamen de Conjunción (Nota + Asistencia):
              </span>
              {finalVerdict === 'completed' ? (
                <span className="inline-flex items-center gap-1 font-mono font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  APROBADO (completed)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono font-bold text-red-300">
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
