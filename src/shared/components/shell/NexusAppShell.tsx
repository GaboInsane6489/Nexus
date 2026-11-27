'use client';

import React, { useState, useEffect, useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  GitBranch,
  CreditCard,
  BookOpen,
  Bell,
  BarChart3,
  Activity,
  ShieldCheck,
  Users,
  Search,
  Sparkles,
  Rocket,
  ChevronDown,
  ArrowLeft,
  CheckCheck,
  Building2,
  ArrowRight,
  Command,
  LogOut,
} from 'lucide-react';
import {
  type UserProfile,
  getInitials,
  getRolePermissionSummary,
} from '@/modules/iam';
import type { NotificationRecord } from '@/shared/lib/notifications/queries';
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/shared/lib/notifications/actions';

function formatNotificationTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface NexusAppShellProps {
  user: UserProfile | null;
  initialNotifications?: NotificationRecord[];
  children: React.ReactNode;
}

export function NexusAppShell({
  user,
  initialNotifications = [],
  children,
}: NexusAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isRail, setIsRail] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'academic' | 'launch' | 'system'>('all');
  const [, startTransition] = useTransition();
  const [optimisticNotifications, applyOptimistic] = useOptimistic(
    initialNotifications,
    (
      state: NotificationRecord[],
      action: { type: 'mark_one'; id: string } | { type: 'mark_all' }
    ) => {
      if (action.type === 'mark_all') {
        return state.map((item) => ({ ...item, isRead: true }));
      }
      return state.map((item) => (item.id === action.id ? { ...item, isRead: true } : item));
    }
  );
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const unreadCount = optimisticNotifications.filter((n) => !n.isRead).length;
  const roleSummary = getRolePermissionSummary(user?.role ?? 'student');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCmdOpen(false);
        setIsDrawerOpen(false);
        setIsRoleMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) {
    return (
      <div className="min-h-dvh ambient-alabaster text-[#090B0F] flex flex-col">
        <header className="h-16 px-4 sm:px-8 border-b border-slate-900/[0.06] bg-white/75 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-30">
          <Link href="/verify" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#090B0F] text-white flex items-center justify-center">
              <Layers className="w-4 h-4" strokeWidth={1.75} />
            </span>
            <span className="font-bold tracking-tight text-sm text-[#090B0F]">NEXUS</span>
          </Link>
          <Link href="/login" className="btn-obsidian px-4 py-2 text-xs">
            Iniciar Sesión
          </Link>
        </header>
        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    );
  }

  const filteredNotifications =
    notifFilter === 'all'
      ? optimisticNotifications
      : optimisticNotifications.filter((n) => n.category === notifFilter);

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    startTransition(async () => {
      applyOptimistic({ type: 'mark_all' });
      await markAllNotificationsReadAction();
    });
  };

  const handleNotificationClick = (item: NotificationRecord) => {
    if (!item.isRead) {
      startTransition(async () => {
        applyOptimistic({ type: 'mark_one', id: item.id });
        await markNotificationReadAction(item.id);
      });
    }
    if (item.actionUrl) {
      setIsDrawerOpen(false);
      router.push(item.actionUrl);
    }
  };

  const navItems: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badge?: string;
  }[] = [
    { href: '/', label: 'Inicio & Escuelas', icon: Home },
    { href: '/paths', label: 'Malla & Rutas DAG', icon: GitBranch, badge: 'DAG' },
    { href: '/commerce', label: 'Matrícula & Checkout', icon: CreditCard },
    { href: '/erp', label: 'Aula & Gradebook ERP', icon: BookOpen, badge: 'ERP' },
  ];

  const progressNavItems = [
    { href: '/progress', label: 'Progreso & Kardex', icon: BarChart3 },
    { href: '/profile', label: 'Perfil & Certificados', icon: ShieldCheck },
    { href: '/verify', label: 'Verificador SHA-256', icon: Sparkles },
    { href: '/analytics', label: 'Analítica Ejecutiva', icon: Activity },
  ];

  const commandActions = [
    { label: 'Ir a Inicio y Explorador de Facultades', href: '/', tag: 'Navegación' },
    { label: 'Explorar Malla Curricular y Grafo de Prerrequisitos (DAG)', href: '/paths', tag: 'Catálogo Nivel 1' },
    { label: 'Abrir Checkout de Cohortes, Cupones y Tesorería (2027-I)', href: '/commerce', tag: 'Comercio Nivel 2' },
    { label: 'Abrir Simulador de Notas Ponderadas (ERP)', href: '/erp', tag: 'Académico ERP' },
    { label: 'Consultar Mi Progreso Semanal y Ranking', href: '/progress', tag: 'Gamificación' },
    { label: 'Verificador Público de Certificados SHA-256 e Insignias', href: '/verify', tag: 'Certificados Nivel 4' },
    { label: 'Centro de Comando y Analítica Ejecutiva en Tiempo Real', href: '/analytics', tag: 'Analytics Nivel 4' },
    { label: 'Ver Expediente y Certificados SHA-256', href: '/profile', tag: 'Certificación' },
    { label: 'Consola de Gobierno de Roles IAM (Super Admin)', href: '/admin/users', tag: 'IAM Nivel 0' },
    { label: 'Iniciar Sesión / Cambiar Cuenta', href: '/login', tag: 'Seguridad' },
  ].filter((item) => item.label.toLowerCase().includes(cmdQuery.trim().toLowerCase()));

  return (
    <div className="h-dvh w-full flex flex-col md:flex-row overflow-hidden ambient-alabaster text-[#090B0F]">
      {/* ===================================================================== */}
      {/* 1. SIDEBAR FROSTED PORCELAIN + DRAWER ACOPLADO RELATIVO               */}
      {/* ===================================================================== */}
      <div className="relative flex shrink-0 z-30">
        <aside
          className={`hidden md:flex flex-col justify-between h-dvh bg-white/75 backdrop-blur-2xl border-r border-slate-900/[0.08] transition-all duration-300 ease-out shrink-0 ${
            isRail ? 'w-16' : 'w-68'
          }`}
        >
          <div className="p-3.5 space-y-5">
            {/* Cabecera de Marca + Botón Colapsar */}
            <div className="flex items-center justify-between px-1">
              <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
                <div className="w-8 h-8 rounded-xl bg-[#090B0F] flex items-center justify-center shrink-0 shadow-[0_6px_16px_rgba(9,11,15,0.22)] group-hover:scale-105 transition">
                  <Layers className="w-4 h-4 text-white" strokeWidth={2.2} />
                </div>
                {!isRail && (
                  <div className="flex flex-col">
                    <span className="text-[#090B0F] font-bold tracking-[0.14em] text-sm leading-none">
                      NEXUS
                    </span>
                    <span className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5 font-medium">
                      Academy · ERP
                    </span>
                  </div>
                )}
              </Link>
              <button
                onClick={() => setIsRail((prev) => !prev)}
                className="text-slate-500 hover:text-[#090B0F] p-1.5 rounded-lg border border-transparent hover:border-slate-900/10 hover:bg-slate-900/[0.04] transition"
                title={isRail ? 'Expandir barra lateral' : 'Colapsar a Icon Rail'}
              >
                {isRail ? (
                  <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
                ) : (
                  <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
                )}
              </button>
            </div>

            {/* Navegación Principal */}
            <nav className="space-y-1 text-[13px]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'nav-active-obsidian'
                        : 'text-slate-600 hover:text-[#090B0F] hover:bg-slate-900/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      {!isRail && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isRail && item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'bg-slate-900/[0.05] text-slate-600 border border-slate-900/[0.08]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Botón de Notificaciones */}
              <button
                onClick={() => setIsDrawerOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  isDrawerOpen
                    ? 'nav-active-obsidian'
                    : 'text-slate-600 hover:text-[#090B0F] hover:bg-slate-900/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Bell className="w-4 h-4" strokeWidth={1.75} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse-amber" />
                    )}
                  </div>
                  {!isRail && <span className="truncate">Notificaciones</span>}
                </div>
                {!isRail && unreadCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-mono whitespace-nowrap shrink-0 ${
                      isDrawerOpen
                        ? 'bg-white text-[#090B0F]'
                        : 'bg-[#090B0F] text-white'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Sección: TU PROGRESO & KARDEX */}
            <div className="pt-2.5 space-y-1 border-t border-slate-900/[0.07]">
              {!isRail && (
                <div className="px-3 py-1 text-[10px] font-semibold tracking-widest uppercase text-slate-400">
                  Tu Progreso & Kardex
                </div>
              )}
              {progressNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'nav-active-obsidian'
                        : 'text-slate-600 hover:text-[#090B0F] hover:bg-slate-900/[0.04]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    {!isRail && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}

              {/* Consola IAM */}
              <Link
                href="/admin/users"
                onClick={() => setIsDrawerOpen(false)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  pathname.startsWith('/admin')
                    ? 'nav-active-obsidian'
                    : 'text-slate-600 hover:text-[#090B0F] hover:bg-slate-900/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Users className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {!isRail && <span className="truncate">Gobierno IAM</span>}
                </div>
                {!isRail && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono whitespace-nowrap shrink-0 ${
                      pathname.startsWith('/admin')
                        ? 'bg-white/15 text-white'
                        : 'bg-amber-500/10 text-amber-700 border border-amber-500/25'
                    }`}
                  >
                    RBAC
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Tarjeta Inferior Institucional */}
          {!isRail && (
            <div className="p-3.5 space-y-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white to-slate-50/90 border border-slate-900/[0.08] shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#090B0F]">
                  <Building2 className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">Rol: {roleSummary.label}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {roleSummary.description}
                </p>
                <Link
                  href="/admin/users"
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-900/[0.05] hover:bg-[#090B0F] hover:text-white border border-slate-900/[0.08] text-xs text-[#090B0F] font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <span>Gestionar Roles IAM</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* DRAWER CONTEXTUAL ACOPLADO RELATIVO */}
        {isDrawerOpen && (
          <div className="fixed inset-0 md:absolute md:inset-y-0 md:left-full md:w-88 lg:w-96 bg-white/92 backdrop-blur-2xl border-r border-slate-900/10 z-50 flex flex-col shadow-[24px_0_60px_rgba(15,23,42,0.14)] animate-reveal">
            <div className="p-4 border-b border-slate-900/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold text-[#090B0F] hover:text-slate-600 transition"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                  <span>Notificaciones</span>
                </button>
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#090B0F] px-2.5 py-1 rounded-lg hover:bg-slate-900/[0.05] transition"
                >
                  <CheckCheck className="w-4 h-4" strokeWidth={1.75} />
                  <span>Leer todas</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: 'all', label: 'Todas' },
                    { key: 'academic', label: 'Académico ERP' },
                    { key: 'launch', label: 'Lanzamientos' },
                    { key: 'system', label: 'Sistema' },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setNotifFilter(pill.key)}
                    className={`px-2.5 py-1.5 text-[11px] leading-none rounded-full transition cursor-pointer ${
                      notifFilter === pill.key
                        ? 'bg-[#090B0F] text-white font-semibold shadow-sm'
                        : 'bg-slate-100 text-slate-600 border border-slate-900/[0.08] hover:border-slate-900/20'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-900/[0.06] p-2">
              {filteredNotifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <Bell className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                  <p className="text-xs font-medium text-slate-500">
                    Sin notificaciones nuevas
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className="p-3 rounded-xl hover:bg-slate-900/[0.04] transition flex items-start gap-3 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-900/[0.05] border border-slate-900/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-[#090B0F]" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/[0.06] text-[#090B0F]">
                        {item.tag}
                      </span>
                      <p className="text-xs text-slate-700 leading-snug">{item.title}</p>
                      {item.body && (
                        <p className="text-[11px] text-slate-500 leading-snug">{item.body}</p>
                      )}
                      <span className="text-[11px] text-slate-400 block">
                        {formatNotificationTime(item.createdAt)}
                      </span>
                    </div>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. WORKSPACE PRINCIPAL CON PÍLDORA TOPBAR ESTILO AETHER               */}
      {/* ===================================================================== */}
      <div className="@container/workspace flex-1 flex flex-col h-dvh min-w-0 overflow-hidden">
        <header className="h-16 px-4 sm:px-6 border-b border-slate-900/[0.06] bg-white/60 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0 z-20">
          {/* Píldora Omnibox Search */}
          <button
            onClick={() => setIsCmdOpen(true)}
            className="relative flex-1 max-w-md bg-white/85 hover:bg-white text-left text-xs text-slate-500 pl-9 pr-14 py-2.5 rounded-full border border-slate-900/10 hover:border-slate-900/25 shadow-xs transition flex items-center cursor-pointer"
          >
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <span className="truncate">Explorar rutas, cursos o comandos...</span>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-900/10">
              ⌘K
            </span>
          </button>

          {/* Barra Derecha: Racha Ámbar + Perfil Obsidiana */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 border border-slate-900/10 text-xs shadow-xs"
              title="Racha activa de estudio"
            >
              <Rocket className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
              <span className="font-mono font-bold text-[#090B0F]">{user.streakDays}</span>
            </div>

            {/* Conmutador Interactivo de Rol RBAC */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[#090B0F] hover:bg-[#161B24] text-white shadow-[0_6px_18px_rgba(9,11,15,0.22)] transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-[11px] font-bold text-white">
                  {getInitials(user.fullName)}
                </div>
                <span className="hidden sm:inline text-xs font-mono font-semibold text-slate-100">
                  {user.xpTotal.toLocaleString('en-US')} pts
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.75} />
              </button>

              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-900/10 shadow-[0_24px_50px_rgba(15,23,42,0.16)] p-2 z-50 space-y-1 animate-reveal">
                  <div className="px-3 py-2 border-b border-slate-900/[0.08]">
                    <p className="text-xs font-bold text-[#090B0F] truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">@{user.username}</p>
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Rol Verificado</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#090B0F] text-white text-[10px] font-mono uppercase">
                      {user.role}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-900/[0.08] space-y-0.5">
                    <Link
                      href="/profile"
                      onClick={() => setIsRoleMenuOpen(false)}
                      className="w-full px-3 py-2 rounded-xl text-xs text-slate-700 hover:text-[#090B0F] hover:bg-slate-900/[0.05] flex items-center gap-2 transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Mi Expediente y Perfil</span>
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setIsRoleMenuOpen(false)}
                      className="w-full px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-[#090B0F] hover:bg-slate-900/[0.05] flex items-center gap-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Cambiar de Cuenta (/login)</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO CON SCROLL */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>

        {/* BOTTOM NAVIGATION DOCK PARA MÓVIL */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white/90 backdrop-blur-xl border-t border-slate-900/10 flex items-center justify-around px-2 z-40">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 ${
              pathname === '/' ? 'text-[#090B0F] font-bold' : 'text-slate-500'
            }`}
          >
            <Home className="w-4 h-4" strokeWidth={1.75} />
            <span>Inicio</span>
          </Link>
          <Link
            href="/erp"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 ${
              pathname === '/erp' ? 'text-[#090B0F] font-bold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-4 h-4" strokeWidth={1.75} />
            <span>ERP</span>
          </Link>
          <Link
            href="/progress"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 ${
              pathname === '/progress' ? 'text-[#090B0F] font-bold' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
            <span>Progreso</span>
          </Link>
          <button
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            className="flex flex-col items-center gap-1 text-[11px] text-slate-500 hover:text-[#090B0F] py-1 px-3"
          >
            <Bell className="w-4 h-4" strokeWidth={1.75} />
            <span>Alertas</span>
          </button>
          <Link
            href="/profile"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 ${
              pathname === '/profile' ? 'text-[#090B0F] font-bold' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
            <span>Perfil</span>
          </Link>
        </nav>
      </div>

      {/* ===================================================================== */}
      {/* 3. COMMAND PALETTE MODAL (⌘K)                                         */}
      {/* ===================================================================== */}
      {isCmdOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCmdOpen(false);
          }}
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-900/15 shadow-[0_30px_80px_rgba(15,23,42,0.22)] overflow-hidden animate-reveal">
            <div className="p-3.5 border-b border-slate-900/[0.08] flex items-center gap-3">
              <Command className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.75} />
              <input
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                type="text"
                placeholder="Salta a una vista, facultad o módulo del ERP..."
                className="w-full bg-transparent text-xs text-[#090B0F] placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setIsCmdOpen(false)}
                className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-900/10"
              >
                ESC
              </button>
            </div>
            <div className="p-2 space-y-1 text-xs max-h-72 overflow-y-auto">
              {commandActions.map((act) => (
                <button
                  key={act.href}
                  onClick={() => {
                    setIsCmdOpen(false);
                    router.push(act.href);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-900/[0.05] flex items-center justify-between text-slate-700 hover:text-[#090B0F] transition cursor-pointer"
                >
                  <span className="font-medium">{act.label}</span>
                  <span className="font-mono text-[10px] text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-900/[0.06]">
                    {act.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
