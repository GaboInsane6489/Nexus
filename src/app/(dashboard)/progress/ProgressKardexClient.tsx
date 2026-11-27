'use client';

import React, { useState } from 'react';
import { Award, Check, ChevronUp, Info, TrendingUp } from 'lucide-react';
import { type UserProfile } from '@/modules/iam';

export interface DayActivity {
  dateKey: string;
  label: string;
  shortLabel: string;
  eventsCount: number;
  xpEarned: number;
  isToday: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  initials: string;
  name: string;
  pts: number;
  level: number;
  isUser: boolean;
}

export interface EnrollmentsSummary {
  total: number;
  active: number;
  completed: number;
  averageGrade: number;
  averageAttendance: number;
}

interface ProgressKardexClientProps {
  user: UserProfile;
  weeklyActivity: DayActivity[];
  leaderboard: LeaderboardEntry[];
  enrollmentsCount: EnrollmentsSummary;
}

export function ProgressKardexClient({
  user,
  weeklyActivity,
  leaderboard,
  enrollmentsCount,
}: ProgressKardexClientProps) {
  const defaultDay =
    weeklyActivity.find((day) => day.isToday) ??
    weeklyActivity[weeklyActivity.length - 1] ?? {
      dateKey: '',
      label: 'Hoy',
      shortLabel: 'Hoy',
      eventsCount: 0,
      xpEarned: 0,
      isToday: true,
    };

  const [selectedDateKey, setSelectedDateKey] = useState<string>(defaultDay.dateKey);

  const selectedDay =
    weeklyActivity.find((day) => day.dateKey === selectedDateKey) ?? defaultDay;

  const todayActivity = weeklyActivity.find((day) => day.isToday) ?? defaultDay;
  const maxXp = Math.max(...weeklyActivity.map((day) => day.xpEarned), 1);
  const hasWeeklyXp = weeklyActivity.some((day) => day.xpEarned > 0);
  const streakMultiplier = (1 + Math.min(user.streakDays, 10) * 0.05).toFixed(2);

  const firstDayLabel = weeklyActivity[0]?.shortLabel ?? '';
  const lastDayLabel = weeklyActivity[weeklyActivity.length - 1]?.shortLabel ?? '';
  const periodRangeLabel =
    firstDayLabel && lastDayLabel
      ? `Ranking Global XP · ${firstDayLabel} — ${lastDayLabel}`
      : 'Ranking Global XP';

  const academicStatusLabel =
    enrollmentsCount.total === 0
      ? 'Sin matrículas registradas'
      : enrollmentsCount.averageAttendance >= 80 && enrollmentsCount.averageGrade >= 70
        ? 'Estado Académico: Óptimo'
        : 'Estado Académico: En seguimiento';

  return (
    <div className="space-y-6 animate-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#090B0F] tracking-tight">
            Mi Progreso y Récord Académico (Kardex)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecciona cualquier barra de la semana para inspeccionar tus actividades registradas y
            puntos XP ganados.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-600/25 text-emerald-800 text-xs font-semibold self-start">
          <Check className="w-3.5 h-3.5" strokeWidth={2.2} />
          <span>{academicStatusLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 @3xl/workspace:grid-cols-12 gap-5">
        <div className="@3xl/workspace:col-span-8 card-glass rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900/[0.08] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#090B0F] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
                <span>Actividad Semanal</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {selectedDay.label}:{' '}
                <strong className="text-[#090B0F]">
                  {selectedDay.eventsCount}{' '}
                  {selectedDay.eventsCount === 1 ? 'actividad' : 'actividades'}
                </strong>{' '}
                · <strong className="text-[#090B0F]">+{selectedDay.xpEarned} XP</strong>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <div>
                <span className="text-[11px] text-slate-500 block">Cursos activos</span>
                <span className="text-xl font-bold text-[#090B0F] font-mono">
                  {enrollmentsCount.active}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {enrollmentsCount.completed} completados
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Promedio ERP</span>
                <span className="text-xl font-bold text-[#090B0F] font-mono">
                  {enrollmentsCount.averageGrade}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Asistencia</span>
                <span className="text-xl font-bold text-emerald-700 font-mono">
                  {enrollmentsCount.averageAttendance}%
                </span>
              </div>
            </div>
          </div>

          {hasWeeklyXp ? (
            <div className="h-44 pt-4 flex items-end justify-between gap-2 sm:gap-4 border-b border-dashed border-slate-900/15 pb-3 px-1">
              {weeklyActivity.map((day) => {
                const isSelected = selectedDay.dateKey === day.dateKey;
                const barHeightPx =
                  day.xpEarned > 0 ? Math.max(18, Math.round((day.xpEarned / maxXp) * 128)) : 10;

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(day.dateKey)}
                    className="group flex-1 flex flex-col items-center gap-2 focus:outline-none cursor-pointer"
                  >
                    <div
                      style={{ height: `${barHeightPx}px` }}
                      className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 ${
                        day.isToday || isSelected
                          ? 'bg-gradient-to-t from-slate-700 to-[#090B0F] shadow-[0_10px_20px_rgba(9,11,15,0.22)]'
                          : 'bg-slate-200 group-hover:bg-slate-300'
                      }`}
                    />
                    <span
                      className={`text-[11px] ${
                        day.isToday || isSelected
                          ? 'text-[#090B0F] font-bold'
                          : 'text-slate-500 group-hover:text-[#090B0F]'
                      }`}
                    >
                      {day.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center border border-dashed border-slate-900/15 rounded-2xl px-4 bg-white/40">
              <TrendingUp className="w-6 h-6 text-slate-400 mb-2" strokeWidth={1.6} />
              <p className="text-sm font-semibold text-[#090B0F]">
                Sin actividad XP en los últimos 7 días
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Completa lecciones, entregas o sesiones para registrar puntos XP en tu historial
                semanal.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 inline-block" /> Días anteriores
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#090B0F] inline-block" /> Hoy (+
                {todayActivity.xpEarned} XP)
              </span>
            </div>
            <span className="text-slate-600">
              Multiplicador por racha de {user.streakDays}{' '}
              {user.streakDays === 1 ? 'día' : 'días'}:{' '}
              <strong className="text-[#090B0F]">{streakMultiplier}x XP</strong>
            </span>
          </div>
        </div>

        <div className="@3xl/workspace:col-span-4 card-glass rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#090B0F]">Tabla de Posiciones</h3>
              <Info className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{periodRangeLabel}</p>

            {leaderboard.length > 0 ? (
              <div className="mt-4 space-y-2.5 text-xs">
                {leaderboard.map((row) => (
                  <div
                    key={row.userId}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                      row.isUser
                        ? 'bg-[#090B0F] text-white shadow-[0_10px_24px_rgba(9,11,15,0.2)]'
                        : 'bg-white/70 border border-slate-900/[0.06] text-[#090B0F]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ChevronUp
                        className={`w-3.5 h-3.5 shrink-0 ${
                          row.isUser ? 'text-amber-400' : 'text-emerald-600'
                        }`}
                        strokeWidth={2.5}
                      />
                      <span
                        className={`font-mono font-bold w-4 ${
                          row.isUser ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {row.rank}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${
                          row.isUser ? 'bg-white text-[#090B0F]' : 'bg-slate-200 text-[#090B0F]'
                        }`}
                      >
                        {row.initials}
                      </div>
                      <span className="truncate font-semibold">{row.name}</span>
                    </div>
                    <span className="font-mono font-bold shrink-0">
                      {row.pts.toLocaleString('en-US')} XP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 py-8 px-4 rounded-2xl border border-dashed border-slate-900/15 bg-white/40 text-center">
                <Award className="w-6 h-6 text-slate-400 mx-auto mb-2" strokeWidth={1.6} />
                <p className="text-xs font-semibold text-[#090B0F]">
                  Ranking aún sin participantes
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cuando los estudiantes acumulen XP en la plataforma, aparecerán aquí ordenados
                  por puntaje.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
