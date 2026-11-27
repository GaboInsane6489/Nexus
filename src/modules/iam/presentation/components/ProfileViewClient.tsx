'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Pencil,
  Share2,
  Eye,
  ShieldCheck,
  Check,
  X,
  QrCode,
  ExternalLink,
  Award,
} from 'lucide-react';
import {
  type UserProfile,
  type UserCertificateSummary,
  getInitials,
  updateProfileAction,
} from '@/modules/iam';

interface ProfileViewClientProps {
  initialProfile: UserProfile;
  certificates: UserCertificateSummary[];
}

export function ProfileViewClient({ initialProfile, certificates }: ProfileViewClientProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recruiterPreview, setRecruiterPreview] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(profile.fullName);
  const [username, setUsername] = useState(profile.username);
  const [documentId, setDocumentId] = useState(profile.documentId ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [timezone, setTimezone] = useState(profile.timezone);

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setErrorMsg('No se pudo copiar el enlace al portapapeles.');
    }
  };

  const handleToggleRecruiterPreview = () => {
    setRecruiterPreview((prev) => {
      const next = !prev;
      if (next) {
        setIsEditing(false);
      }
      return next;
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFeedbackMsg(null);

    startTransition(async () => {
      const result = await updateProfileAction({
        fullName,
        username,
        documentId,
        bio,
        timezone,
      });

      if (!result.success) {
        setErrorMsg(result.error.message);
        return;
      }

      setProfile((prev) => ({
        ...prev,
        fullName,
        username,
        documentId,
        bio,
        timezone,
      }));
      setFeedbackMsg(result.message ?? 'Perfil actualizado.');
      setIsEditing(false);
    });
  };

  return (
    <div className="space-y-6 animate-reveal">
      {/* Banner de Portada Editorial Cristal & Platino */}
      <div className="relative">
        <div className="h-36 sm:h-44 rounded-3xl bg-gradient-to-r from-white via-[#EEF2F7] to-[#E2E8F0] border border-slate-900/[0.08] overflow-hidden relative flex items-center justify-end px-6 sm:px-10 shadow-sm">
          <div className="w-24 h-10 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 rotate-[-12deg] opacity-90 shadow-[0_12px_30px_rgba(217,119,6,0.3)] mr-6 animate-float-slow" />
          <div className="w-12 h-12 rounded-2xl border-2 border-slate-900/20 rotate-12 mr-6 animate-float-reverse" />
          <div className="grid grid-cols-2 gap-1.5 rotate-6">
            <div className="w-5 h-5 rounded-md bg-[#090B0F]" />
            <div className="w-5 h-5 rounded-md bg-slate-300" />
            <div className="w-5 h-5 rounded-md bg-slate-300" />
            <div className="w-5 h-5 rounded-md bg-[#090B0F]" />
          </div>
        </div>

        <div className="px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-12 relative z-10 gap-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-1.5 shadow-[0_15px_35px_rgba(15,23,42,0.16)] border border-slate-900/10">
            <div className="w-full h-full rounded-full bg-[#090B0F] flex items-center justify-center text-xl sm:text-2xl font-black text-white">
              {getInitials(profile.fullName)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {!recruiterPreview && (
              <button
                onClick={() => setIsEditing((prev) => !prev)}
                className="flex-1 sm:flex-initial btn-glass px-4 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{isEditing ? 'Cancelar edición' : 'Editar perfil'}</span>
              </button>
            )}
            <button
              onClick={handleCopyShare}
              className="flex-1 sm:flex-initial btn-obsidian px-5 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" strokeWidth={2.2} />
              ) : (
                <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
              )}
              <span>{copied ? 'Enlace verificable copiado' : 'Compartir perfil'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Datos Principales */}
      <div className="px-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-serif text-2xl sm:text-3xl text-[#090B0F] tracking-tight">
            {profile.fullName}
          </h1>
          {recruiterPreview ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-800 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" strokeWidth={2} />
              Vista pública verificable
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900/[0.06] border border-slate-900/10 text-[11px] font-mono text-slate-700">
              DNI/ID: {profile.documentId ?? 'Sin registrar'}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Estudiante desde {new Date(profile.createdAt).getFullYear()} ·{' '}
          <span className="text-[#090B0F] font-mono font-semibold">@{profile.username}</span> · Zona horaria:{' '}
          {profile.timezone}
        </p>
        {profile.bio && (
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed pt-1">{profile.bio}</p>
        )}

        <div className="pt-1 flex items-center gap-4">
          <button
            onClick={handleToggleRecruiterPreview}
            className="text-xs text-slate-600 hover:text-[#090B0F] inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span className="underline underline-offset-4">
              {recruiterPreview
                ? 'Volver a vista de propietario'
                : 'Ver como visitante / reclutador'}
            </span>
          </button>
          {feedbackMsg && (
            <span className="text-xs text-emerald-700 font-semibold">{feedbackMsg}</span>
          )}
        </div>
      </div>

      {!recruiterPreview && isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="card-glass rounded-3xl p-5 sm:p-6 space-y-4 animate-reveal"
        >
          <div className="flex items-center justify-between border-b border-slate-900/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#090B0F]">
                Editar Expediente Personal e Identidad para Certificados
              </h3>
              <p className="text-xs text-slate-500">
                Tu nombre completo y documento se utilizan en la firma SHA-256 de tus certificados.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-[#090B0F] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold block">Nombre Completo Oficial</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-white text-[#090B0F] px-3.5 py-2.5 rounded-xl border border-slate-900/15 focus:outline-none focus:border-[#090B0F]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold block">Usuario Público (@handle)</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white text-[#090B0F] font-mono px-3.5 py-2.5 rounded-xl border border-slate-900/15 focus:outline-none focus:border-[#090B0F]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold block">
                Documento de Identidad / Matrícula
              </label>
              <input
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                required
                className="w-full bg-white text-[#090B0F] font-mono px-3.5 py-2.5 rounded-xl border border-slate-900/15 focus:outline-none focus:border-[#090B0F]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold block">Zona Horaria</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-white text-[#090B0F] px-3.5 py-2.5 rounded-xl border border-slate-900/15 focus:outline-none focus:border-[#090B0F]"
              >
                <option value="America/Caracas">America/Caracas (GMT-4)</option>
                <option value="America/Bogota">America/Bogota (GMT-5)</option>
                <option value="America/Mexico_City">America/Mexico_City (GMT-6)</option>
                <option value="Europe/Madrid">Europe/Madrid (CET)</option>
              </select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-slate-700 font-semibold block">Biografía Profesional</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-white text-[#090B0F] px-3.5 py-2 rounded-xl border border-slate-900/15 focus:outline-none focus:border-[#090B0F]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="btn-obsidian px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer"
            >
              {isPending ? 'Guardando en IAM...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      {/* Fila de 5 Indicadores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2 border-t border-slate-900/10">
        <div className="p-4 rounded-2xl card-glass">
          <span className="text-2xl font-bold text-[#090B0F] font-mono">
            {profile.verifiedCertificatesCount}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Certificados SHA-256</span>
        </div>
        <div className="p-4 rounded-2xl card-glass">
          <span className="text-2xl font-bold text-[#090B0F] font-mono">
            {profile.completedCoursesCount}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Cursos aprobados</span>
        </div>
        <div className="p-4 rounded-2xl card-glass">
          <span className="text-2xl font-bold text-[#090B0F] font-mono">{profile.weightedGpa}</span>
          <span className="text-xs text-slate-500 block mt-0.5">Promedio General (ERP)</span>
        </div>
        <div className="p-4 rounded-2xl card-glass">
          <span className="text-2xl font-bold text-[#090B0F] font-mono">{profile.streakDays}</span>
          <span className="text-xs text-slate-500 block mt-0.5">Días en racha activa</span>
        </div>
        <div className="p-4 rounded-2xl card-glass col-span-2 sm:col-span-1">
          <span className="text-2xl font-bold text-[#090B0F] font-mono">
            {profile.xpTotal.toLocaleString('en-US')}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">
            Puntos XP · Nivel {profile.currentLevel}
          </span>
        </div>
      </div>

      {/* Vitrina de Certificados */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#090B0F] flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" strokeWidth={1.75} />
            <span>Certificados Académicos Verificables (Nota + Asistencia ERP)</span>
          </h2>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Verificación pública instantánea para empresas
          </span>
        </div>

        {certificates.length === 0 ? (
          <div className="card-glass rounded-2xl p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-900/[0.06] mx-auto flex items-center justify-center text-slate-600">
              <Award className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-[#090B0F]">
              Aún no hay certificados SHA-256 emitidos
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Los certificados se generan automáticamente al aprobar nota mínima, asistencia mínima y cierre de acta en una cohorte.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="card-glass rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/[0.06] text-[#090B0F] font-semibold">
                      {cert.verificationCode}
                    </span>
                    {cert.isRevoked ? (
                      <span className="text-red-700 font-semibold flex items-center gap-1">
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                        REVOCADO
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                        VÁLIDO
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#090B0F] leading-snug">{cert.courseTitle}</h3>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{cert.signatureHash}</p>
                </div>

                <div className="pt-3 border-t border-slate-900/[0.08] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Dictamen ERP</span>
                    <span className="text-[#090B0F] font-mono font-bold">
                      {cert.finalGrade.toFixed(1)} / 100 · {cert.attendancePct.toFixed(1)}%
                    </span>
                  </div>
                  <Link
                    href={`/verify/${cert.verificationCode}`}
                    className="px-3 py-1.5 rounded-full bg-[#090B0F] hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 transition"
                  >
                    <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Verificar</span>
                    <ExternalLink className="w-3 h-3 text-slate-300" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
