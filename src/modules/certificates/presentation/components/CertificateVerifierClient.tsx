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
  Printer,
  Copy,
  Check,
  Link2,
} from 'lucide-react';
import type { AppRole } from '@/modules/iam';
import type {
  BadgeEntity,
  UserGamificationSummary,
} from '@/modules/gamification';
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
  initialPayload: CertificateVerificationPayload | null;
  allCertificates: CertificateSnapshotEntity[];
  badges: BadgeEntity[];
  userRole?: AppRole | null;
  initialGamification?: UserGamificationSummary | null;
}

export function CertificateVerifierClient({
  initialPayload,
  allCertificates,
  badges,
  userRole = null,
  initialGamification = null,
}: CertificateVerifierClientProps) {
  const [codeInput, setCodeInput] = useState(
    initialPayload?.verificationCode ?? ''
  );
  const [verification, setVerification] =
    useState<CertificateVerificationPayload | null>(initialPayload);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopyPublicLink = async (verificationCode: string) => {
    const relativePath = `/verify/${verificationCode}`;
    const fullUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${relativePath}`
        : relativePath;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedCode(verificationCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setCopiedCode(null);
    }
  };

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
    <div className="space-y-7 animate-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-900/10 text-[11px] font-semibold text-[#090B0F] mb-2 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
            <span>MÓDULOS GAMIFICATION & CERTIFICATES · NIVEL 4 (FIRMA SHA-256)</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#090B0F] tracking-tight">
            Verificador Público de Certificados SHA-256 e Insignias
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ejecuta en vivo la función RPC{' '}
            <code className="text-[#090B0F] font-semibold">fn_verify_certificate_by_code</code>{' '}
            sobre <code className="text-[#090B0F]">public.certificates</code> y
            explora las insignias en <code className="text-[#090B0F]">public.badges</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 @3xl/workspace:grid-cols-12 gap-5">
        <div className="@3xl/workspace:col-span-7 card-glass rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#090B0F] flex items-center justify-between">
              <span>Ingresa Código Único de Certificado (verification_code)</span>
              <span className="text-[11px] font-mono text-slate-500">
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
                  className="w-full bg-white text-xs font-mono text-[#090B0F] pl-10 pr-4 py-2.5 rounded-full border border-slate-900/15 focus:outline-none focus:border-[#090B0F]"
                />
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleVerifyCode()}
                className="btn-obsidian px-6 py-2.5 rounded-full text-xs font-bold cursor-pointer shrink-0"
              >
                {isPending ? 'Verificando...' : 'Verificar Autenticidad'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-500 mr-1">Probar códigos en BD:</span>
              {allCertificates.map((c) => (
                <button
                  key={c.verificationCode}
                  type="button"
                  onClick={() => handleVerifyCode(c.verificationCode)}
                  className={`px-2.5 py-1 rounded-full font-mono border transition cursor-pointer ${
                    verification?.verificationCode === c.verificationCode
                      ? 'bg-[#090B0F] text-white font-bold border-[#090B0F]'
                      : c.isRevoked
                      ? 'bg-red-500/10 text-red-700 border-red-500/30 hover:border-red-500'
                      : 'bg-white text-slate-700 border-slate-900/10 hover:border-slate-900/30'
                  }`}
                >
                  {c.verificationCode} {c.isRevoked ? '(Revocado)' : ''}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleVerifyCode('NEX-2026-NOEXISTE')}
                className="px-2.5 py-1 rounded-full font-mono bg-white text-slate-500 border border-slate-900/10 hover:text-[#090B0F] cursor-pointer"
              >
                NEX-2026-NOEXISTE
              </button>
            </div>
          </div>

          {!verification && (
            <div className="rounded-2xl bg-white/75 border border-slate-900/10 p-5 flex items-center gap-3 text-xs text-slate-600">
              <QrCode className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.75} />
              <div>
                <span className="font-bold text-[#090B0F] block">
                  VERIFICACIÓN DE CERTIFICADO OFICIAL
                </span>
                <span>
                  Ingresa un código único con formato{' '}
                  <code className="font-mono text-[#090B0F] font-semibold">
                    NEX-YYYY-XXXXXXXX
                  </code>{' '}
                  para consultar su autenticidad y firma SHA-256.
                </span>
              </div>
            </div>
          )}

          {verification?.status === 'VALID' && verification.certificate && (
            <div className="rounded-2xl bg-white border border-slate-900/15 p-5 space-y-4 shadow-[0_18px_40px_-12px_rgba(15,23,42,0.12)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900/10 pb-3.5">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                  <span>CERTIFICADO OFICIAL VÁLIDO Y AUTÉNTICO</span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#090B0F] text-white font-mono text-xs font-bold">
                  {verification.certificate.verificationCode}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Graduado Titular
                  </span>
                  <span className="text-sm font-bold text-[#090B0F] block mt-0.5">
                    {verification.certificate.studentFullName}
                  </span>
                  <span className="font-mono text-[11px] text-slate-600">
                    Documento / ID: {verification.certificate.studentDocument}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Materia / Programa Aprobado
                  </span>
                  <span className="text-sm font-bold text-[#090B0F] block mt-0.5">
                    {verification.certificate.courseCode} —{' '}
                    {verification.certificate.courseTitle}
                  </span>
                  <span className="font-mono text-[11px] text-amber-700 font-semibold">
                    {verification.certificate.academicCredits} Créditos Académicos
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-900/[0.08] text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Nota Final Ponderada
                  </span>
                  <span className="font-mono font-bold text-[#090B0F] text-sm">
                    {verification.certificate.finalGrade.toFixed(2)} / 100
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Asistencia Registrada
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {verification.certificate.attendancePct.toFixed(1)}%
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block text-[10px]">
                    Estado Conjunción ERP
                  </span>
                  <span className="font-mono font-semibold text-[#090B0F] text-xs">
                    Nota + Asist. + Pago OK
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/[0.03] border border-slate-900/[0.08] flex items-center justify-between gap-3 text-[11px]">
                <div className="min-w-0">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Firma Criptográfica Inmutable (pgcrypto
                    SHA-256):
                  </span>
                  <p className="font-mono text-[#090B0F] truncate mt-0.5 font-medium">
                    {verification.certificate.signatureHash}
                  </p>
                </div>
                <QrCode className="w-7 h-7 text-[#090B0F] shrink-0" strokeWidth={1.5} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 print:hidden">
                <div className="flex items-center gap-2 min-w-0 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-900/10 text-[11px] font-mono text-slate-700">
                  <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">
                    /verify/{verification.verificationCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPublicLink(verification.verificationCode)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-900/10 text-[#090B0F] font-semibold hover:border-slate-900/30 transition cursor-pointer shrink-0"
                  >
                    {copiedCode === verification.verificationCode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-700" strokeWidth={2} />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" strokeWidth={1.75} />
                        <span>Copiar enlace</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-obsidian inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold cursor-pointer shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Imprimir / Guardar PDF</span>
                </button>
              </div>
            </div>
          )}

          {verification?.status === 'REVOKED' && verification.certificate && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/35 p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" strokeWidth={2} />
                <span>
                  ALERTA DE AUDITORÍA: CERTIFICADO REVOCADO (
                  {verification.verificationCode})
                </span>
              </div>
              <p className="text-slate-700">
                Titular original:{' '}
                <strong>{verification.certificate.studentFullName}</strong> · Curso:{' '}
                <strong>{verification.certificate.courseCode}</strong>
              </p>
              <p className="p-3 rounded-xl bg-white border border-red-500/25 text-red-800 font-mono">
                Motivo registrado en PostgreSQL:{' '}
                {verification.certificate.revokedReason}
              </p>
            </div>
          )}

          {verification?.status === 'NOT_FOUND' && (
            <div className="rounded-2xl bg-white/75 border border-slate-900/10 p-5 flex items-center gap-3 text-xs text-slate-600">
              <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <span className="font-bold text-[#090B0F] block">
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

        <div className="@3xl/workspace:col-span-5 space-y-5">
          <div className="card-glass rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#090B0F]">
                  Curva Progresiva de Nivel (fn_calculate_level_from_xp)
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Fórmula: XP(L) = FLOOR(100 * (L - 1)^1.5)
                </p>
              </div>
              {initialGamification ? (
                <span className="px-3 py-1 rounded-full bg-[#090B0F] text-white font-mono font-bold text-xs whitespace-nowrap shrink-0">
                  Nivel {initialGamification.currentLevel}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-600 font-mono font-semibold text-xs whitespace-nowrap shrink-0">
                  Invitado
                </span>
              )}
            </div>

            {initialGamification ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-700 font-mono">
                  <span>XP Acumulado: {initialGamification.totalXp} XP</span>
                  <span>
                    Siguiente Nivel: {initialGamification.nextLevelRequiredXp} XP
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-[#090B0F] transition-all duration-200"
                    style={{ width: `${initialGamification.levelProgressPct}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                  <span>
                    Racha actual:{' '}
                    <strong className="text-[#090B0F]">
                      {initialGamification.currentStreakDays} días
                    </strong>
                  </span>
                  <span>
                    Multiplicador Racha:{' '}
                    <strong className="text-[#090B0F]">
                      {initialGamification.streakMultiplier}x
                    </strong>
                  </span>
                  {userRole && (
                    <span className="font-mono uppercase text-[10px] text-slate-500">
                      Rol: {userRole}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/75 border border-slate-900/10 p-4 text-xs text-slate-600">
                Inicia sesión para ver tu progreso XP real
              </div>
            )}
          </div>

          <div className="card-glass rounded-3xl p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-[#090B0F] flex items-center justify-between">
              <span>Catálogo de Insignias ({badges.length})</span>
              <span className="text-[11px] font-mono text-slate-500">
                Anti-Farming Ledger
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {badges.map((badge) => {
                const Icon = BADGE_ICONS[badge.iconKey] ?? Award;
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-2xl border transition flex items-start gap-2.5 ${
                      badge.isUnlocked
                        ? 'bg-white border-slate-900/15 text-[#090B0F] shadow-xs'
                        : 'bg-slate-50 border-slate-900/[0.06] text-slate-400 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        badge.isUnlocked
                          ? 'bg-[#090B0F] text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs block truncate">
                        {badge.name}
                      </span>
                      <span className="text-[10px] font-mono text-amber-700 font-semibold block">
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
