// API Pública del Módulo IAM (Nivel 0) — Gobernado por nexus-architecture-guard
export type { AppRole, UserProfile, RolePermissionSummary } from './domain/entities';
export {
  hasRequiredRole,
  canAssignTargetRole,
  getRolePermissionSummary,
  getInitials,
} from './domain/rules';
export {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  assignUserRoleSchema,
  type LoginInput,
  type RegisterInput,
  type UpdateProfileInput,
  type AssignUserRoleInput,
} from './application/schemas';
export { getCurrentUserProfile, listDirectoryUsers } from './infrastructure/queries';
export {
  updateProfileAction,
  switchActiveRoleAction,
  assignUserRoleAction,
  signInWithPasswordAction,
  registerStudentAccountAction,
} from './presentation/actions';
export { ProfileViewClient } from './presentation/components/ProfileViewClient';
export { AdminUsersConsoleClient } from './presentation/components/AdminUsersConsoleClient';
