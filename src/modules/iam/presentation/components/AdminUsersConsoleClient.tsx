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
    <div className="space-y-6">
      {/* Cabecera de Gobierno IAM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-white mb-2">
            <Shield className="w-3.5 h-3.5 text-white svg-neon-glow" strokeWidth={1.75} />
            <span>MÓDULO IAM · NIVEL 0 (RBAC & AUDITORÍA)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Consola de Gobierno de Identidad y Roles
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestiona permisos entre Super Admin, Coordinadores, Instructores y Estudiantes.
            Tu rol actual en sesión es:{' '}
            <strong className="text-white font-mono">{currentUser.role}</strong>
          </p>
        </div>
      </div>

      {/* Aviso si el rol actual no es super_admin */}
      {currentUser.role !== 'super_admin' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-start gap-3 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="font-semibold text-white">Modo de Solo Lectura para el rol `{currentUser.role}`</p>
            <p className="mt-0.5 text-slate-300">
              Para probar la mutación `rpc_assign_user_role`, abre el selector de usuario en la esquina superior derecha del Topbar y cambia tu rol activo a <strong className="text-white">super_admin</strong>.
            </p>
          </div>
        </div>
      )}

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
              : 'bg-red-500/10 border-red-400/30 text-red-200'
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

      {/* Barra de Búsqueda en Tiempo Real + Píldoras de Rol */}
      <div className="card-obsidian rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
            className="w-full bg-[#0B0E14] text-xs text-white placeholder-slate-400 pl-9 pr-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-white/40"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 md:pb-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          {(['all', 'super_admin', 'coordinator', 'instructor', 'student'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] shrink-0 transition ${
                roleFilter === r
                  ? 'bg-white text-obsidian-950 font-bold shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                  : 'bg-[#0B0E14] text-slate-300 border border-white/10 hover:border-white/25'
              }`}
            >
              {r === 'all' ? 'Todos' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Lista / Grilla Adaptativa de Usuarios (@container) */}
      <div className="space-y-3">
        {filteredUsers.map((u) => {
          const summary = getRolePermissionSummary(u.role);
          return (
            <div
              key={u.id}
              className="card-obsidian rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-200 p-[1.5px] shrink-0">
                  <div className="w-full h-full rounded-full bg-obsidian-900 flex items-center justify-center text-xs font-bold text-white">
                    {getInitials(u.fullName)}
                  </div>
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate">{u.fullName}</h3>
                    <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-mono text-slate-200">
                      {u.documentId ?? 'Sin DNI'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {u.email} · <span className="font-mono text-slate-300">@{u.username}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/[0.07]">
                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-semibold text-white block">
                    {summary.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{summary.badgeText}</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={u.role}
                    disabled={isPending}
                    onChange={(e) => handleRoleChange(u, e.target.value as AppRole)}
                    className="w-full sm:w-44 bg-[#0B0E14] text-xs font-mono text-white px-3 py-2 rounded-lg border border-white/15 focus:outline-none focus:border-white/50 cursor-pointer"
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
