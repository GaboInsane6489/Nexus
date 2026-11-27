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
  getInitials,
  updateProfileAction,
} from '@/modules/iam';

interface ProfileViewClientProps {
  initialProfile: UserProfile;
}

export function ProfileViewClient({ initialProfile }: ProfileViewClientProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recruiterPreview, setRecruiterPreview] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(profile.fullName);
  const [username, setUsername] = useState(profile.username);
  const [documentId, setDocumentId] = useState(profile.documentId ?? 'V-29845102');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [timezone, setTimezone] = useState(profile.timezone);

  const handleCopyShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
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

  const certificates = [
    {
      code: 'NEX-2026-9F4K2M8X',
      title: 'Arquitectura de Sistemas Escalables con Next.js & Supabase',
      grade: '96.0 / 100',
      attendance: '98.0%',
      credits: '4 Créditos',
      hash: 'sha256:8f9d2a4c7e1b...39a0',
    },
    {
      code: 'NEX-2026-3L7P1Q5Z',
      title: 'Diseño de Bases de Datos Relacionales y Seguridad RLS',
      grade: '94.5 / 100',
      attendance: '95.0%',
      credits: '4 Créditos',
      hash: 'sha256:4c2e9b1a0d8f...71e4',
    },
    {
      code: 'NEX-2026-6W2N8R4V',
      title: 'Ingeniería de Software con TypeScript Estricto y DDD',
      grade: '91.0 / 100',
      attendance: '96.0%',
      credits: '3 Créditos',
      hash: 'sha256:1a7f5e3c9b2d...84c2',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner de Portada con Geometría Abstracta Cromo & Obsidiana */}
      <div className="relative">
        <div className="h-36 sm:h-44 rounded-2xl bg-[#0D1017] border border-white/10 overflow-hidden relative flex items-center justify-end px-6 sm:px-10">
          <div className="w-24 h-10 rounded-xl bg-gradient-to-r from-slate-200 to-white rotate-[-12deg] opacity-90 shadow-[0_0_30px_rgba(255,255,255,0.35)] mr-6" />
          <div className="w-12 h-12 rounded-xl border-2 border-sky-200/60 rotate-12 mr-6" />
          <div className="grid grid-cols-2 gap-1.5 rotate-6">
            <div className="w-5 h-5 rounded bg-white/80" />
            <div className="w-5 h-5 rounded bg-white/30" />
            <div className="w-5 h-5 rounded bg-white/30" />
            <div className="w-5 h-5 rounded bg-white/90 shadow-[0_0_12px_#fff]" />
          </div>
        </div>

        <div className="px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-12 relative z-10 gap-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-200 p-1 shadow-[0_0_25px_rgba(255,255,255,0.3)]">
            <div className="w-full h-full rounded-full bg-[#080A0F] flex items-center justify-center text-xl sm:text-2xl font-black text-white">
              {getInitials(profile.fullName)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-[#11151E] hover:bg-[#191F2C] border border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-2 transition"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{isEditing ? 'Cancelar edición' : 'Editar perfil'}</span>
            </button>
            <button
              onClick={handleCopyShare}
              className="flex-1 sm:flex-initial btn-neon-silver px-5 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
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

      {/* Datos Principales del Estudiante */}
      <div className="px-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
            {profile.fullName}
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-mono text-slate-200">
            DNI/ID: {profile.documentId ?? 'Sin registrar'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Estudiante desde 2026 ·{' '}
          <span className="text-slate-200 font-mono">@{profile.username}</span> · Zona horaria:{' '}
          {profile.timezone}
        </p>
        {profile.bio && (
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed pt-1">{profile.bio}</p>
        )}

        <div className="pt-1 flex items-center gap-4">
          <button
            onClick={() => setRecruiterPreview((prev) => !prev)}
            className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1.5 transition"
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span className="underline underline-offset-4">
              {recruiterPreview
                ? 'Volver a vista de propietario'
                : 'Ver como visitante / reclutador'}
            </span>
          </button>
          {feedbackMsg && (
            <span className="text-xs text-emerald-300 font-medium">{feedbackMsg}</span>
          )}
        </div>
      </div>

      {/* Formulario Interactivo de Edición de Perfil (Zod + Server Action) */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="card-obsidian rounded-2xl p-5 sm:p-6 space-y-4 border border-white/20"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Editar Expediente Personal e Identidad para Certificados
              </h3>
              <p className="text-xs text-slate-400">
                Tu nombre completo y documento se utilizan en la firma SHA-256 de tus certificados.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-400/30 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium block">Nombre Completo Oficial</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-[#0B0E14] text-white px-3.5 py-2.5 rounded-lg border border-white/15 focus:outline-none focus:border-white/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium block">Usuario Público (@handle)</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#0B0E14] text-white font-mono px-3.5 py-2.5 rounded-lg border border-white/15 focus:outline-none focus:border-white/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium block">
                Documento de Identidad / Matrícula Universitaria
              </label>
              <input
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                required
                className="w-full bg-[#0B0E14] text-white font-mono px-3.5 py-2.5 rounded-lg border border-white/15 focus:outline-none focus:border-white/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium block">Zona Horaria (Control de Rachas)</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-[#0B0E14] text-white px-3.5 py-2.5 rounded-lg border border-white/15 focus:outline-none focus:border-white/50"
              >
                <option value="America/Caracas">America/Caracas (GMT-4)</option>
                <option value="America/Bogota">America/Bogota (GMT-5)</option>
                <option value="America/Mexico_City">America/Mexico_City (GMT-6)</option>
                <option value="America/Argentina/Buenos_Aires">America/Buenos_Aires (GMT-3)</option>
                <option value="Europe/Madrid">Europe/Madrid (CET)</option>
              </select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-slate-300 font-medium block">Biografía Profesional</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#0B0E14] text-white px-3.5 py-2 rounded-lg border border-white/15 focus:outline-none focus:border-white/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="btn-neon-silver px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              {isPending ? 'Guardando en IAM...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      {/* Fila de 5 Indicadores de Impacto (Responsive Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2 border-t border-white/10">
        <div className="p-4 rounded-xl card-obsidian">
          <span className="text-2xl font-bold text-white font-mono">
            {profile.verifiedCertificatesCount}
          </span>
          <span className="text-xs text-slate-400 block mt-0.5">Certificados SHA-256</span>
        </div>
        <div className="p-4 rounded-xl card-obsidian">
          <span className="text-2xl font-bold text-white font-mono">
            {profile.completedCoursesCount}
          </span>
          <span className="text-xs text-slate-400 block mt-0.5">Cursos aprobados</span>
        </div>
        <div className="p-4 rounded-xl card-obsidian">
          <span className="text-2xl font-bold text-white font-mono">{profile.weightedGpa}</span>
          <span className="text-xs text-slate-400 block mt-0.5">Promedio General (ERP)</span>
        </div>
        <div className="p-4 rounded-xl card-obsidian">
          <span className="text-2xl font-bold text-white font-mono">{profile.streakDays}</span>
          <span className="text-xs text-slate-400 block mt-0.5">Días en racha activa</span>
        </div>
        <div className="p-4 rounded-xl card-obsidian col-span-2 sm:col-span-1">
          <span className="text-2xl font-bold text-white font-mono">
            {profile.xpTotal.toLocaleString('en-US')}
          </span>
          <span className="text-xs text-slate-400 block mt-0.5">
            Puntos XP · Nivel {profile.currentLevel}
          </span>
        </div>
      </div>

      {/* Vitrina de Certificados Verificables por Código / Hash */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-white svg-neon-glow" strokeWidth={1.75} />
            <span>Certificados Académicos Verificables (Nota + Asistencia ERP)</span>
          </h2>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Verificación pública instantánea para empresas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {certificates.map((cert) => (
            <div key={cert.code} className="card-obsidian rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
                    {cert.code}
                  </span>
                  <span className="text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                    VÁLIDO
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{cert.title}</h3>
                <p className="text-[11px] text-slate-400 font-mono truncate">{cert.hash}</p>
              </div>

              <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Dictamen ERP</span>
                  <span className="text-white font-mono font-semibold">
                    {cert.grade} · {cert.attendance}
                  </span>
                </div>
                <Link
                  href={`/verify/${cert.code}`}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white flex items-center gap-1.5 transition"
                >
                  <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Verificar</span>
                  <ExternalLink className="w-3 h-3 text-slate-300" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
