'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
  Plus,
  Trash2,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import type { AppRole } from '@/modules/iam';
import type {
  AcademicTermEntity,
  CourseEntity,
  CoursePrerequisiteEdge,
  LearningPathEntity,
  LessonContentType,
  TermStatus,
} from '../../domain/entities';
import { evaluateCurriculumDag, wouldCreateDagCycle } from '../../domain/rules';
import {
  validateAndAddPrerequisiteAction,
  deletePrerequisiteAction,
  createAcademicTermAction,
  createLearningPathAction,
  createCourseAction,
  createCourseModuleAction,
  createLessonAction,
} from '../actions';

interface CatalogDagExplorerClientProps {
  terms: AcademicTermEntity[];
  paths: LearningPathEntity[];
  courses: CourseEntity[];
  edges: CoursePrerequisiteEdge[];
  userRole: AppRole;
  completedCourseIds: string[];
}

type CurricularTab = 'term' | 'path' | 'course' | 'module_lesson';

export function CatalogDagExplorerClient({
  terms,
  paths,
  courses,
  edges,
  userRole,
  completedCourseIds,
}: CatalogDagExplorerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canManageCurriculum =
    userRole === 'coordinator' || userRole === 'super_admin';

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id ?? ''
  );

  // DAG Validator & Edge Management State
  const [testTargetId, setTestTargetId] = useState<string>(courses[0]?.id ?? '');
  const [testRequiredId, setTestRequiredId] = useState<string>(
    courses[courses.length - 1]?.id ?? ''
  );
  const [minGradeRequired, setMinGradeRequired] = useState<number>(70);
  const [dagFeedback, setDagFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Collapsible Curricular Management Panel
  const [mgmtOpen, setMgmtOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CurricularTab>('term');
  const [mgmtFeedback, setMgmtFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Form states: Academic Term
  const [termCode, setTermCode] = useState('');
  const [termName, setTermName] = useState('');
  const [termStartDate, setTermStartDate] = useState('');
  const [termEndDate, setTermEndDate] = useState('');
  const [termStatus, setTermStatus] = useState<TermStatus>('planning');

  // Form states: Learning Path
  const [pathSlug, setPathSlug] = useState('');
  const [pathFaculty, setPathFaculty] = useState('');
  const [pathTitle, setPathTitle] = useState('');
  const [pathSummary, setPathSummary] = useState('');
  const [pathIconKey, setPathIconKey] = useState('code');
  const [pathPrice, setPathPrice] = useState(199);
  const [pathWeeks, setPathWeeks] = useState(12);
  const [pathPublished, setPathPublished] = useState(true);

  // Form states: Course
  const [courseCode, setCourseCode] = useState('');
  const [courseSlug, setCourseSlug] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSummary, setCourseSummary] = useState('');
  const [courseLevel, setCourseLevel] = useState('Intermedio');
  const [coursePrice, setCoursePrice] = useState(79);
  const [courseCredits, setCourseCredits] = useState(4);
  const [courseHours, setCourseHours] = useState(32);
  const [courseMinGrade, setCourseMinGrade] = useState(70);
  const [courseMinAtt, setCourseMinAtt] = useState(80);
  const [coursePublished, setCoursePublished] = useState(true);

  // Form states: Module & Lesson
  const [modCourseId, setModCourseId] = useState(courses[0]?.id ?? '');
  const [modTitle, setModTitle] = useState('');
  const [modSortOrder, setModSortOrder] = useState(1);

  const allModules = useMemo(
    () =>
      courses.flatMap((c) =>
        c.modules.map((m) => ({
          id: m.id,
          label: `${c.code} — ${m.title}`,
        }))
      ),
    [courses]
  );

  const [lesModuleId, setLesModuleId] = useState(allModules[0]?.id ?? '');
  const [lesTitle, setLesTitle] = useState('');
  const [lesType, setLesType] = useState<LessonContentType>('video');
  const [lesDuration, setLesDuration] = useState(15);
  const [lesFreePreview, setLesFreePreview] = useState(false);
  const [lesSortOrder, setLesSortOrder] = useState(1);

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

  const courseById = useMemo(
    () => new Map(courses.map((c) => [c.id, c])),
    [courses]
  );

  const handleAddEdge = () => {
    setDagFeedback(null);
    startTransition(async () => {
      const res = await validateAndAddPrerequisiteAction({
        courseId: testTargetId,
        requiredCourseId: testRequiredId,
        minGradeRequired,
      });
      if (res.success) {
        setDagFeedback({
          type: 'success',
          message:
            res.message ??
            'Prerrequisito validado sin ciclos y registrado en PostgreSQL.',
        });
        router.refresh();
      } else {
        setDagFeedback({
          type: 'error',
          message: res.error.message,
        });
      }
    });
  };

  const handleDeleteEdge = (edgeId: string) => {
    setDagFeedback(null);
    startTransition(async () => {
      const res = await deletePrerequisiteAction({ edgeId });
      if (res.success) {
        setDagFeedback({
          type: 'success',
          message: res.message ?? 'Prerrequisito eliminado de PostgreSQL.',
        });
        router.refresh();
      } else {
        setDagFeedback({
          type: 'error',
          message: res.error.message,
        });
      }
    });
  };

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    setMgmtFeedback(null);
    startTransition(async () => {
      const res = await createAcademicTermAction({
        code: termCode,
        name: termName,
        startDate: termStartDate,
        endDate: termEndDate,
        status: termStatus,
      });
      if (res.success) {
        setMgmtFeedback({
          type: 'success',
          message: res.message ?? 'Período académico creado.',
        });
        setTermCode('');
        setTermName('');
        router.refresh();
      } else {
        setMgmtFeedback({ type: 'error', message: res.error.message });
      }
    });
  };

  const handleCreatePath = (e: React.FormEvent) => {
    e.preventDefault();
    setMgmtFeedback(null);
    startTransition(async () => {
      const res = await createLearningPathAction({
        slug: pathSlug,
        facultyName: pathFaculty,
        title: pathTitle,
        summary: pathSummary,
        iconKey: pathIconKey,
        priceBundle: pathPrice,
        estimatedWeeks: pathWeeks,
        isPublished: pathPublished,
      });
      if (res.success) {
        setMgmtFeedback({
          type: 'success',
          message: res.message ?? 'Ruta de aprendizaje creada.',
        });
        setPathSlug('');
        setPathTitle('');
        setPathSummary('');
        router.refresh();
      } else {
        setMgmtFeedback({ type: 'error', message: res.error.message });
      }
    });
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    setMgmtFeedback(null);
    startTransition(async () => {
      const res = await createCourseAction({
        code: courseCode,
        slug: courseSlug,
        title: courseTitle,
        summary: courseSummary,
        levelLabel: courseLevel,
        priceIndividual: coursePrice,
        academicCredits: courseCredits,
        totalHours: courseHours,
        minPassingGrade: courseMinGrade,
        minAttendancePct: courseMinAtt,
        isPublished: coursePublished,
      });
      if (res.success) {
        setMgmtFeedback({
          type: 'success',
          message: res.message ?? 'Curso creado en PostgreSQL.',
        });
        setCourseCode('');
        setCourseSlug('');
        setCourseTitle('');
        setCourseSummary('');
        router.refresh();
      } else {
        setMgmtFeedback({ type: 'error', message: res.error.message });
      }
    });
  };

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    setMgmtFeedback(null);
    startTransition(async () => {
      const res = await createCourseModuleAction({
        courseId: modCourseId,
        title: modTitle,
        sortOrder: modSortOrder,
      });
      if (res.success) {
        setMgmtFeedback({
          type: 'success',
          message: res.message ?? 'Módulo creado en PostgreSQL.',
        });
        setModTitle('');
        router.refresh();
      } else {
        setMgmtFeedback({ type: 'error', message: res.error.message });
      }
    });
  };

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    setMgmtFeedback(null);
    startTransition(async () => {
      const res = await createLessonAction({
        moduleId: lesModuleId,
        title: lesTitle,
        contentType: lesType,
        durationMinutes: lesDuration,
        isFreePreview: lesFreePreview,
        sortOrder: lesSortOrder,
      });
      if (res.success) {
        setMgmtFeedback({
          type: 'success',
          message: res.message ?? 'Lección creada en PostgreSQL.',
        });
        setLesTitle('');
        router.refresh();
      } else {
        setMgmtFeedback({ type: 'error', message: res.error.message });
      }
    });
  };

  const primaryPath = paths[0];
  const bundlePriceUsd =
    primaryPath?.priceBundle ??
    courses.reduce((sum, course) => sum + course.priceIndividual, 0);

  return (
    <div className="space-y-7 animate-reveal">
      <div className="card-glass rounded-3xl p-5 sm:p-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#090B0F] text-white text-[11px] font-semibold">
              <GitBranch className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
              <span>GRAFO DIRIGIDO ACÍCLICO (DAG) EN VIVO DESDE POSTGRESQL</span>
            </span>
            {terms.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-900/10 text-[11px] font-mono text-slate-700"
              >
                <Calendar className="w-3 h-3 text-slate-500" />
                {t.code} ({t.status})
              </span>
            ))}
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-[#090B0F] tracking-tight">
            {primaryPath?.title ?? 'Malla Curricular Interactiva'}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            {primaryPath?.summary}
          </p>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-900/10">
          <div className="text-left lg:text-right">
            <span className="text-[11px] text-slate-500 block">
              Precio Paquete de Ruta Completa
            </span>
            <span className="text-2xl font-bold text-[#090B0F] font-mono">
              ${bundlePriceUsd.toFixed(2)}{' '}
              <span className="text-xs text-slate-500 font-normal">USD</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {completedCourseIds.length} de {courses.length} cursos aprobados en tu historial
          </span>
        </div>
      </div>

      {/* PANEL COLAPSABLE DE GESTIÓN CURRICULAR (COORDINATOR / SUPER_ADMIN) */}
      {canManageCurriculum && (
        <div className="card-glass rounded-3xl overflow-hidden">
          <button
            type="button"
            onClick={() => setMgmtOpen((prev) => !prev)}
            className="w-full px-5 sm:px-7 py-4 flex items-center justify-between text-left hover:bg-white/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Settings2 className="w-4 h-4 text-[#090B0F]" strokeWidth={1.75} />
              <span className="text-xs sm:text-sm font-bold text-[#090B0F]">
                Gestión Curricular
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900/[0.06] text-[10px] font-mono text-slate-600">
                {userRole}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                mgmtOpen ? 'rotate-180' : ''
              }`}
              strokeWidth={2}
            />
          </button>

          {mgmtOpen && (
            <div className="px-5 sm:px-7 pb-6 pt-2 border-t border-slate-900/10 space-y-4">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'term', label: 'Período Académico' },
                    { id: 'path', label: 'Ruta de Aprendizaje' },
                    { id: 'course', label: 'Curso' },
                    { id: 'module_lesson', label: 'Módulo / Lección' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMgmtFeedback(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-[#090B0F] text-white'
                        : 'bg-white border border-slate-900/10 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {mgmtFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    mgmtFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-600/25 text-emerald-800'
                      : 'bg-red-500/10 border border-red-500/30 text-red-800'
                  }`}
                >
                  {mgmtFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                  )}
                  <span>{mgmtFeedback.message}</span>
                </div>
              )}

              {activeTab === 'term' && (
                <form
                  onSubmit={handleCreateTerm}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs"
                >
                  <input
                    required
                    placeholder="Código (ej. 2027-II)"
                    value={termCode}
                    onChange={(e) => setTermCode(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <input
                    required
                    placeholder="Nombre del período"
                    value={termName}
                    onChange={(e) => setTermName(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <input
                    required
                    type="date"
                    value={termStartDate}
                    onChange={(e) => setTermStartDate(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <input
                    required
                    type="date"
                    value={termEndDate}
                    onChange={(e) => setTermEndDate(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <div className="flex gap-2">
                    <select
                      value={termStatus}
                      onChange={(e) => setTermStatus(e.target.value as TermStatus)}
                      className="flex-1 bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                    >
                      <option value="planning">planning</option>
                      <option value="enrollment_open">enrollment_open</option>
                      <option value="in_progress">in_progress</option>
                      <option value="closed">closed</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="btn-obsidian px-4 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear</span>
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'path' && (
                <form
                  onSubmit={handleCreatePath}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs"
                >
                  <input
                    required
                    placeholder="Slug (ej. cloud-architect)"
                    value={pathSlug}
                    onChange={(e) => setPathSlug(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <input
                    required
                    placeholder="Facultad (ej. Ingeniería Cloud)"
                    value={pathFaculty}
                    onChange={(e) => setPathFaculty(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <input
                    required
                    placeholder="Título de la ruta"
                    value={pathTitle}
                    onChange={(e) => setPathTitle(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <select
                    value={pathIconKey}
                    onChange={(e) => setPathIconKey(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  >
                    <option value="code">code</option>
                    <option value="cpu">cpu</option>
                    <option value="shield">shield</option>
                    <option value="palette">palette</option>
                    <option value="dollar">dollar</option>
                    <option value="database">database</option>
                  </select>
                  <input
                    required
                    placeholder="Resumen"
                    value={pathSummary}
                    onChange={(e) => setPathSummary(e.target.value)}
                    className="sm:col-span-2 bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Precio Paquete USD"
                    value={pathPrice}
                    onChange={(e) => setPathPrice(Number(e.target.value))}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      required
                      type="number"
                      min={1}
                      placeholder="Semanas"
                      value={pathWeeks}
                      onChange={(e) => setPathWeeks(Number(e.target.value))}
                      className="w-20 bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                    />
                    <label className="flex items-center gap-1.5 text-slate-700">
                      <input
                        type="checkbox"
                        checked={pathPublished}
                        onChange={(e) => setPathPublished(e.target.checked)}
                      />
                      <span>Publicar</span>
                    </label>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="ml-auto btn-obsidian px-4 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear</span>
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'course' && (
                <form
                  onSubmit={handleCreateCourse}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs"
                >
                  <input
                    required
                    placeholder="Código (ej. CS-301)"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <input
                    required
                    placeholder="Slug (ej. sistemas-distribuidos)"
                    value={courseSlug}
                    onChange={(e) => setCourseSlug(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <input
                    required
                    placeholder="Título del curso"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <input
                    required
                    placeholder="Nivel (ej. Avanzado)"
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value)}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <input
                    required
                    placeholder="Resumen del sílabo"
                    value={courseSummary}
                    onChange={(e) => setCourseSummary(e.target.value)}
                    className="sm:col-span-2 bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      required
                      type="number"
                      min={0}
                      title="Precio USD"
                      value={coursePrice}
                      onChange={(e) => setCoursePrice(Number(e.target.value))}
                      className="bg-white px-2 py-2 rounded-xl border border-slate-900/15"
                    />
                    <input
                      required
                      type="number"
                      min={1}
                      title="Créditos"
                      value={courseCredits}
                      onChange={(e) => setCourseCredits(Number(e.target.value))}
                      className="bg-white px-2 py-2 rounded-xl border border-slate-900/15"
                    />
                    <input
                      required
                      type="number"
                      min={1}
                      title="Horas totales"
                      value={courseHours}
                      onChange={(e) => setCourseHours(Number(e.target.value))}
                      className="bg-white px-2 py-2 rounded-xl border border-slate-900/15"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      required
                      type="number"
                      min={0}
                      max={100}
                      title="Nota mínima"
                      value={courseMinGrade}
                      onChange={(e) => setCourseMinGrade(Number(e.target.value))}
                      className="w-16 bg-white px-2 py-2 rounded-xl border border-slate-900/15"
                    />
                    <input
                      required
                      type="number"
                      min={0}
                      max={100}
                      title="Asistencia mínima %"
                      value={courseMinAtt}
                      onChange={(e) => setCourseMinAtt(Number(e.target.value))}
                      className="w-16 bg-white px-2 py-2 rounded-xl border border-slate-900/15"
                    />
                    <label className="flex items-center gap-1 text-slate-700">
                      <input
                        type="checkbox"
                        checked={coursePublished}
                        onChange={(e) => setCoursePublished(e.target.checked)}
                      />
                      <span>Pub.</span>
                    </label>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="ml-auto btn-obsidian px-4 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear</span>
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'module_lesson' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                  <form
                    onSubmit={handleCreateModule}
                    className="p-3.5 rounded-2xl bg-white/70 border border-slate-900/10 space-y-2.5"
                  >
                    <p className="font-bold text-[#090B0F]">Nuevo Módulo de Curso</p>
                    <select
                      value={modCourseId}
                      onChange={(e) => setModCourseId(e.target.value)}
                      className="w-full bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.title}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        required
                        placeholder="Título del módulo"
                        value={modTitle}
                        onChange={(e) => setModTitle(e.target.value)}
                        className="flex-1 bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                      />
                      <input
                        required
                        type="number"
                        min={1}
                        value={modSortOrder}
                        onChange={(e) => setModSortOrder(Number(e.target.value))}
                        className="w-16 bg-white px-2 py-2 rounded-xl border border-slate-900/15"
                      />
                      <button
                        type="submit"
                        disabled={isPending || courses.length === 0}
                        className="btn-obsidian px-3.5 py-2 rounded-xl font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        Agregar
                      </button>
                    </div>
                  </form>

                  <form
                    onSubmit={handleCreateLesson}
                    className="p-3.5 rounded-2xl bg-white/70 border border-slate-900/10 space-y-2.5"
                  >
                    <p className="font-bold text-[#090B0F]">Nueva Lección</p>
                    <select
                      value={lesModuleId}
                      onChange={(e) => setLesModuleId(e.target.value)}
                      className="w-full bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                    >
                      {allModules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap gap-2">
                      <input
                        required
                        placeholder="Título de la lección"
                        value={lesTitle}
                        onChange={(e) => setLesTitle(e.target.value)}
                        className="flex-1 min-w-[140px] bg-white px-3 py-2 rounded-xl border border-slate-900/15"
                      />
                      <select
                        value={lesType}
                        onChange={(e) =>
                          setLesType(e.target.value as LessonContentType)
                        }
                        className="bg-white px-2.5 py-2 rounded-xl border border-slate-900/15"
                      >
                        <option value="video">video</option>
                        <option value="reading">reading</option>
                        <option value="resource">resource</option>
                        <option value="quiz_link">quiz_link</option>
                      </select>
                      <input
                        required
                        type="number"
                        min={1}
                        title="Duración (min)"
                        value={lesDuration}
                        onChange={(e) => setLesDuration(Number(e.target.value))}
                        className="w-16 bg-white px-2 py-2 rounded-xl border border-slate-900/15"
                      />
                      <input
                        required
                        type="number"
                        min={1}
                        title="Orden"
                        value={lesSortOrder}
                        onChange={(e) => setLesSortOrder(Number(e.target.value))}
                        className="w-14 bg-white px-2 py-2 rounded-xl border border-slate-900/15"
                      />
                      <label className="flex items-center gap-1 text-slate-700">
                        <input
                          type="checkbox"
                          checked={lesFreePreview}
                          onChange={(e) => setLesFreePreview(e.target.checked)}
                        />
                        <span>Gratis</span>
                      </label>
                      <button
                        type="submit"
                        disabled={isPending || allModules.length === 0}
                        className="btn-obsidian px-3.5 py-2 rounded-xl font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        Agregar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 @3xl/workspace:grid-cols-12 gap-5">
        <div className="@3xl/workspace:col-span-7 space-y-3.5">
          <h2 className="text-sm sm:text-base font-bold text-[#090B0F]">
            Malla de Prerrequisitos
          </h2>

          {completedCourseIds.length === 0 && (
            <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-900/10 text-xs text-slate-600">
              Aún no tienes cursos aprobados en tu historial académico. Los cursos sin
              prerrequisitos pendientes están desbloqueados para iniciar tu ruta.
            </div>
          )}

          <div className="space-y-3">
            {evaluatedNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedCourseId(node.id)}
                  className={`rounded-2xl p-4 sm:p-5 transition cursor-pointer border ${
                    isSelected
                      ? 'bg-white border-[#090B0F] shadow-[0_14px_34px_-10px_rgba(9,11,15,0.16)]'
                      : 'card-glass'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          node.dagState === 'completed'
                            ? 'bg-[#090B0F] text-white border-[#090B0F]'
                            : node.dagState === 'unlocked'
                            ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                            : 'bg-slate-100 text-slate-400 border-slate-900/10'
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
                          <span className="px-2 py-0.5 rounded-md bg-slate-900/[0.06] text-[11px] font-mono font-bold text-[#090B0F]">
                            {node.code}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {node.academicCredits} Créditos · {node.totalHours}h · Mín.{' '}
                            {node.minPassingGrade} pts / {node.minAttendancePct}% asist.
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#090B0F] leading-snug">
                          {node.title}
                        </h3>

                        {node.dagState === 'locked' && (
                          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-amber-800">
                            <span>Bloqueado — Requiere aprobar:</span>
                            {node.missingPrerequisites.map((req) => (
                              <span
                                key={req.courseId}
                                className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 font-mono font-semibold"
                              >
                                {req.code} (≥{req.minGradeRequired} pts)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900/[0.06] shrink-0">
                      <span className="text-xs font-mono font-bold text-[#090B0F]">
                        ${node.priceIndividual.toFixed(0)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          node.dagState === 'completed'
                            ? 'bg-[#090B0F] text-white'
                            : node.dagState === 'unlocked'
                            ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-600/20'
                            : 'bg-slate-100 text-slate-600 border border-slate-900/10'
                        }`}
                      >
                        {node.dagState === 'completed' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>Aprobado</span>
                          </>
                        ) : node.dagState === 'unlocked' ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" strokeWidth={1.75} />
                            <span>Disponible</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
                            <span>Bloqueado</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="@3xl/workspace:col-span-5 space-y-5">
          {selectedNode && (
            <div className="card-glass rounded-3xl p-5 space-y-4">
              <div className="border-b border-slate-900/10 pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    SÍLABO OFICIAL EN POSTGRESQL · {selectedNode.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/[0.06] text-[10px] font-mono font-bold text-[#090B0F]">
                    {selectedNode.levelLabel}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#090B0F]">{selectedNode.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedNode.summary}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Módulos y Lecciones Registradas</span>
                </h4>

                {selectedNode.modules.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    Este curso aún no tiene módulos publicados en el sílabo.
                  </p>
                ) : (
                  selectedNode.modules.map((mod) => (
                    <div
                      key={mod.id}
                      className="rounded-2xl bg-white/80 border border-slate-900/[0.08] p-3.5 space-y-2.5"
                    >
                      <p className="text-xs font-bold text-[#090B0F]">{mod.title}</p>
                      <div className="space-y-1.5">
                        {mod.lessons.map((les) => (
                          <div
                            key={les.id}
                            className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-900/[0.05]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {les.contentType === 'video' ? (
                                <PlayCircle className="w-3.5 h-3.5 text-[#090B0F] shrink-0" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                              <span className="text-slate-700 truncate font-medium">{les.title}</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 shrink-0 ml-2">
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

          <div className="card-glass rounded-3xl p-5 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#090B0F]">
                <Sparkles className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
                <span>Validador de Integridad Acíclica (DAG Anti-Cycle Engine)</span>
              </div>
              <p className="text-xs text-slate-500">
                Verifica o registra dependencias entre cursos. El algoritmo DFS y el trigger{' '}
                <code className="text-[#090B0F] font-semibold">enforce_dag_no_cycles</code> en PostgreSQL
                bloquean cualquier ciclo circular.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold block">Curso Destino</label>
                <select
                  value={testTargetId}
                  onChange={(e) => setTestTargetId(e.target.value)}
                  className="w-full bg-white text-[#090B0F] font-mono px-3 py-2 rounded-xl border border-slate-900/15"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title.slice(0, 22)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold block">
                  Prerrequisito Propuesto
                </label>
                <select
                  value={testRequiredId}
                  onChange={(e) => setTestRequiredId(e.target.value)}
                  className="w-full bg-white text-[#090B0F] font-mono px-3 py-2 rounded-xl border border-slate-900/15"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title.slice(0, 22)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isCycleDetected ? (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-800">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-700" strokeWidth={2} />
                <div>
                  <span className="font-bold block">
                    DAG_CYCLE_DETECTED — Operación Bloqueada
                  </span>
                  <span>
                    El curso destino ya es ancestro directo o indirecto del curso propuesto.
                    PostgreSQL rechaza esta arista para proteger la malla curricular.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-600/25 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" strokeWidth={2} />
                <span>
                  Arista válida: No introduce ciclos en el Grafo Dirigido Acíclico (DAG).
                </span>
              </div>
            )}

            {canManageCurriculum && (
              <div className="space-y-3 pt-2 border-t border-slate-900/10">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label className="text-slate-700 font-semibold">Nota mín.:</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={minGradeRequired}
                    onChange={(e) => setMinGradeRequired(Number(e.target.value))}
                    className="w-20 bg-white px-2.5 py-1.5 rounded-xl border border-slate-900/15 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddEdge}
                    disabled={isPending || courses.length < 2}
                    className="ml-auto btn-obsidian px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar en PostgreSQL</span>
                  </button>
                </div>

                {dagFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                      dagFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-600/25 text-emerald-800'
                        : 'bg-red-500/10 border border-red-500/30 text-red-800'
                    }`}
                  >
                    {dagFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{dagFeedback.message}</span>
                  </div>
                )}

                {edges.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-mono uppercase text-slate-500 block">
                      Aristas Registradas ({edges.length})
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {edges.map((edge) => {
                        const target = courseById.get(edge.courseId);
                        const req = courseById.get(edge.requiredCourseId);
                        return (
                          <div
                            key={edge.id}
                            className="flex items-center justify-between text-[11px] font-mono bg-white/80 border border-slate-900/10 rounded-xl px-3 py-1.5"
                          >
                            <span className="truncate text-slate-700">
                              {req?.code ?? edge.requiredCourseId.slice(0, 8)} →{' '}
                              {target?.code ?? edge.courseId.slice(0, 8)} (≥{edge.minGradeRequired})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteEdge(edge.id)}
                              disabled={isPending}
                              title="Eliminar prerrequisito"
                              className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
