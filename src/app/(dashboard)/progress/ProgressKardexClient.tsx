'use client';

import React, { useState } from 'react';
import { Check, ChevronUp, Info, TrendingUp } from 'lucide-react';
import { type UserProfile, getInitials } from '@/modules/iam';

interface DayActivity {
  label: string;
  shortLabel: string;
  classesCompleted: number;
  xpEarned: number;
  heightClass: string;
  isToday?: boolean;
}

const WEEKLY_DATA: DayActivity[] = [
  { label: '16 de noviembre', shortLabel: '16 nov', classesCompleted: 2, xpEarned: 110, heightClass: 'h-16' },
  { label: '17 de noviembre', shortLabel: '17 nov', classesCompleted: 3, xpEarned: 165, heightClass: 'h-24' },
  { label: '18 de noviembre', shortLabel: '18 nov', classesCompleted: 2, xpEarned: 95, heightClass: 'h-14' },
  { label: '19 de noviembre', shortLabel: '19 nov', classesCompleted: 4, xpEarned: 210, heightClass: 'h-32' },
  { label: '20 de noviembre', shortLabel: '20 nov', classesCompleted: 3, xpEarned: 180, heightClass: 'h-24' },
  {
    label: 'Hoy (21 de noviembre)',
    shortLabel: 'Hoy',
    classesCompleted: 4,
    xpEarned: 240,
    heightClass: 'h-36',
    isToday: true,
  },
  { label: '22 de noviembre', shortLabel: '22 nov', classesCompleted: 0, xpEarned: 0, heightClass: 'h-3' },
];

export function ProgressKardexClient({ user }: { user: UserProfile }) {
  const [selectedDay, setSelectedDay] = useState<DayActivity>(WEEKLY_DATA[5]);

  const leaderboard = [
    { rank: 1, initials: 'JA', name: 'Josue Antonio Morales', pts: 4515, isUser: false },
    { rank: 2, initials: 'EM', name: 'Eli Morris', pts: 3842, isUser: false },
    { rank: 3, initials: 'AL', name: 'Andrea Londoño', pts: 3738, isUser: false },
    {
      rank: 4,
      initials: getInitials(user.fullName),
      name: user.fullName,
      pts: user.xpTotal,
      isUser: true,
    },
    { rank: 5, initials: 'DC', name: 'Delmiro Castellanos', pts: 2180, isUser: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Mi Progreso y Récord Académico (Kardex)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Selecciona cualquier barra de la semana para inspeccionar tus lecciones completadas y
            puntos XP ganados.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold self-start">
          <Check className="w-3.5 h-3.5" strokeWidth={2.2} />
          <span>Estado Académico: Óptimo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 @3xl/workspace:grid-cols-12 gap-5">
        {/* Columna Izquierda (8/12): Gráfica Semanal Interactiva + Kardex */}
        <div className="@3xl/workspace:col-span-8 card-obsidian rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white svg-neon-glow" strokeWidth={1.75} />
                <span>Actividad Semanal</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {selectedDay.label}:{' '}
                <strong className="text-white">{selectedDay.classesCompleted} clases</strong> ·{' '}
                <strong className="text-white">+{selectedDay.xpEarned} XP</strong>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <div>
                <span className="text-[11px] text-slate-400 block">Clases vistas</span>
                <span className="text-xl font-bold text-white font-mono">18</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Promedio ERP</span>
                <span className="text-xl font-bold text-white font-mono">{user.weightedGpa}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Asistencia</span>
                <span className="text-xl font-bold text-emerald-300 font-mono">
                  {user.attendancePct}%
                </span>
              </div>
            </div>
          </div>

          {/* Barras Interactivas */}
          <div className="h-44 pt-4 flex items-end justify-between gap-2 sm:gap-4 border-b border-dashed border-white/15 pb-3 px-1">
            {WEEKLY_DATA.map((day) => {
              const isSelected = selectedDay.shortLabel === day.shortLabel;
              return (
                <button
                  key={day.shortLabel}
                  onClick={() => setSelectedDay(day)}
                  className="group flex-1 flex flex-col items-center gap-2 focus:outline-none cursor-pointer"
                >
                  <div
                    className={`w-full max-w-[42px] ${day.heightClass} rounded-t-md transition-all ${
                      day.isToday || isSelected
                        ? 'bg-gradient-to-t from-slate-400/40 via-slate-200 to-white shadow-[0_0_20px_rgba(255,255,255,0.45)]'
                        : 'bg-white/20 group-hover:bg-white/40 border-t border-white/50'
                    }`}
                  />
                  <span
                    className={`text-[11px] ${
                      day.isToday || isSelected
                        ? 'text-white font-bold'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  >
                    {day.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-white/25 inline-block" /> Días anteriores
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-white shadow-[0_0_8px_#fff] inline-block" />{' '}
                Hoy (+240 XP)
              </span>
            </div>
            <span className="text-slate-300">
              Multiplicador por racha de {user.streakDays} días:{' '}
              <strong className="text-white">1.2x XP</strong>
            </span>
          </div>
        </div>

        {/* Columna Derecha (4/12): Tu posición semanal (Leaderboard) */}
        <div className="@3xl/workspace:col-span-4 card-obsidian rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Tu posición semanal</h3>
              <Info className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Cohorte 2027-I · Del 16 al 22 de noviembre</p>

            <div className="mt-4 space-y-2.5 text-xs">
              {leaderboard.map((row) => (
                <div
                  key={row.rank}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                    row.isUser
                      ? 'bg-gradient-to-r from-white/15 to-white/5 border border-white/40 shadow-[0_0_16px_rgba(255,255,255,0.16)]'
                      : 'bg-white/[0.02] border border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ChevronUp
                      className={`w-3.5 h-3.5 shrink-0 ${
                        row.isUser ? 'text-white' : 'text-emerald-400'
                      }`}
                      strokeWidth={2.5}
                    />
                    <span className="font-mono font-bold text-slate-300 w-3">{row.rank}</span>
                    <div
                      className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${
                        row.isUser ? 'bg-white text-obsidian-950' : 'bg-slate-800 text-white'
                      }`}
                    >
                      {row.initials}
                    </div>
                    <span
                      className={`truncate ${
                        row.isUser ? 'text-white font-bold' : 'text-slate-200 font-medium'
                      }`}
                    >
                      {row.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white shrink-0">
                    {row.pts.toLocaleString('en-US')} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
