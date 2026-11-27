'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { signInWithPasswordAction } from '@/modules/iam';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
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
    <div className="min-h-dvh w-full flex flex-col justify-center items-center p-4 ambient-alabaster">
      <div className="w-full max-w-md card-glass rounded-3xl p-6 sm:p-8 space-y-6 animate-reveal">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#090B0F] flex items-center justify-center shadow-[0_10px_25px_rgba(9,11,15,0.24)]">
            <Layers className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#090B0F] tracking-tight pt-1">
            Ingresar a NEXUS
          </h1>
          <p className="text-xs text-slate-500 max-w-xs">
            Acceso unificado a tu Aula Virtual, Rutas de Aprendizaje DAG y Portal Académico ERP.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-700 font-semibold block">Correo Electrónico</label>
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
                className="w-full bg-white text-[#090B0F] pl-10 pr-4 py-2.5 rounded-xl border border-slate-900/15 focus:outline-none focus:border-[#090B0F]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 font-semibold block">Contraseña</label>
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
                className="w-full bg-white text-[#090B0F] pl-10 pr-4 py-2.5 rounded-xl border border-slate-900/15 focus:outline-none focus:border-[#090B0F]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full btn-obsidian py-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isPending ? 'Verificando sesión IAM...' : 'Entrar a la Plataforma'}</span>
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>¿Nuevo estudiante?</span>
          <Link href="/register" className="text-[#090B0F] font-bold hover:underline">
            Crear expediente estudiantil →
          </Link>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/[0.04] border border-slate-900/[0.08] flex items-center gap-2.5 text-[11px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-[#090B0F] shrink-0" strokeWidth={1.75} />
          <span>
            Protegido con Supabase Auth + Custom JWT Role Claims y Row Level Security.
          </span>
        </div>
      </div>
    </div>
  );
}
