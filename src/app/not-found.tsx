import React from 'react';
import Link from 'next/link';
import { Layers, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center p-6 ambient-alabaster text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-[#090B0F] flex items-center justify-center shadow-[0_10px_25px_rgba(9,11,15,0.24)]">
        <Layers className="w-5 h-5 text-white" strokeWidth={2.2} />
      </div>
      <h1 className="font-serif text-3xl text-[#090B0F] tracking-tight">
        Ruta Académica No Encontrada (404)
      </h1>
      <p className="text-xs text-slate-500 max-w-md">
        El recurso o expediente solicitado no existe o requiere permisos de rol adicionales.
      </p>
      <Link
        href="/"
        className="btn-obsidian px-6 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        <span>Volver al Inicio de NEXUS</span>
      </Link>
    </div>
  );
}
