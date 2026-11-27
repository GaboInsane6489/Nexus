'use client';

import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  CheckCircle2,
  Lock,
  Unlock,
  PlayCircle,
  FileText,
  Clock,
  ShieldAlert,
  Sparkles,
  Calendar,
  BookOpen,
} from 'lucide-react';
import type {
  AcademicTermEntity,
  CourseEntity,
  CoursePrerequisiteEdge,
  LearningPathEntity,
} from '../../domain/entities';
import { evaluateCurriculumDag, wouldCreateDagCycle } from '../../domain/rules';

interface CatalogDagExplorerClientProps {
  terms: AcademicTermEntity[];
  paths: LearningPathEntity[];
  courses: CourseEntity[];
  edges: CoursePrerequisiteEdge[];
}

export function CatalogDagExplorerClient({
  terms,
  paths,
  courses,
  edges,
}: CatalogDagExplorerClientProps) {
  // Por defecto simulamos que el estudiante ya aprobó CS-101 para mostrar el desbloqueo progresivo en vivo
  const [completedCourseIds, setCompletedCourseIds] = useState<string[]>(() =>
    courses.length > 0 ? [courses[0].id] : []
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id ?? ''
  );

  // Estado del laboratorio anti-ciclos DAG
  const [testTargetId, setTestTargetId] = useState<string>(courses[0]?.id ?? '');
  const [testRequiredId, setTestRequiredId] = useState<string>(
    courses[courses.length - 1]?.id ?? ''
  );

  const evaluatedNodes = useMemo(
    () =>
      evaluateCurriculumDag(
        courses,
        edges,
        new Set<string>(completedCourseIds)
      ),
    [courses, edges, completedCourseIds]
  );

  const selectedNode =
    evaluatedNodes.find((n) => n.id === selectedCourseId) ?? evaluatedNodes[0];

  const isCycleDetected = useMemo(() => {
    if (!testTargetId || !testRequiredId) return false;
    return wouldCreateDagCycle(edges, testTargetId, testRequiredId);
  }, [edges, testTargetId, testRequiredId]);

  const toggleCourseApproval = (courseId: string) => {
    setCompletedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const primaryPath = paths[0];

  return (
    <div className="space-y-7">
      {/* 1. Cabecera de Programa Curricular y Períodos Reales desde PostgreSQL */}
      <div className="card-obsidian rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-white">
              <GitBranch className="w-3.5 h-3.5 text-white svg-neon-glow" strokeWidth={1.75} />
              <span>GRAFO DIRIGIDO ACÍCLICO (DAG) EN VIVO DESDE POSTGRESQL</span>
            </span>
            {terms.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0B0E14] border border-white/10 text-[11px] font-mono text-slate-300"
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                {t.code} ({t.status})
              </span>
            ))}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {primaryPath?.title ?? 'Malla Curricular Interactiva'}
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            {primaryPath?.summary}
          </p>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
          <div className="text-left lg:text-right">
            <span className="text-[11px] text-slate-400 block">
              Precio Paquete de Ruta Completa
            </span>
            <span className="text-2xl font-bold text-white font-mono">
              ${primaryPath?.priceBundle.toFixed(2) ?? '289.00'}{' '}
              <span className="text-xs text-slate-400 font-normal">USD</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {completedCourseIds.length} de {courses.length} materias aprobadas en simulación
          </span>
        </div>
      </div>

      {/* 2. Lienzo Interactivo de Nodos del Grafo DAG + Inspector de Sílabo */}
      <div className="grid grid-cols-1 @3xl/workspace:grid-cols-12 gap-5">
        {/* Columna Izquierda (7/12): Flujo de Nodos DAG */}
        <div className="@3xl/workspace:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white">
              Malla de Prerrequisitos (Haz clic en Aprobar/Desaprobar para probar el motor DAG)
            </h2>
          </div>

          <div className="space-y-3">
            {evaluatedNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedCourseId(node.id)}
                  className={`rounded-2xl p-4 sm:p-5 transition cursor-pointer border ${
                    isSelected
                      ? 'bg-[#161B24] border-white/45 shadow-[0_0_24px_rgba(226,232,240,0.16)]'
                      : 'card-obsidian'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          node.dagState === 'completed'
                            ? 'bg-white text-obsidian-950 border-white shadow-[0_0_14px_rgba(255,255,255,0.4)]'
                            : node.dagState === 'unlocked'
                            ? 'bg-sky-400/15 text-sky-200 border-sky-300/35'
                            : 'bg-white/[0.03] text-slate-500 border-white/10'
                        }`}
                      >
                        {node.dagState === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" strokeWidth={2.2} />
                        ) : node.dagState === 'unlocked' ? (
                          <Unlock className="w-5 h-5" strokeWidth={1.9} />
                        ) : (
                          <Lock className="w-5 h-5" strokeWidth={1.9} />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[11px] font-mono font-bold text-white">
                            {node.code}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {node.academicCredits} Créditos · {node.totalHours}h · Mín.{' '}
                            {node.minPassingGrade} pts / {node.minAttendancePct}% asist.
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-snug">
                          {node.title}
                        </h3>

                        {node.dagState === 'locked' && (
                          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-amber-300">
                            <span>Bloqueado — Requiere aprobar:</span>
                            {node.missingPrerequisites.map((req) => (
                              <span
                                key={req.courseId}
                                className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-300/30 font-mono"
                              >
                                {req.code} (≥{req.minGradeRequired} pts)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06] shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        ${node.priceIndividual.toFixed(0)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCourseApproval(node.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          node.dagState === 'completed'
                            ? 'bg-white text-obsidian-950 font-bold'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                        }`}
                      >
                        {node.dagState === 'completed'
                          ? 'Aprobado ✓'
                          : 'Simular Aprobación'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha (5/12): Inspector de Módulos/Lecciones + Validador Anti-Ciclos DAG */}
        <div className="@3xl/workspace:col-span-5 space-y-5">
          {selectedNode && (
            <div className="card-obsidian rounded-2xl p-5 space-y-4">
              <div className="border-b border-white/10 pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    SÍLABO OFICIAL EN POSTGRESQL · {selectedNode.code}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white">
                    {selectedNode.levelLabel}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{selectedNode.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedNode.summary}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Módulos y Lecciones Registradas</span>
                </h4>

                {selectedNode.modules.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">
                    Este curso de nivel superior desbloquea sus laboratorios al abrirse la
                    cohorte 2027-I.
                  </p>
                ) : (
                  selectedNode.modules.map((mod) => (
                    <div
                      key={mod.id}
                      className="rounded-xl bg-[#0B0E14] border border-white/10 p-3.5 space-y-2.5"
                    >
                      <p className="text-xs font-bold text-white">{mod.title}</p>
                      <div className="space-y-1.5">
                        {mod.lessons.map((les) => (
                          <div
                            key={les.id}
                            className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {les.contentType === 'video' ? (
                                <PlayCircle className="w-3.5 h-3.5 text-white shrink-0" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              )}
                              <span className="text-slate-200 truncate">{les.title}</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 shrink-0 ml-2">
                              <Clock className="w-3 h-3" />
                              {les.durationMinutes}m
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Laboratorio de Verificación Anti-Ciclos DAG (DFS + Trigger PostgreSQL) */}
          <div className="card-obsidian rounded-2xl p-5 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Sparkles className="w-4 h-4 text-white svg-neon-glow" strokeWidth={1.75} />
                <span>Validador de Integridad Acíclica (DAG Anti-Cycle Engine)</span>
              </div>
              <p className="text-xs text-slate-400">
                Prueba agregar una dependencia entre dos cursos. El algoritmo DFS y el trigger{' '}
                <code className="text-slate-200">trg_enforce_dag_no_cycles</code> en PostgreSQL
                bloquean cualquier ciclo circular.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Curso Destino</label>
                <select
                  value={testTargetId}
                  onChange={(e) => setTestTargetId(e.target.value)}
                  className="w-full bg-[#0B0E14] text-white font-mono px-3 py-2 rounded-lg border border-white/15"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title.slice(0, 24)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">
                  Curso Prerrequisito Propuesto
                </label>
                <select
                  value={testRequiredId}
                  onChange={(e) => setTestRequiredId(e.target.value)}
                  className="w-full bg-[#0B0E14] text-white font-mono px-3 py-2 rounded-lg border border-white/15"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title.slice(0, 24)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isCycleDetected ? (
              <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-400/35 flex items-start gap-2.5 text-xs text-red-200">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <span className="font-bold block text-white">
                    DAG_CYCLE_DETECTED — Operación Bloqueada
                  </span>
                  <span>
                    El curso destino ya es ancestro directo o indirecto del curso propuesto.
                    PostgreSQL rechaza esta arista para proteger la malla curricular.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>
                  Arista válida: No introduce ciclos en el Grafo Dirigido Acíclico (DAG).
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
