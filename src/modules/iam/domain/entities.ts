import type { AppRole } from '@/shared/types/database.types';

export type { AppRole };

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  documentId: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  timezone: string;
  role: AppRole;
  isActive: boolean;
  createdAt: string;
  // Métricas rápidas de contexto académico e identidad
  xpTotal: number;
  currentLevel: number;
  streakDays: number;
  weightedGpa: number;
  attendancePct: number;
  verifiedCertificatesCount: number;
  completedCoursesCount: number;
}

export interface RolePermissionSummary {
  role: AppRole;
  label: string;
  badgeText: string;
  description: string;
  canManageUsers: boolean;
  canManageAcademicTerms: boolean;
  canGradeCohort: boolean;
  canEnrollInCourses: boolean;
}
