'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { signInWithPasswordAction } from '@/modules/iam';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('gabrielgg2005ve@gmail.com');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await signInWithPasswordAction({ email, password });
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
            : 'Error de red al conectar con el servidor. Recarga la página (F5).'
        );
      }
    });
  };

  return (
    <div className="min-h-dvh w-full flex flex-col justify-center items-center p-4 ambient-spotlight">
      <div className="w-full max-w-md card-obsidian rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_24px_60px_rgba(0,0,0,0.9)]">
        {/* Identidad */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white via-slate-200 to-slate-400 flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.4)]">
            <Layers className="w-5 h-5 text-obsidian-950" strokeWidth={2.4} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-1">
            Ingresar a NEXUS
          </h1>
          <p className="text-xs text-slate-400 max-w-xs">
            Acceso unificado a tu Aula Virtual, Rutas de Aprendizaje DAG y Portal Académico ERP.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-400/30 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#090B0E] text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-white/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">Contraseña</label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                strokeWidth={1.75}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#090B0E] text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-white/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full btn-neon-silver py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isPending ? 'Verificando sesión IAM...' : 'Entrar a la Plataforma'}</span>
            <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>¿Nuevo estudiante?</span>
          <Link href="/register" className="text-white font-semibold hover:underline">
            Crear expediente estudiantil →
          </Link>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5 text-[11px] text-slate-300">
          <ShieldCheck className="w-4 h-4 text-white shrink-0" strokeWidth={1.75} />
          <span>
            Protegido con Supabase Auth + Custom JWT Role Claims y Row Level Security.
          </span>
        </div>
      </div>
    </div>
  );
}
