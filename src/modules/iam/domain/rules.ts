import type { AppRole, RolePermissionSummary } from './entities';

export const ROLE_HIERARCHY_WEIGHT: Record<AppRole, number> = {
  student: 10,
  instructor: 20,
  coordinator: 30,
  super_admin: 40,
};

export function hasRequiredRole(userRole: AppRole, allowedRoles: readonly AppRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function canAssignTargetRole(actorRole: AppRole, targetRole: AppRole): boolean {
  if (actorRole !== 'super_admin') {
    return false;
  }
  return ROLE_HIERARCHY_WEIGHT[actorRole] >= ROLE_HIERARCHY_WEIGHT[targetRole];
}

export function getRolePermissionSummary(role: AppRole): RolePermissionSummary {
  switch (role) {
    case 'super_admin':
      return {
        role: 'super_admin',
        label: 'Super Admin',
        badgeText: 'Gobierno Total',
        description: 'Control de roles IAM, finanzas, pasarelas de pago y auditoría general.',
        canManageUsers: true,
        canManageAcademicTerms: true,
        canGradeCohort: true,
        canEnrollInCourses: false,
      };
    case 'coordinator':
      return {
        role: 'coordinator',
        label: 'Coordinador Académico',
        badgeText: 'Dirección ERP',
        description: 'Períodos académicos, rutas DAG, apertura de cohortes, justificaciones y actas.',
        canManageUsers: false,
        canManageAcademicTerms: true,
        canGradeCohort: true,
        canEnrollInCourses: false,
      };
    case 'instructor':
      return {
        role: 'instructor',
        label: 'Instructor / Docente',
        badgeText: 'Cátedra Activa',
        description: 'Gestión de cohortes asignadas, toma de asistencia y libro de calificaciones.',
        canManageUsers: false,
        canManageAcademicTerms: false,
        canGradeCohort: true,
        canEnrollInCourses: false,
      };
    case 'student':
    default:
      return {
        role: 'student',
        label: 'Estudiante',
        badgeText: 'Matrícula Activa',
        description: 'Aprendizaje por rutas DAG, seguimiento de Kardex ERP, rachas XP y certificados.',
        canManageUsers: false,
        canManageAcademicTerms: false,
        canGradeCohort: false,
        canEnrollInCourses: true,
      };
  }
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return 'NX';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
