'use client';

import React, { useState, useOptimistic, useTransition } from 'react';
import {
  Shield,
  Search,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  type AppRole,
  type UserProfile,
  assignUserRoleAction,
  getInitials,
  getRolePermissionSummary,
} from '@/modules/iam';

interface AdminUsersConsoleClientProps {
  currentUser: UserProfile;
  initialUsers: UserProfile[];
}

export function AdminUsersConsoleClient({
  currentUser,
  initialUsers,
}: AdminUsersConsoleClientProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticUsers, addOptimisticRole] = useOptimistic(
    users,
    (state: UserProfile[], update: { userId: string; newRole: AppRole }) =>
      state.map((u) => (u.id === update.userId ? { ...u, role: update.newRole } : u))
  );

  const filteredUsers = optimisticUsers.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.documentId ?? '').toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  const handleRoleChange = (targetUser: UserProfile, newRole: AppRole) => {
    setStatusMessage(null);
    startTransition(async () => {
      addOptimisticRole({ userId: targetUser.id, newRole });
      const res = await assignUserRoleAction({
        targetUserId: targetUser.id,
        newRole,
        reason: `Cambio de rol en Consola IAM a ${newRole}`,
      });

      if (!res.success) {
        setStatusMessage({ type: 'error', text: res.error.message });
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      setStatusMessage({
        type: 'success',
        text: `Rol de ${targetUser.fullName} actualizado a '${newRole}' y sellado en audit_logs.`,
      });
    });
  };

  return (
    <div className="space-y-6 animate-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-900/10 text-[11px] font-semibold text-[#090B0F] mb-2 shadow-xs">
            <Shield className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
            <span>MÓDULO IAM · NIVEL 0 (RBAC & AUDITORÍA)</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#090B0F] tracking-tight">
            Consola de Gobierno de Identidad y Roles
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestiona permisos entre Super Admin, Coordinadores, Instructores y Estudiantes.
            Tu rol actual en sesión es:{' '}
            <strong className="text-[#090B0F] font-mono">{currentUser.role}</strong>
          </p>
        </div>
      </div>

      {currentUser.role !== 'super_admin' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" strokeWidth={2} />
          <div>
            <p className="font-bold">Modo de Solo Lectura para el rol `{currentUser.role}`</p>
            <p className="mt-0.5 text-amber-800">
              Para probar la mutación `rpc_assign_user_role`, abre el selector de usuario en la esquina superior derecha del Topbar y cambia tu rol activo a <strong>super_admin</strong>.
            </p>
          </div>
        </div>
      )}

      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-600/25 text-emerald-800'
              : 'bg-red-500/10 border-red-500/30 text-red-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="card-glass rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, correo, @usuario o documento DNI..."
            className="w-full bg-white text-xs text-[#090B0F] placeholder-slate-400 pl-9 pr-4 py-2.5 rounded-xl border border-slate-900/10 focus:outline-none focus:border-[#090B0F]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 md:pb-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          {(['all', 'super_admin', 'coordinator', 'instructor', 'student'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full font-mono text-[11px] shrink-0 transition cursor-pointer ${
                roleFilter === r
                  ? 'bg-[#090B0F] text-white font-bold shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-900/10 hover:border-slate-900/25'
              }`}
            >
              {r === 'all' ? 'Todos' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredUsers.map((u) => {
          const summary = getRolePermissionSummary(u.role);
          return (
            <div
              key={u.id}
              className="card-glass rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#090B0F] flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {getInitials(u.fullName)}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#090B0F] truncate">{u.fullName}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/[0.06] text-[10px] font-mono text-slate-700">
                      {u.documentId ?? 'Sin DNI'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {u.email} · <span className="font-mono text-slate-700">@{u.username}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-900/[0.07]">
                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-bold text-[#090B0F] block">
                    {summary.label}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{summary.badgeText}</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={u.role}
                    disabled={isPending}
                    onChange={(e) => handleRoleChange(u, e.target.value as AppRole)}
                    className="w-full sm:w-44 bg-white text-xs font-mono text-[#090B0F] px-3 py-2 rounded-xl border border-slate-900/15 focus:outline-none focus:border-[#090B0F] cursor-pointer"
                  >
                    <option value="student">student</option>
                    <option value="instructor">instructor</option>
                    <option value="coordinator">coordinator</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
