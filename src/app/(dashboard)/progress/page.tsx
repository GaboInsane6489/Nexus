import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile, getInitials } from '@/modules/iam';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/shared/lib/supabase/server';
import {
  ProgressKardexClient,
  type DayActivity,
  type EnrollmentsSummary,
  type LeaderboardEntry,
} from './ProgressKardexClient';

interface XpLedgerRow {
  final_xp_awarded: number;
  created_at: string;
}

interface EnrollmentRow {
  status: string;
  final_grade: number | null;
  attendance_pct: number | null;
}

interface GamificationJoinRow {
  user_id: string;
  total_xp: number;
  current_level: number;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

function buildLastSevenDays(xpRows: XpLedgerRow[]): DayActivity[] {
  const byDay = new Map<string, { xp: number; count: number }>();

  for (const row of xpRows) {
    const key = row.created_at.slice(0, 10);
    const current = byDay.get(key) ?? { xp: 0, count: 0 };
    byDay.set(key, {
      xp: current.xp + Number(row.final_xp_awarded ?? 0),
      count: current.count + 1,
    });
  }

  const longFmt = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  const shortFmt = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const days: DayActivity[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const dayDate = new Date(todayUtc);
    dayDate.setUTCDate(todayUtc.getUTCDate() - offset);
    const dateKey = dayDate.toISOString().slice(0, 10);
    const isToday = offset === 0;
    const stats = byDay.get(dateKey) ?? { xp: 0, count: 0 };

    const formattedLong = longFmt.format(dayDate);
    const formattedShort = shortFmt.format(dayDate).replace('.', '');

    days.push({
      dateKey,
      label: isToday ? `Hoy (${formattedLong})` : formattedLong,
      shortLabel: isToday ? 'Hoy' : formattedShort,
      eventsCount: stats.count,
      xpEarned: stats.xp,
      isToday,
    });
  }

  return days;
}

export default async function ProgressPage() {
  const user = await getCurrentUserProfile();
  if (!user) {
    redirect('/login');
  }

  let weeklyActivity: DayActivity[] = buildLastSevenDays([]);
  let leaderboard: LeaderboardEntry[] = [];
  let enrollmentsCount: EnrollmentsSummary = {
    total: 0,
    active: 0,
    completed: user.completedCoursesCount,
    averageGrade: user.weightedGpa,
    averageAttendance: user.attendancePct,
  };

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const [{ data: xpRows }, { data: enrollmentRows }, { data: leaderboardRows }] =
      await Promise.all([
        supabase
          .from('xp_ledger')
          .select('final_xp_awarded, created_at')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: true }),
        supabase
          .from('enrollments')
          .select('status, final_grade, attendance_pct')
          .eq('student_id', user.id),
        supabase
          .from('user_gamification')
          .select('user_id, total_xp, current_level, profiles(full_name)')
          .order('total_xp', { ascending: false })
          .limit(10),
      ]);

    weeklyActivity = buildLastSevenDays((xpRows as XpLedgerRow[] | null) ?? []);

    const safeEnrollments = (enrollmentRows as EnrollmentRow[] | null) ?? [];
    const active = safeEnrollments.filter((e) => e.status === 'active').length;
    const completed = safeEnrollments.filter((e) => e.status === 'completed').length;
    const averageGrade =
      safeEnrollments.length > 0
        ? Number(
            (
              safeEnrollments.reduce((acc, e) => acc + Number(e.final_grade ?? 0), 0) /
              safeEnrollments.length
            ).toFixed(2)
          )
        : 0;
    const averageAttendance =
      safeEnrollments.length > 0
        ? Number(
            (
              safeEnrollments.reduce((acc, e) => acc + Number(e.attendance_pct ?? 0), 0) /
              safeEnrollments.length
            ).toFixed(2)
          )
        : 0;

    enrollmentsCount = {
      total: safeEnrollments.length,
      active,
      completed,
      averageGrade,
      averageAttendance,
    };

    const safeLeaderboard = (leaderboardRows as GamificationJoinRow[] | null) ?? [];
    leaderboard = safeLeaderboard.map((row, index) => {
      const profileObj = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const name = profileObj?.full_name ?? 'Estudiante Nexus';
      return {
        rank: index + 1,
        userId: row.user_id,
        initials: getInitials(name),
        name,
        pts: Number(row.total_xp ?? 0),
        level: Number(row.current_level ?? 1),
        isUser: row.user_id === user.id,
      };
    });
  }

  return (
    <ProgressKardexClient
      user={user}
      weeklyActivity={weeklyActivity}
      leaderboard={leaderboard}
      enrollmentsCount={enrollmentsCount}
    />
  );
}
