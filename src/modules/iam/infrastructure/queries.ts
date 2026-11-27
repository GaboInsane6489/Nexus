'use server';

import { cookies } from 'next/headers';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/shared/lib/supabase/server';
import type { AppRole, UserProfile } from '../domain/entities';

const SEED_DIRECTORY_USERS: UserProfile[] = [
  {
    id: 'usr-gabriel-001',
    email: 'gabriel.gonzalez@nexus.edu',
    username: 'gabrielgg2005ve',
    fullName: 'Gabriel Alexander Gonzalez Garcia',
    documentId: 'V-29845102',
    phone: '+58 412 5550192',
    avatarUrl: null,
    bio: 'Ingeniero de Software en formación · Especialización en Arquitectura Cloud, Next.js, TypeScript y Sistemas ERP.',
    timezone: 'America/Caracas',
    role: 'student',
    isActive: true,
    createdAt: '2026-01-15T12:00:00Z',
    xpTotal: 2450,
    currentLevel: 6,
    streakDays: 14,
    weightedGpa: 93.4,
    attendancePct: 96.0,
    verifiedCertificatesCount: 3,
    completedCoursesCount: 5,
  },
  {
    id: 'usr-coord-002',
    email: 'elena.rodriguez@nexus.edu',
    username: 'elena_coord_erp',
    fullName: 'Dra. Elena Rodriguez Vance',
    documentId: 'V-14920311',
    phone: '+58 414 9001122',
    avatarUrl: null,
    bio: 'Coordinadora General de Ingeniería y Períodos Académicos (2027-I).',
    timezone: 'America/Caracas',
    role: 'coordinator',
    isActive: true,
    createdAt: '2025-11-04T09:30:00Z',
    xpTotal: 5400,
    currentLevel: 11,
    streakDays: 32,
    weightedGpa: 98.0,
    attendancePct: 100.0,
    verifiedCertificatesCount: 8,
    completedCoursesCount: 12,
  },
  {
    id: 'usr-inst-003',
    email: 'marcus.sterling@nexus.edu',
    username: 'msterling_arch',
    fullName: 'Ing. Marcus Sterling',
    documentId: 'E-84210944',
    phone: '+57 300 4112233',
    avatarUrl: null,
    bio: 'Instructor Titular de Arquitectura de Sistemas Escalables y Bases de Datos PostgreSQL.',
    timezone: 'America/Bogota',
    role: 'instructor',
    isActive: true,
    createdAt: '2025-12-01T14:20:00Z',
    xpTotal: 4120,
    currentLevel: 9,
    streakDays: 21,
    weightedGpa: 95.5,
    attendancePct: 98.5,
    verifiedCertificatesCount: 6,
    completedCoursesCount: 9,
  },
  {
    id: 'usr-admin-004',
    email: 'rectoria@nexus.edu',
    username: 'nexus_superadmin',
    fullName: 'Consejo Ejecutivo Nexus IAM',
    documentId: 'J-00019283-9',
    phone: '+1 305 5550199',
    avatarUrl: null,
    bio: 'Cuenta de Gobierno Institucional, Auditoría de Actas y Control de Roles RBAC.',
    timezone: 'America/Caracas',
    role: 'super_admin',
    isActive: true,
    createdAt: '2025-10-01T08:00:00Z',
    xpTotal: 9850,
    currentLevel: 16,
    streakDays: 60,
    weightedGpa: 99.2,
    attendancePct: 100.0,
    verifiedCertificatesCount: 14,
    completedCoursesCount: 20,
  },
];

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const cookieStore = await cookies();
  const activeRoleCookie = (cookieStore.get('nexus_active_role')?.value as AppRole | undefined) ?? 'student';
  const customNameCookie = cookieStore.get('nexus_profile_name')?.value;
  const customUsernameCookie = cookieStore.get('nexus_profile_username')?.value;
  const customDocCookie = cookieStore.get('nexus_profile_doc')?.value;
  const customBioCookie = cookieStore.get('nexus_profile_bio')?.value;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, username, full_name, document_id, phone, avatar_url, bio, timezone, is_active, created_at')
          .eq('id', user.id)
          .single();

        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profile) {
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
            xpTotal: 2450,
            currentLevel: 6,
            streakDays: 14,
            weightedGpa: 93.4,
            attendancePct: 96.0,
            verifiedCertificatesCount: 3,
            completedCoursesCount: 5,
          };
        }
      }
    } catch {
      // Fallback seguro si no hay conexión aún.
    }
  }

  const baseProfile = SEED_DIRECTORY_USERS[0];
  return {
    ...baseProfile,
    role: activeRoleCookie,
    fullName: customNameCookie ?? baseProfile.fullName,
    username: customUsernameCookie ?? baseProfile.username,
    documentId: customDocCookie ?? baseProfile.documentId,
    bio: customBioCookie ?? baseProfile.bio,
  };
}

export async function listDirectoryUsers(limit = 50): Promise<UserProfile[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, username, full_name, document_id, phone, avatar_url, bio, timezone, is_active, created_at, user_roles(role)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (profiles && profiles.length > 0) {
        return profiles.map((p: Record<string, unknown>) => ({
          id: String(p.id),
          email: String(p.email),
          username: String(p.username),
          fullName: String(p.full_name),
          documentId: p.document_id ? String(p.document_id) : null,
          phone: p.phone ? String(p.phone) : null,
          avatarUrl: p.avatar_url ? String(p.avatar_url) : null,
          bio: p.bio ? String(p.bio) : null,
          timezone: String(p.timezone ?? 'America/Caracas'),
          role: 'student',
          isActive: Boolean(p.is_active),
          createdAt: String(p.created_at),
          xpTotal: 1200,
          currentLevel: 4,
          streakDays: 7,
          weightedGpa: 88.5,
          attendancePct: 92.0,
          verifiedCertificatesCount: 1,
          completedCoursesCount: 2,
        }));
      }
    } catch {
      // Usa el directorio institucional semilla en desarrollo local.
    }
  }

  return SEED_DIRECTORY_USERS;
}
