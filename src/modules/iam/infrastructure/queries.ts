'use server';

import { createSupabaseServerClient, isSupabaseConfigured } from '@/shared/lib/supabase/server';
import type { AppRole, UserProfile } from '../domain/entities';

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const [
      { data: profile, error: profileError },
      { data: roleRow },
      { data: gamification },
      { count: certificatesCount },
      { data: enrollments },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, email, username, full_name, document_id, phone, avatar_url, bio, timezone, is_active, created_at'
        )
        .eq('id', user.id)
        .single(),
      supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('user_gamification')
        .select('total_xp, current_level, current_streak_days')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('is_revoked', false),
      supabase
        .from('enrollments')
        .select('status, final_grade, attendance_pct')
        .eq('student_id', user.id),
    ]);

    if (profileError || !profile) {
      return null;
    }

    const enrollmentRows = enrollments ?? [];
    const completedCoursesCount = enrollmentRows.filter((e) => e.status === 'completed').length;
    const weightedGpa =
      enrollmentRows.length > 0
        ? Number(
            (
              enrollmentRows.reduce((acc, e) => acc + Number(e.final_grade ?? 0), 0) /
              enrollmentRows.length
            ).toFixed(2)
          )
        : 0;
    const attendancePct =
      enrollmentRows.length > 0
        ? Number(
            (
              enrollmentRows.reduce((acc, e) => acc + Number(e.attendance_pct ?? 0), 0) /
              enrollmentRows.length
            ).toFixed(2)
          )
        : 0;

    return {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      fullName: profile.full_name,
      documentId: profile.document_id,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      timezone: profile.timezone,
      role: (roleRow?.role as AppRole | undefined) ?? 'student',
      isActive: profile.is_active,
      createdAt: profile.created_at,
      xpTotal: gamification?.total_xp ?? 0,
      currentLevel: gamification?.current_level ?? 1,
      streakDays: gamification?.current_streak_days ?? 0,
      weightedGpa,
      attendancePct,
      verifiedCertificatesCount: certificatesCount ?? 0,
      completedCoursesCount,
    };
  } catch {
    return null;
  }
}

export interface UserCertificateSummary {
  id: string;
  verificationCode: string;
  courseTitle: string;
  finalGrade: number;
  attendancePct: number;
  issuedAt: string;
  isRevoked: boolean;
  signatureHash: string;
}

export async function listUserCertificates(userId: string): Promise<UserCertificateSummary[]> {
  if (!isSupabaseConfigured() || !userId) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: certRows, error } = await supabase
      .from('certificates')
      .select(
        'id, verification_code, course_id, course_title_snapshot, final_grade_snapshot, attendance_pct_snapshot, issued_at, is_revoked, signature_hash'
      )
      .eq('student_id', userId)
      .order('issued_at', { ascending: false });

    if (error || !certRows || certRows.length === 0) {
      return [];
    }

    const courseIds = Array.from(new Set(certRows.map((c) => c.course_id)));
    const { data: courseRows } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);

    const courseTitleById = new Map<string, string>(
      (courseRows ?? []).map((c) => [c.id, c.title])
    );

    return certRows.map((cert) => ({
      id: cert.id,
      verificationCode: cert.verification_code,
      courseTitle: courseTitleById.get(cert.course_id) ?? cert.course_title_snapshot,
      finalGrade: Number(cert.final_grade_snapshot ?? 0),
      attendancePct: Number(cert.attendance_pct_snapshot ?? 0),
      issuedAt: cert.issued_at,
      isRevoked: cert.is_revoked,
      signatureHash: cert.signature_hash,
    }));
  } catch {
    return [];
  }
}

export async function listDirectoryUsers(limit = 50): Promise<UserProfile[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(
        'id, email, username, full_name, document_id, phone, avatar_url, bio, timezone, is_active, created_at'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (profilesError || !profiles || profiles.length === 0) {
      return [];
    }

    const userIds = profiles.map((p) => p.id);

    const [{ data: roles }, { data: gamifications }] = await Promise.all([
      supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
      supabase
        .from('user_gamification')
        .select('user_id, total_xp, current_level, current_streak_days')
        .in('user_id', userIds),
    ]);

    const roleByUserId = new Map<string, AppRole>(
      (roles ?? []).map((r) => [r.user_id, r.role as AppRole])
    );
    const gamificationByUserId = new Map(
      (gamifications ?? []).map((g) => [g.user_id, g])
    );

    return profiles.map((p) => {
      const gamification = gamificationByUserId.get(p.id);
      return {
        id: p.id,
        email: p.email,
        username: p.username,
        fullName: p.full_name,
        documentId: p.document_id,
        phone: p.phone,
        avatarUrl: p.avatar_url,
        bio: p.bio,
        timezone: p.timezone,
        role: roleByUserId.get(p.id) ?? 'student',
        isActive: p.is_active,
        createdAt: p.created_at,
        xpTotal: gamification?.total_xp ?? 0,
        currentLevel: gamification?.current_level ?? 1,
        streakDays: gamification?.current_streak_days ?? 0,
        weightedGpa: 0,
        attendancePct: 0,
        verifiedCertificatesCount: 0,
        completedCoursesCount: 0,
      };
    });
  } catch {
    return [];
  }
}
