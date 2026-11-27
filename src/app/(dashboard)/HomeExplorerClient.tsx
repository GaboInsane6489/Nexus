'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Code2,
  Cpu,
  ShieldCheck,
  Palette,
  DollarSign,
  Database,
  Zap,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Search,
  Sparkles,
  Award,
} from 'lucide-react';
import type {
  AcademicTermEntity,
  CourseEntity,
  LearningPathEntity,
} from '@/modules/catalog';

const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  code: Code2,
  cpu: Cpu,
  shield: ShieldCheck,
  palette: Palette,
  dollar: DollarSign,
  database: Database,
};

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function computeCountdown(endDateIso: string): CountdownParts {
  const targetMs = new Date(endDateIso).getTime();
  if (Number.isNaN(targetMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const diffMs = targetMs - Date.now();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: false };
}

interface HomeExplorerClientProps {
  paths: LearningPathEntity[];
  courses: CourseEntity[];
  activeTerm: AcademicTermEntity | null;
  openCohortsCount: number;
}

export function HomeExplorerClient({
  paths,
  courses,
  activeTerm,
  openCohortsCount,
}: HomeExplorerClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [launchesExpanded, setLaunchesExpanded] = useState(false);
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const [countdown, setCountdown] = useState<CountdownParts | null>(() =>
    activeTerm ? computeCountdown(activeTerm.endDate) : null
  );

  const heroSlides = [
    {
      eyebrow: activeTerm
        ? `CONVOCATORIA ${activeTerm.code} · ARQUITECTURA EDUCATIVA`
        : 'CATÁLOGO ACADÉMICO · ARQUITECTURA EDUCATIVA',
      titleLine1: 'Forja tu',
      titleLine2: 'Maestría Real',
      subtitle:
        'Rutas curriculares con prerrequisitos DAG, control académico ERP ponderado y certificaciones verificables con firma SHA-256.',
    },
    {
      eyebrow: 'INGENIERÍA Y PRECISIÓN ACADÉMICA',
      titleLine1: 'Diseñado con',
      titleLine2: 'Rigor y Ciencia',
      subtitle:
        'Cada cohorte combina sesiones sincrónicas, libro de calificaciones transparente y progresión gamificada sin atajos.',
    },
  ];

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 5500);

    if (!activeTerm) {
      setCountdown(null);
      return () => clearInterval(slideTimer);
    }

    setCountdown(computeCountdown(activeTerm.endDate));
    const secTimer = setInterval(() => {
      setCountdown(computeCountdown(activeTerm.endDate));
    }, 1000);

    return () => {
      clearInterval(secTimer);
      clearInterval(slideTimer);
    };
  }, [activeTerm, heroSlides.length]);

  const filteredPaths = paths.filter(
    (p) =>
      p.facultyName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const activeSlide = heroSlides[heroSlideIdx];

  return (
    <div className="space-y-10">
      {/* ===================================================================== */}
      {/* 1. HERO EDITORIAL (CRYSTAL & OBSIDIAN)                                */}
      {/* ===================================================================== */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-900/[0.08] bg-gradient-to-br from-white/95 via-[#F2F5F9]/90 to-[#E4E9F1]/85 p-6 sm:p-10 lg:p-12 shadow-[0_24px_70px_-15px_rgba(15,23,42,0.10)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-900/10 text-[10px] font-mono font-semibold tracking-widest uppercase text-slate-600 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-amber" />
              <span>{activeSlide.eyebrow}</span>
            </div>

            <div key={heroSlideIdx} className="animate-reveal space-y-1">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[#090B0F] tracking-tight leading-[1.06]">
                {activeSlide.titleLine1}
                <br />
                <span className="italic font-medium text-slate-800">
                  {activeSlide.titleLine2}
                </span>
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
              {activeSlide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/paths"
                className="btn-obsidian px-6 py-3 rounded-full text-xs font-semibold tracking-wide inline-flex items-center gap-2"
              >
                <span>Explorar Malla DAG</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </Link>
              <Link
                href="/commerce"
                className="btn-glass px-6 py-3 rounded-full text-xs font-semibold tracking-wide inline-flex items-center gap-2"
              >
                <span>
                  {activeTerm ? `Cohortes ${activeTerm.code}` : 'Explorar Cohortes'}
                </span>
              </Link>
            </div>

            {/* Countdown Real desde Academic Term en PostgreSQL */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono text-slate-500">
              {!activeTerm ? (
                <span className="px-3 py-1 rounded-full bg-white border border-slate-900/10 text-slate-600">
                  Sin período académico activo
                </span>
              ) : countdown && !countdown.expired ? (
                <>
                  <span>Cierre de {activeTerm.code}:</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-900/10 text-[#090B0F] font-bold">
                    {String(countdown.days).padStart(2, '0')}d
                  </span>
                  <span>:</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-900/10 text-[#090B0F] font-bold">
                    {String(countdown.hours).padStart(2, '0')}h
                  </span>
                  <span>:</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-900/10 text-[#090B0F] font-bold">
                    {String(countdown.minutes).padStart(2, '0')}m
                  </span>
                  <span>:</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#090B0F] text-white font-bold">
                    {String(countdown.seconds).padStart(2, '0')}s
                  </span>
                </>
              ) : (
                <span className="px-3 py-1 rounded-full bg-white border border-slate-900/10 text-[#090B0F] font-semibold">
                  Período {activeTerm.code} ({activeTerm.name})
                </span>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[260px] sm:min-h-[300px]">
            <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-slate-200/80 via-white to-amber-100/60 blur-2xl" />

            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-slate-900/10 animate-orbit-slow" />
              <div className="absolute inset-4 rounded-full border border-dashed border-slate-400/40 animate-orbit-slow" />

              <div className="animate-float-slow relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-white/95 via-slate-100/70 to-slate-300/60 backdrop-blur-2xl border border-white shadow-[0_25px_60px_-10px_rgba(15,23,42,0.18),inset_0_2px_12px_rgba(255,255,255,0.95)] flex flex-col items-center justify-center text-center p-4">
                <Award className="w-7 h-7 text-[#090B0F] mb-1.5" strokeWidth={1.5} />
                <span className="font-serif text-lg text-[#090B0F] leading-tight">
                  Nexus
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                  SHA-256 Verified
                </span>
              </div>

              <div className="animate-float-reverse absolute -top-1 right-4 w-11 h-11 rounded-2xl rotate-12 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_12px_25px_rgba(217,119,6,0.38),inset_0_2px_4px_rgba(255,255,255,0.7)] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
              </div>

              <div className="animate-float-reverse absolute -bottom-2 -left-2 sm:-left-6 px-3.5 py-2.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-900/10 shadow-[0_14px_30px_rgba(15,23,42,0.10)] flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#090B0F] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                  {openCohortsCount}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#090B0F] block leading-none">
                    Cohortes Activas
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {activeTerm
                      ? `Período ${activeTerm.code}`
                      : 'Sin período académico activo'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. DIVISOR INTERACTIVO DE MATERIAS TRONCALES EN POSTGRESQL            */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        <div className="relative flex items-center justify-center py-2">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-900/15 to-transparent" />
          <button
            onClick={() => setLaunchesExpanded((prev) => !prev)}
            className="absolute px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-900/10 hover:border-slate-900/25 text-xs text-[#090B0F] font-medium flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" strokeWidth={2} />
            <span>{courses.length} materias troncales activas en PostgreSQL</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                launchesExpanded ? 'rotate-180' : ''
              }`}
              strokeWidth={2}
            />
          </button>
        </div>

        {launchesExpanded && (
          <div className="grid grid-cols-1 @sm/workspace:grid-cols-2 @xl/workspace:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/75 backdrop-blur-xl border border-slate-900/[0.08] animate-reveal">
            {courses.map((course) => (
              <Link
                key={course.id}
                href="/paths"
                className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-900/[0.07] hover:border-slate-900/20 flex items-center justify-between transition"
              >
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-mono font-semibold text-amber-700 uppercase">
                    {course.code} · {course.levelLabel}
                  </span>
                  <p className="text-xs font-bold text-[#090B0F] mt-0.5 truncate">
                    {course.title}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#090B0F] shrink-0">
                  ${course.priceIndividual.toFixed(0)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. SECCIÓN EDITORIAL: ELIGE LA RUTA QUE QUIERES DOMINAR               */}
      {/* ===================================================================== */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#090B0F] tracking-tight">
              Elige la Ruta que Quieres Dominar
            </h2>
            <p className="text-xs text-slate-500">
              Facultades y programas curriculares consultados en vivo desde{' '}
              <code className="font-mono text-slate-700">public.learning_paths</code>
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar facultades..."
              className="w-full bg-white/85 text-xs text-[#090B0F] placeholder-slate-400 pl-9 pr-3 py-2.5 rounded-full border border-slate-900/10 focus:outline-none focus:border-slate-900/30 shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 @md/workspace:grid-cols-2 @2xl/workspace:grid-cols-3 gap-4">
          {filteredPaths.map((path, idx) => {
            const Icon = ICON_MAP[path.iconKey] ?? Code2;
            return (
              <Link
                key={path.id}
                href="/paths"
                style={{ animationDelay: `${idx * 60}ms` }}
                className="card-glass animate-reveal rounded-2xl p-5 flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-900/[0.04] border border-slate-900/[0.08] group-hover:bg-[#090B0F] group-hover:text-white flex items-center justify-center shrink-0 transition-colors duration-200">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#090B0F] truncate">
                    {path.facultyName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {path.estimatedWeeks} semanas · Paquete ${path.priceBundle.toFixed(0)} USD
                  </p>
                </div>
                <ChevronRight
                  className="w-4 h-4 text-slate-400 group-hover:text-[#090B0F] group-hover:translate-x-0.5 transition shrink-0"
                  strokeWidth={2}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
