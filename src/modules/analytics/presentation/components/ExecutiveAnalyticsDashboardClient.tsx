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
    <div className="space-y-7">
      {/* 1. Cabecera Ejecutiva de Telemetría en Tiempo Real */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-white mb-2">
            <Activity
              className="w-3.5 h-3.5 text-white svg-neon-glow"
              strokeWidth={1.75}
            />
            <span>
              MÓDULO ANALYTICS · NIVEL 4 (RPC fn_get_executive_analytics_snapshot EN POSTGRESQL)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Centro de Comando Ejecutivo, Auditoría de Base de Datos y KPIs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas consolidadas en tiempo real sobre las 28 tablas con Row Level Security
            en Supabase PostgreSQL 17.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-semibold self-start">
          <Database className="w-3.5 h-3.5" />
          <span>28 Tablas RLS Activas · us-east-1</span>
        </div>
      </div>

      {/* 2. Fila de 4 Macro-KPIs (Comercial, Ocupación, ERP y Certificación) */}
      <div className="grid grid-cols-1 @sm/workspace:grid-cols-2 @2xl/workspace:grid-cols-4 gap-4">
        <div className="card-obsidian rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Facturación Estimada Cohortes</span>
            <DollarSign className="w-4 h-4 text-white svg-neon-glow" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            ${snapshot.commercialAndCohorts.estimatedCohortTuitionUsd.toLocaleString('en-US')}{' '}
            <span className="text-xs font-normal text-slate-400">USD</span>
          </div>
          <p className="text-[11px] text-emerald-300 font-mono">
            {snapshot.commercialAndCohorts.openCohorts} cohortes activas en 2027-I
          </p>
        </div>

        <div className="card-obsidian rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ocupación Global de Cupos</span>
            <Users className="w-4 h-4 text-white svg-neon-glow" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {snapshot.commercialAndCohorts.globalOccupancyPct}%
          </div>
          <p className="text-[11px] text-slate-300 font-mono">
            {snapshot.commercialAndCohorts.totalSeatsEnrolled} de{' '}
            {snapshot.commercialAndCohorts.totalSeatsCapacity} asientos ocupados
          </p>
        </div>

        <div className="card-obsidian rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Malla Curricular & Grafo DAG</span>
            <GitBranch className="w-4 h-4 text-white svg-neon-glow" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {snapshot.curricular.publishedPaths} Rutas ·{' '}
            {snapshot.curricular.publishedCourses} Cursos
          </div>
          <p className="text-[11px] text-sky-300 font-mono">
            {snapshot.curricular.dagPrerequisiteEdges} aristas DAG verificadas sin ciclos
          </p>
        </div>

        <div className="card-obsidian rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Certificados SHA-256 & Insignias</span>
            <ShieldCheck className="w-4 h-4 text-white svg-neon-glow" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {snapshot.gamificationAndCerts.validCertificatesSha256} Válidos
          </div>
          <p className="text-[11px] text-slate-300 font-mono">
            {snapshot.gamificationAndCerts.revokedCertificates} revocado ·{' '}
            {snapshot.gamificationAndCerts.catalogBadges} insignias en catálogo
          </p>
        </div>
      </div>

      {/* 3. Estado de Arquitectura Modular (Niveles 0 al 4) y Enlaces de Auditoría */}
      <div className="card-obsidian rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div>
            <h2 className="text-base font-bold text-white">
              Estado de los 5 Niveles Arquitectónicos de NEXUS (Fases 1 a 7)
            </h2>
            <p className="text-xs text-slate-400">
              Jerarquía estricta de dependencias (DAG de módulos) y estado empírico en
              PostgreSQL
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-white text-obsidian-950 font-mono font-bold text-xs">
            100% Operativo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          <Link
            href="/admin/users"
            className="p-4 rounded-xl bg-[#0B0E14] hover:bg-white/[0.04] border border-white/10 hover:border-white/30 transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-400 uppercase">
                Nivel 0 · IAM & Core
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Gobierno RBAC Multi-Rol y Auditoría
            </h3>
            <p className="text-slate-400">
              Tablas: profiles, user_roles, audit_logs con triggers JWT.
            </p>
          </Link>

          <Link
            href="/paths"
            className="p-4 rounded-xl bg-[#0B0E14] hover:bg-white/[0.04] border border-white/10 hover:border-white/30 transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-sky-300 uppercase">
                Nivel 1 · Catalog & DAG
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Malla Curricular y Prerrequisitos Acíclicos
            </h3>
            <p className="text-slate-400">
              Trigger recursivo CTE trg_enforce_dag_no_cycles activo.
            </p>
          </Link>

          <Link
            href="/commerce"
            className="p-4 rounded-xl bg-[#0B0E14] hover:bg-white/[0.04] border border-white/10 hover:border-white/30 transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-emerald-300 uppercase">
                Nivel 2 · Commerce
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Cohortes 2027-I, Cupones y Matrículas
            </h3>
            <p className="text-slate-400">
              RPC fn_check_cohort_enrollment_eligibility en tiempo real.
            </p>
          </Link>

          <Link
            href="/erp"
            className="p-4 rounded-xl bg-[#0B0E14] hover:bg-white/[0.04] border border-white/10 hover:border-white/30 transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-white uppercase">
                Nivel 3 · Academic ERP
              </span>
              <BookOpen className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </div>
            <h3 className="text-sm font-bold text-white">
              {snapshot.academicErp.scheduledSessions} Sesiones y{' '}
              {snapshot.academicErp.weightedEvaluationItems} Rubros Ponderados
            </h3>
            <p className="text-slate-400">
              Invariante SUM(w_i) = 100% y bloqueo de actas cerradas.
            </p>
          </Link>

          <Link
            href="/verify"
            className="p-4 rounded-xl bg-[#0B0E14] hover:bg-white/[0.04] border border-white/10 hover:border-white/30 transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-white uppercase">
                Nivel 4 · Gamification & Certs
              </span>
              <Award className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Ledger XP Anti-Farming y Firma SHA-256
            </h3>
            <p className="text-slate-400">
              Verificador público O(log N) en /verify/[code].
            </p>
          </Link>

          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/25 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-emerald-300 uppercase">
                Verificación Deductiva
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
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
