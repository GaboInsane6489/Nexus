'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, User, Mail, FileBadge, Globe, Lock, ArrowRight } from 'lucide-react';
import { registerStudentAccountAction } from '@/modules/iam';

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [timezone, setTimezone] = useState('America/Caracas');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await registerStudentAccountAction({
          fullName,
          email,
          documentId,
          timezone,
          password,
        });
        if (!res.success) {
          setErrorMsg(res.error.message);
          return;
        }
        router.refresh();
        router.push(res.data.redirectTo);
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Error de red al registrar expediente. Recarga la página (F5).'
        );
      }
    });
  };

  return (
    <div className="min-h-dvh w-full flex flex-col justify-center items-center p-4 ambient-spotlight">
      <div className="w-full max-w-lg card-obsidian rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_24px_60px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white via-slate-200 to-slate-400 flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.4)]">
            <Layers className="w-5 h-5 text-obsidian-950" strokeWidth={2.4} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-1">
            Apertura de Expediente Estudiantil
          </h1>
          <p className="text-xs text-slate-400 max-w-sm">
            Tus datos oficiales se vinculan al libro de calificaciones ERP y a la emisión de
            certificados SHA-256.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-400/30 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">Nombre Completo Oficial</label>
            <div className="relative">
              <User
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                strokeWidth={1.75}
              />
              <input
                type="text"
                required
                placeholder="Ej. Gabriel Alexander Gonzalez Garcia"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#090B0E] text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-white/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium block">Correo Electrónico</label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  strokeWidth={1.75}
                />
                <input
                  type="email"
                  required
                  placeholder="alumno@nexus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#090B0E] text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-white/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium block">Documento DNI / Cédula</label>
              <div className="relative">
                <FileBadge
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  strokeWidth={1.75}
                />
                <input
                  type="text"
                  required
                  placeholder="V-29845102"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  className="w-full bg-[#090B0E] text-white font-mono pl-10 pr-4 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-white/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium block">Zona Horaria</label>
              <div className="relative">
                <Globe
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  strokeWidth={1.75}
                />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#090B0E] text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-white/50"
                >
                  <option value="America/Caracas">America/Caracas (GMT-4)</option>
                  <option value="America/Bogota">America/Bogota (GMT-5)</option>
                  <option value="America/Mexico_City">America/Mexico_City (GMT-6)</option>
                  <option value="Europe/Madrid">Europe/Madrid (CET)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium block">Contraseña (Mín. 8 caract.)</label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  strokeWidth={1.75}
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#090B0E] text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-white/50"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full btn-neon-silver py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isPending ? 'Registrando en IAM...' : 'Crear Expediente y Entrar'}</span>
            <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>¿Ya tienes cuenta activa?</span>
          <Link href="/login" className="text-white font-semibold hover:underline">
            Iniciar sesión →
          </Link>
        </div>
      </div>
    </div>
  );
}
