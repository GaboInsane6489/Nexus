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
} from 'lucide-react';
import type { CourseEntity, LearningPathEntity } from '@/modules/catalog';

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

interface HomeExplorerClientProps {
  paths: LearningPathEntity[];
  courses: CourseEntity[];
}

export function HomeExplorerClient({ paths, courses }: HomeExplorerClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [launchesExpanded, setLaunchesExpanded] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 59));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredPaths = paths.filter(
    (p) =>
      p.facultyName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="space-y-7">
      {/* 1. Hero Banner de Convocatoria Académica con Reloj Regresivo en Vivo */}
      <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-gradient-to-r from-[#0B0E14] via-[#121722] to-[#0D111A] p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-white silver-dot" />
            <span>CONVOCATORIA ACADÉMICA 2027-I ABIERTA · DATOS REALES POSTGRESQL</span>
          </div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight">
            Inscríbete a tu próxima Cohorte o Ruta de Aprendizaje Completa
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Acceso perpetuo a las lecciones, sesiones sincrónicas con control de asistencia,
            evaluación ponderada y certificado verificable SHA-256.
          </p>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 mr-1">Cierra en:</span>
            <span className="px-2 py-1 rounded bg-white text-obsidian-950 font-bold">04d</span> :
            <span className="px-2 py-1 rounded bg-white/90 text-obsidian-950 font-bold">03h</span> :
            <span className="px-2 py-1 rounded bg-white/80 text-obsidian-950 font-bold">56m</span> :
            <span className="px-2 py-1 rounded bg-white/70 text-obsidian-950 font-bold">
              {String(secondsLeft).padStart(2, '0')}s
            </span>
          </div>
          <Link
            href="/paths"
            className="w-full sm:w-auto btn-neon-silver px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2"
          >
            <span>Explorar Malla Curricular DAG</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {/* 2. Divisor Colapsable con los Cursos Reales leídos de PostgreSQL */}
      <div className="space-y-3">
        <div className="relative flex items-center justify-center py-2">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <button
            onClick={() => setLaunchesExpanded((prev) => !prev)}
            className="absolute px-4 py-1.5 rounded-full bg-[#0E1117] border border-white/15 hover:border-slate-200/45 text-xs text-slate-200 font-medium flex items-center gap-2 shadow-[0_0_16px_rgba(0,0,0,0.85)] transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-white svg-neon-glow" strokeWidth={2} />
            <span>{courses.length} materias troncales activas en PostgreSQL</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                launchesExpanded ? 'rotate-180' : ''
              }`}
              strokeWidth={2}
            />
          </button>
        </div>

        {launchesExpanded && (
          <div className="grid grid-cols-1 @sm/workspace:grid-cols-2 @xl/workspace:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#0B0E14] border border-white/10">
            {courses.map((course) => (
              <Link
                key={course.id}
                href="/paths"
                className="p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between transition"
              >
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-mono text-sky-300 uppercase">
                    {course.code} · {course.levelLabel}
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5 truncate">
                    {course.title}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-300 shrink-0">
                  ${course.priceIndividual.toFixed(0)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 3. Grilla Adaptativa con Container Queries: Facultades y Rutas Reales desde PostgreSQL */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Todas nuestras escuelas y rutas curriculares
            </h1>
            <p className="text-xs text-slate-400">
              Consultadas en tiempo real desde public.learning_paths en Supabase PostgreSQL
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar facultades..."
              className="w-full bg-[#101319] text-xs text-white placeholder-slate-400 pl-8 pr-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-white/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 @md/workspace:grid-cols-2 @2xl/workspace:grid-cols-3 gap-3.5">
          {filteredPaths.map((path) => {
            const Icon = ICON_MAP[path.iconKey] ?? Code2;
            return (
              <Link
                key={path.id}
                href="/paths"
                className="card-obsidian rounded-xl p-4 flex items-center gap-4 group"
              >
                <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/20 group-hover:border-white/55 group-hover:shadow-[0_0_16px_rgba(255,255,255,0.2)] flex items-center justify-center shrink-0 transition">
                  <Icon
                    className="w-5 h-5 text-slate-200 group-hover:text-white svg-neon-glow"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-slate-100 truncate">
                    {path.facultyName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {path.estimatedWeeks} semanas · Paquete ${path.priceBundle.toFixed(0)} USD
                  </p>
                </div>
                <ChevronRight
                  className="w-4 h-4 text-slate-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition shrink-0"
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
