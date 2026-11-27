'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Sliders } from 'lucide-react';

export function ErpSimulatorClient() {
  const [projectScore, setProjectScore] = useState(93);
  const [attendedSessions, setAttendedSessions] = useState(19);
  const totalSessions = 20;

  // Fórmulas del Motor ERP (nexus-academic-erp-engine)
  // Parcial 1 (25%): 96 -> 24.00
  // Parcial 2 (25%): 90 -> 22.50
  // Laboratorios (20%): 95 -> 19.00
  // Proyecto Final (30%): projectScore * 0.30
  const projectContribution = Number((projectScore * 0.3).toFixed(2));
  const finalGrade = Number((24.0 + 22.5 + 19.0 + projectContribution).toFixed(2));
  const attendancePct = Number(((attendedSessions / totalSessions) * 100).toFixed(1));

  const isGradePassing = finalGrade >= 70.0;
  const isAttendancePassing = attendancePct >= 80.0;
  const isCertificateEligible = isGradePassing && isAttendancePassing;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Aula Virtual & Simulador del Libro de Calificaciones (ERP)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Prueba en tiempo real la conjunción lógica de Nexus: Nota Final ≥ 70.00 y Asistencia ≥
            80.0% para emitir el certificado SHA-256.
          </p>
        </div>

        <div
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 self-start ${
            isCertificateEligible
              ? 'bg-white text-obsidian-950 shadow-[0_0_16px_rgba(255,255,255,0.35)]'
              : 'bg-red-500/15 border border-red-400/40 text-red-200'
          }`}
        >
          {isCertificateEligible ? (
            <>
              <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
              <span>Elegible para Certificado SHA-256</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" strokeWidth={2} />
              <span>Requisitos Académicos Incompletos</span>
            </>
          )}
        </div>
      </div>

      {/* Tarjeta Principal de Ponderación de Rubros (Suma = 100%) */}
      <div className="card-obsidian rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="text-[11px] font-mono text-slate-400">
              COHORTE ING101-2027I-A · INVARIANTE SUMA DE PESOS: 100.0%
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              Arquitectura de Sistemas Escalables con Next.js & Supabase
            </h3>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] text-slate-400 block">Nota Final Ponderada</span>
              <span className="text-2xl font-bold text-white font-mono">
                {finalGrade.toFixed(2)} <span className="text-xs text-slate-400">/ 100</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Asistencia Cohorte</span>
              <span
                className={`text-2xl font-bold font-mono ${
                  isAttendancePassing ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                {attendancePct}%
              </span>
            </div>
          </div>
        </div>

        {/* Grilla de los 4 Rubros Evaluativos */}
        <div className="grid grid-cols-1 @sm/workspace:grid-cols-2 @2xl/workspace:grid-cols-4 gap-3.5 text-xs">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
            <span className="text-slate-400 block">Parcial 1 (Peso 25%)</span>
            <span className="text-lg font-bold text-white font-mono block">96.0 / 100</span>
            <span className="text-[11px] text-emerald-300 flex items-center gap-1 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aporta: 24.00 pts
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
            <span className="text-slate-400 block">Parcial 2 (Peso 25%)</span>
            <span className="text-lg font-bold text-white font-mono block">90.0 / 100</span>
            <span className="text-[11px] text-emerald-300 flex items-center gap-1 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aporta: 22.50 pts
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
            <span className="text-slate-400 block">Laboratorios (Peso 20%)</span>
            <span className="text-lg font-bold text-white font-mono block">95.0 / 100</span>
            <span className="text-[11px] text-emerald-300 flex items-center gap-1 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aporta: 19.00 pts
            </span>
          </div>

          {/* Rubro Interactivo */}
          <div className="p-4 rounded-xl bg-white/[0.08] border border-white/40 shadow-[0_0_16px_rgba(255,255,255,0.12)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Proyecto Final (30%)
              </span>
              <span className="font-mono font-bold text-white">{projectScore.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={projectScore}
              onChange={(e) => setProjectScore(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <span className="text-[11px] text-slate-200 block font-mono">
              Aporta: {projectContribution.toFixed(2)} pts
            </span>
          </div>
        </div>

        {/* Simulador de Asistencia y Alerta Temprana */}
        <div className="p-4 rounded-xl bg-[#0B0E14] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-white font-semibold block">
              Simulador de Control de Asistencia por Sesiones ({attendedSessions} de {totalSessions}{' '}
              sesiones asistidas)
            </span>
            <span className="text-slate-400 block">
              Umbral mínimo reglamentario del curso: 80.0% (16 de 20 sesiones).
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-64">
            <input
              type="range"
              min={10}
              max={20}
              value={attendedSessions}
              onChange={(e) => setAttendedSessions(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <span className="font-mono font-bold text-white w-12 text-right">
              {attendancePct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
