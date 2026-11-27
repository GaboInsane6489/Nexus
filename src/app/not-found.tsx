import React from 'react';
import Link from 'next/link';
import { Layers, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center p-6 bg-obsidian-950 text-center space-y-4">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white via-slate-200 to-slate-400 flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.4)]">
        <Layers className="w-5 h-5 text-obsidian-950" strokeWidth={2.4} />
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight">
        Ruta Académica No Encontrada (404)
      </h1>
      <p className="text-xs text-slate-400 max-w-md">
        El recurso o expediente solicitado no existe o requiere permisos de rol adicionales.
      </p>
      <Link
        href="/"
        className="btn-neon-silver px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        <span>Volver al Inicio de NEXUS</span>
      </Link>
    </div>
  );
}
