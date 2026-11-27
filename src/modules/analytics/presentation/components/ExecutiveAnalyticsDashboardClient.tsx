'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  DollarSign,
  Users,
  GitBranch,
  ShieldCheck,
  BookOpen,
  Award,
  CheckCircle2,
  ArrowUpRight,
  Database,
} from 'lucide-react';
import type { ExecutiveAnalyticsSnapshot } from '../../domain/entities';

interface ExecutiveAnalyticsDashboardClientProps {
  snapshot: ExecutiveAnalyticsSnapshot;
}

export function ExecutiveAnalyticsDashboardClient({
  snapshot,
}: ExecutiveAnalyticsDashboardClientProps) {
  return (
    <div className="space-y-7 animate-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-900/10 text-[11px] font-semibold text-[#090B0F] mb-2 shadow-xs">
            <Activity className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
            <span>
              MÓDULO ANALYTICS · NIVEL 4 (RPC fn_get_executive_analytics_snapshot)
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#090B0F] tracking-tight">
            Centro de Comando Ejecutivo y Auditoría de Base de Datos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas consolidadas en tiempo real sobre las 28 tablas con Row Level Security
            en Supabase PostgreSQL 17.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-600/25 text-emerald-800 text-xs font-mono font-semibold self-start">
          <Database className="w-3.5 h-3.5" />
          <span>28 Tablas RLS Activas · us-east-1</span>
        </div>
      </div>

      <div className="grid grid-cols-1 @sm/workspace:grid-cols-2 @2xl/workspace:grid-cols-4 gap-4">
        <div className="card-glass rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Facturación Estimada Cohortes</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#090B0F] font-mono">
            ${snapshot.commercialAndCohorts.estimatedCohortTuitionUsd.toLocaleString('en-US')}{' '}
            <span className="text-xs font-normal text-slate-500">USD</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-mono font-semibold">
            {snapshot.commercialAndCohorts.openCohorts} cohortes activas en 2027-I
          </p>
        </div>

        <div className="card-glass rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Ocupación Global de Cupos</span>
            <Users className="w-4 h-4 text-[#090B0F]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#090B0F] font-mono">
            {snapshot.commercialAndCohorts.globalOccupancyPct}%
          </div>
          <p className="text-[11px] text-slate-600 font-mono">
            {snapshot.commercialAndCohorts.totalSeatsEnrolled} de{' '}
            {snapshot.commercialAndCohorts.totalSeatsCapacity} asientos ocupados
          </p>
        </div>

        <div className="card-glass rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Malla Curricular & Grafo DAG</span>
            <GitBranch className="w-4 h-4 text-[#090B0F]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#090B0F] font-mono">
            {snapshot.curricular.publishedPaths} Rutas ·{' '}
            {snapshot.curricular.publishedCourses} Cursos
          </div>
          <p className="text-[11px] text-amber-700 font-mono font-semibold">
            {snapshot.curricular.dagPrerequisiteEdges} aristas DAG verificadas sin ciclos
          </p>
        </div>

        <div className="card-glass rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Certificados SHA-256 & Insignias</span>
            <ShieldCheck className="w-4 h-4 text-[#090B0F]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#090B0F] font-mono">
            {snapshot.gamificationAndCerts.validCertificatesSha256} Válidos
          </div>
          <p className="text-[11px] text-slate-600 font-mono">
            {snapshot.gamificationAndCerts.revokedCertificates} revocado ·{' '}
            {snapshot.gamificationAndCerts.catalogBadges} insignias en catálogo
          </p>
        </div>
      </div>

      <div className="card-glass rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900/10 pb-3.5">
          <div>
            <h2 className="font-serif text-xl text-[#090B0F]">
              Estado de los 5 Niveles Arquitectónicos de NEXUS (Fases 1 a 7)
            </h2>
            <p className="text-xs text-slate-500">
              Jerarquía estricta de dependencias (DAG de módulos) y estado empírico en
              PostgreSQL
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#090B0F] text-white font-mono font-bold text-xs">
            100% Operativo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          <Link
            href="/admin/users"
            className="p-4 rounded-2xl bg-white/80 hover:bg-white border border-slate-900/[0.08] hover:border-slate-900/25 transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500 uppercase">
                Nivel 0 · IAM & Core
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#090B0F]" />
            </div>
            <h3 className="text-sm font-bold text-[#090B0F]">
              Gobierno RBAC Multi-Rol y Auditoría
            </h3>
            <p className="text-slate-600">
              Tablas: profiles, user_roles, audit_logs con triggers JWT.
            </p>
          </Link>

          <Link
            href="/paths"
            className="p-4 rounded-2xl bg-white/80 hover:bg-white border border-slate-900/[0.08] hover:border-slate-900/25 transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-amber-700 font-semibold uppercase">
                Nivel 1 · Catalog & DAG
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#090B0F]" />
            </div>
            <h3 className="text-sm font-bold text-[#090B0F]">
              Malla Curricular y Prerrequisitos Acíclicos
            </h3>
            <p className="text-slate-600">
              Trigger recursivo CTE trg_enforce_dag_no_cycles activo.
            </p>
          </Link>

          <Link
            href="/commerce"
            className="p-4 rounded-2xl bg-white/80 hover:bg-white border border-slate-900/[0.08] hover:border-slate-900/25 transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-emerald-700 font-semibold uppercase">
                Nivel 2 · Commerce
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#090B0F]" />
            </div>
            <h3 className="text-sm font-bold text-[#090B0F]">
              Cohortes 2027-I, Cupones y Matrículas
            </h3>
            <p className="text-slate-600">
              RPC fn_check_cohort_enrollment_eligibility en tiempo real.
            </p>
          </Link>

          <Link
            href="/erp"
            className="p-4 rounded-2xl bg-white/80 hover:bg-white border border-slate-900/[0.08] hover:border-slate-900/25 transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#090B0F] font-semibold uppercase">
                Nivel 3 · Academic ERP
              </span>
              <BookOpen className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#090B0F]" />
            </div>
            <h3 className="text-sm font-bold text-[#090B0F]">
              {snapshot.academicErp.scheduledSessions} Sesiones y{' '}
              {snapshot.academicErp.weightedEvaluationItems} Rubros Ponderados
            </h3>
            <p className="text-slate-600">
              Invariante SUM(w_i) = 100% y bloqueo de actas cerradas.
            </p>
          </Link>

          <Link
            href="/verify"
            className="p-4 rounded-2xl bg-white/80 hover:bg-white border border-slate-900/[0.08] hover:border-slate-900/25 transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#090B0F] font-semibold uppercase">
                Nivel 4 · Gamification & Certs
              </span>
              <Award className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#090B0F]" />
            </div>
            <h3 className="text-sm font-bold text-[#090B0F]">
              Ledger XP Anti-Farming y Firma SHA-256
            </h3>
            <p className="text-slate-600">
              Verificador público O(log N) en /verify/[code].
            </p>
          </Link>

          <div className="p-4 rounded-2xl bg-[#090B0F] text-white space-y-1.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-amber-400 uppercase">
                Verificación Deductiva
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-white">
              28 Tablas + Políticas RLS Optimizadas
            </h3>
            <p className="text-slate-300">
              InitPlan (SELECT auth.uid()), índices cubrientes INCLUDE y GIN Trigram.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
