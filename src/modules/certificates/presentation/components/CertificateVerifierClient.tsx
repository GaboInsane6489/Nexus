'use client';

import React, { useState, useTransition } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Award,
  Flame,
  Rocket,
  Sparkles,
  Calendar,
  Hash,
  QrCode,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { BadgeEntity } from '@/modules/gamification';
import { buildGamificationSummary } from '@/modules/gamification';
import type {
  CertificateSnapshotEntity,
  CertificateVerificationPayload,
} from '../../domain/entities';
import { verifyCertificateAction } from '../actions';

const BADGE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  sparkles: Sparkles,
  flame: Flame,
  rocket: Rocket,
  calendar: Calendar,
  award: Award,
  shield: ShieldCheck,
};

interface CertificateVerifierClientProps {
  initialPayload: CertificateVerificationPayload;
  allCertificates: CertificateSnapshotEntity[];
  badges: BadgeEntity[];
}

export function CertificateVerifierClient({
  initialPayload,
  allCertificates,
  badges,
}: CertificateVerifierClientProps) {
  const [codeInput, setCodeInput] = useState(initialPayload.verificationCode);
  const [verification, setVerification] =
    useState<CertificateVerificationPayload>(initialPayload);
  const [simulatedXp, setSimulatedXp] = useState(2450);
  const [isPending, startTransition] = useTransition();

  const gamificationSummary = buildGamificationSummary(
    'usr-gabriel-001',
    simulatedXp,
    14,
    21,
    2
  );

  const handleVerifyCode = (targetCode?: string) => {
    const code = (targetCode ?? codeInput).trim().toUpperCase();
    setCodeInput(code);
    startTransition(async () => {
      const res = await verifyCertificateAction(code);
      if (res.success) {
        setVerification(res.data);
      }
    });
  };

  return (
    <div className="space-y-7">
      {/* 1. Cabecera del Verificador Criptográfico SHA-256 y Motor de Gamificación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-white mb-2">
            <ShieldCheck
              className="w-3.5 h-3.5 text-white svg-neon-glow"
              strokeWidth={1.75}
            />
            <span>
              MÓDULOS GAMIFICATION & CERTIFICATES · NIVEL 4 (FIRMA SHA-256 EN POSTGRESQL)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Verificador Público de Certificados SHA-256 y Vitrina de Insignias
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ejecuta en vivo la función RPC{' '}
            <code className="text-slate-200">fn_verify_certificate_by_code</code>{' '}
            sobre <code className="text-slate-200">public.certificates</code> y
            explora las insignias en <code className="text-slate-200">public.badges</code>.
          </p>
        </div>
      </div>

      {/* 2. Buscador y Dictamen Criptográfico en Tiempo Real */}
      <div className="grid grid-cols-1 @3xl/workspace:grid-cols-12 gap-5">
        {/* Columna Izquierda (7/12): Verificador de Certificado */}
        <div className="@3xl/workspace:col-span-7 card-obsidian rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="space-y-3">
            <label className="text-xs font-bold text-white flex items-center justify-between">
              <span>Ingresa Código Único de Certificado (`verification_code`)</span>
              <span className="text-[11px] font-mono text-slate-400">
                Índice B-Tree Covering O(log N)
              </span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  strokeWidth={1.75}
                />
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="Ej. NEX-2026-9F4K2M8X"
                  className="w-full bg-[#0B0E14] text-xs font-mono text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-white/50"
                />
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleVerifyCode()}
                className="btn-neon-silver px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer shrink-0"
              >
                {isPending ? 'Verificando en PostgreSQL...' : 'Verificar Autenticidad'}
              </button>
            </div>

            {/* Botones Rápidos de Prueba (Válidos, Revocado e Inexistente) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-400 mr-1">Probar códigos en BD:</span>
              {allCertificates.map((c) => (
                <button
                  key={c.verificationCode}
                  type="button"
                  onClick={() => handleVerifyCode(c.verificationCode)}
                  className={`px-2.5 py-1 rounded-md font-mono border transition cursor-pointer ${
                    verification.verificationCode === c.verificationCode
                      ? 'bg-white text-obsidian-950 font-bold border-white'
                      : c.isRevoked
                      ? 'bg-red-500/10 text-red-200 border-red-400/30 hover:border-red-300'
                      : 'bg-[#0B0E14] text-slate-200 border-white/10 hover:border-white/30'
                  }`}
                >
                  {c.verificationCode} {c.isRevoked ? '(Revocado)' : ''}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleVerifyCode('NEX-2026-NOEXISTE')}
                className="px-2.5 py-1 rounded-md font-mono bg-[#0B0E14] text-slate-400 border border-white/10 hover:text-white cursor-pointer"
              >
                NEX-2026-NOEXISTE
              </button>
            </div>
          </div>

          {/* Tarjeta Oficial de Resultado de Verificación */}
          {verification.status === 'VALID' && verification.certificate && (
            <div className="rounded-2xl bg-gradient-to-b from-[#131924] to-[#0B0E14] border border-white/30 p-5 space-y-4 shadow-[0_0_30px_rgba(226,232,240,0.12)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3.5">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                  <span>CERTIFICADO OFICIAL VÁLIDO Y AUTÉNTICO</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-white text-obsidian-950 font-mono text-xs font-bold">
                  {verification.certificate.verificationCode}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Graduado Titular
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {verification.certificate.studentFullName}
                  </span>
                  <span className="font-mono text-[11px] text-slate-300">
                    Documento / ID: {verification.certificate.studentDocument}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Materia / Programa Aprobado
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {verification.certificate.courseCode} —{' '}
                    {verification.certificate.courseTitle}
                  </span>
                  <span className="font-mono text-[11px] text-sky-300">
                    {verification.certificate.academicCredits} Créditos Académicos
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-black/40 border border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Nota Final Ponderada
                  </span>
                  <span className="font-mono font-bold text-white text-sm">
                    {verification.certificate.finalGrade.toFixed(2)} / 100
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Asistencia Registrada
                  </span>
                  <span className="font-mono font-bold text-emerald-300 text-sm">
                    {verification.certificate.attendancePct.toFixed(1)}%
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px]">
                    Estado Conjunción ERP
                  </span>
                  <span className="font-mono font-semibold text-white text-xs">
                    Nota + Asist. + Pago OK
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-[11px]">
                <div className="min-w-0">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Firma Criptográfica Inmutable (pgcrypto
                    SHA-256):
                  </span>
                  <p className="font-mono text-slate-200 truncate mt-0.5">
                    {verification.certificate.signatureHash}
                  </p>
                </div>
                <QrCode className="w-7 h-7 text-white shrink-0" strokeWidth={1.5} />
              </div>
            </div>
          )}

          {verification.status === 'REVOKED' && verification.certificate && (
            <div className="rounded-2xl bg-red-950/25 border border-red-400/40 p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" strokeWidth={2} />
                <span>
                  ALERTA DE AUDITORÍA: CERTIFICADO REVOCADO (
                  {verification.verificationCode})
                </span>
              </div>
              <p className="text-slate-200">
                Titular original:{' '}
                <strong>{verification.certificate.studentFullName}</strong> · Curso:{' '}
                <strong>{verification.certificate.courseCode}</strong>
              </p>
              <p className="p-3 rounded-lg bg-black/40 border border-red-400/30 text-red-200 font-mono">
                Motivo registrado en PostgreSQL:{' '}
                {verification.certificate.revokedReason}
              </p>
            </div>
          )}

          {verification.status === 'NOT_FOUND' && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/15 p-5 flex items-center gap-3 text-xs text-slate-300">
              <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">
                  CÓDIGO NO ENCONTRADO EN EL REGISTRO OFICIAL ({verification.verificationCode})
                </span>
                <span>
                  No existe ningún certificado emitido bajo este identificador en{' '}
                  <code>public.certificates</code>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha (5/12): Simulador de Curva Progresiva XP + Vitrina de Insignias */}
        <div className="@3xl/workspace:col-span-5 space-y-5">
          <div className="card-obsidian rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Curva Progresiva de Nivel (`fn_calculate_level_from_xp`)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Fórmula: XP(L) = FLOOR(100 * (L - 1)^1.5)
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-white text-obsidian-950 font-mono font-bold text-xs shadow-[0_0_14px_rgba(255,255,255,0.35)]">
                Nivel {gamificationSummary.currentLevel}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300 font-mono">
                <span>XP Acumulado: {gamificationSummary.totalXp} XP</span>
                <span>
                  Siguiente Nivel: {gamificationSummary.nextLevelRequiredXp} XP
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-slate-300 to-white transition-all duration-200"
                  style={{ width: `${gamificationSummary.levelProgressPct}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={6000}
                step={50}
                value={simulatedXp}
                onChange={(e) => setSimulatedXp(Number(e.target.value))}
                className="w-full accent-white cursor-pointer pt-2"
              />
              <span className="text-[11px] text-slate-400 block">
                Desliza el XP para comprobar cómo aumenta la exigencia en niveles
                superiores · Multiplicador Racha:{' '}
                <strong className="text-white">
                  {gamificationSummary.streakMultiplier}x
                </strong>
              </span>
            </div>
          </div>

          {/* Catálogo de Insignias Reales desde public.badges */}
          <div className="card-obsidian rounded-2xl p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Catálogo de Insignias en `public.badges` ({badges.length})</span>
              <span className="text-[11px] font-mono text-slate-400">
                Anti-Farming Ledger
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {badges.map((badge) => {
                const Icon = BADGE_ICONS[badge.iconKey] ?? Award;
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-xl border transition flex items-start gap-2.5 ${
                      badge.isUnlocked
                        ? 'bg-white/[0.05] border-white/25 text-white'
                        : 'bg-[#0B0E14] border-white/[0.07] text-slate-400 opacity-65'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-white" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs block truncate">
                        {badge.name}
                      </span>
                      <span className="text-[10px] font-mono text-sky-300 block">
                        +{badge.xpBonus} XP · {badge.isUnlocked ? 'Desbloqueada' : 'En progreso'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
