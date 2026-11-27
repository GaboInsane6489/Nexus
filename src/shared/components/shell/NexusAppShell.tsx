'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
  Calendar,
  ChevronDown,
  ArrowLeft,
  CheckCheck,
  Building2,
  ArrowRight,
  Command,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import {
  type AppRole,
  type UserProfile,
  getInitials,
  getRolePermissionSummary,
  switchActiveRoleAction,
} from '@/modules/iam';

interface NotificationItem {
  id: string;
  category: 'academic' | 'launch';
  tag: string;
  title: string;
  time: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'academic',
    tag: 'Calificación ERP',
    title: 'Se publicó tu nota del Parcial 1: Arquitectura de Software (96.0/100 pts · +50 XP).',
    time: 'Hace 2 horas',
    unread: true,
  },
  {
    id: 'notif-2',
    category: 'launch',
    tag: 'Nueva Cohorte',
    title: 'Abierta la matrícula 2027-I: Ingeniería de Agentes IA con Next.js (12 cupos disponibles).',
    time: 'Hace 1 día',
    unread: true,
  },
  {
    id: 'notif-3',
    category: 'academic',
    tag: 'Asistencia ERP',
    title: 'Tu asistencia en Bases de Datos en Supabase fue registrada como Presente (96% acumulado).',
    time: 'Hace 3 días',
    unread: true,
  },
];

interface NexusAppShellProps {
  user: UserProfile;
  children: React.ReactNode;
}

export function NexusAppShell({ user, children }: NexusAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isRail, setIsRail] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'academic' | 'launch'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const roleSummary = getRolePermissionSummary(user.role);

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

  const filteredNotifications =
    notifFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.category === notifFilter);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const handleRoleSwitch = (newRole: AppRole) => {
    setIsRoleMenuOpen(false);
    startTransition(async () => {
      await switchActiveRoleAction(newRole);
      router.refresh();
    });
  };

  const navItems = [
    { href: '/', label: 'Inicio & Escuelas', icon: Home, badge: '6' },
    { href: '/paths', label: 'Malla & Rutas DAG', icon: GitBranch, badge: 'DAG' },
    { href: '/commerce', label: 'Matrícula & Checkout', icon: CreditCard, badge: '2027-I' },
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
    <div className="h-dvh w-full flex flex-col md:flex-row overflow-hidden bg-obsidian-950 select-none">
      {/* ===================================================================== */}
      {/* 1. CONTENEDOR RELATIVO DE SIDEBAR + DRAWER (CERO OFFSETS HARDCODED)   */}
      {/* ===================================================================== */}
      <div className="relative flex shrink-0 z-30">
        <aside
          className={`hidden md:flex flex-col justify-between h-dvh bg-obsidian-900 border-r border-white/[0.07] transition-all duration-300 ease-out shrink-0 ${
            isRail ? 'w-16' : 'w-60'
          }`}
        >
          <div className="p-3.5 space-y-5">
            {/* Cabecera de Marca + Botón Colapsar */}
            <div className="flex items-center justify-between px-1">
              <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white via-slate-200 to-slate-400 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(255,255,255,0.35)]">
                  <Layers className="w-4 h-4 text-obsidian-950" strokeWidth={2.4} />
                </div>
                {!isRail && (
                  <div className="flex flex-col">
                    <span className="text-white font-bold tracking-wider text-sm leading-none">
                      NEXUS
                    </span>
                    <span className="text-[10px] text-slate-400 tracking-widest uppercase mt-0.5">
                      Academy · ERP
                    </span>
                  </div>
                )}
              </Link>
              <button
                onClick={() => setIsRail((prev) => !prev)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition"
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'nav-active-silver'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-white svg-neon-glow' : ''}`}
                        strokeWidth={1.75}
                      />
                      {!isRail && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isRail && item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-200 border border-white/10 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Botón de Notificaciones (Abre Drawer Acoplado Relativo) */}
              <button
                onClick={() => setIsDrawerOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  isDrawerOpen
                    ? 'nav-active-silver'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Bell className="w-4 h-4" strokeWidth={1.75} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white silver-dot" />
                    )}
                  </div>
                  {!isRail && <span className="truncate">Notificaciones</span>}
                </div>
                {!isRail && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-obsidian-950 font-bold font-mono">
                    {unreadCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Sección: TU PROGRESO & KARDEX */}
            <div className="pt-2 space-y-1 border-t border-white/[0.06]">
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                      isActive
                        ? 'nav-active-silver'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-white svg-neon-glow' : ''}`}
                      strokeWidth={1.75}
                    />
                    {!isRail && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}

              {/* Consola IAM visible para Staff o en modo Exploración de Fase 2 */}
              <Link
                href="/admin/users"
                onClick={() => setIsDrawerOpen(false)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  pathname.startsWith('/admin')
                    ? 'nav-active-silver'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Users className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {!isRail && <span className="truncate">Gobierno IAM</span>}
                </div>
                {!isRail && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-400/15 text-sky-200 border border-sky-300/20">
                    RBAC
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Tarjeta Inferior Institucional */}
          {!isRail && (
            <div className="p-3.5 space-y-3">
              <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#151922] to-[#0D1017] border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Building2 className="w-4 h-4 text-slate-200 shrink-0" strokeWidth={1.75} />
                  <span>Rol Activo: {roleSummary.label}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {roleSummary.description}
                </p>
                <Link
                  href="/admin/users"
                  className="w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <span>Gestionar Roles IAM</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* DRAWER CONTEXTUAL ACOPLADO RELATIVO:
            En móvil: fixed inset-0.
            En tablet/desktop: md:absolute md:inset-y-0 md:left-full md:w-88 lg:w-96 */}
        {isDrawerOpen && (
          <div className="fixed inset-0 md:absolute md:inset-y-0 md:left-full md:w-88 lg:w-96 bg-[#0B0E14]/95 backdrop-blur-2xl border-r border-white/15 z-50 flex flex-col shadow-[24px_0_60px_rgba(0,0,0,0.85)]">
            <div className="p-4 border-b border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-white hover:text-slate-300 transition"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                  <span>Notificaciones</span>
                </button>
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2 py-1 rounded-md hover:bg-white/5 transition"
                >
                  <CheckCheck className="w-4 h-4" strokeWidth={1.75} />
                  <span>Leer todas</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
                {(
                  [
                    { key: 'all', label: 'Todas' },
                    { key: 'academic', label: 'Académico ERP' },
                    { key: 'launch', label: 'Lanzamientos' },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.key}
                    onClick={() => setNotifFilter(pill.key)}
                    className={`px-3 py-1 rounded-full shrink-0 transition ${
                      notifFilter === pill.key
                        ? 'bg-white text-obsidian-950 font-semibold shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                        : 'bg-[#141821] text-slate-300 border border-white/10 hover:border-white/25'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06] p-2">
              {filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                    )
                  }
                  className="p-3 rounded-lg hover:bg-white/[0.04] transition flex items-start gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-white" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-100 border border-white/15">
                      {item.tag}
                    </span>
                    <p className="text-xs text-slate-200 leading-snug">{item.title}</p>
                    <span className="text-[11px] text-slate-400 block">{item.time}</span>
                  </div>
                  {item.unread && (
                    <span className="w-2 h-2 rounded-full bg-white silver-dot mt-1.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. WORKSPACE PRINCIPAL CON CONTAINER QUERIES (@container/workspace)   */}
      {/* ===================================================================== */}
      <div className="@container/workspace flex-1 flex flex-col h-dvh min-w-0 overflow-hidden ambient-spotlight">
        {/* TOPBAR STICKY */}
        <header className="h-14 sm:h-16 px-4 sm:px-6 border-b border-white/[0.07] bg-[#07090D]/85 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
          {/* Omnibox Search Trigger */}
          <button
            onClick={() => setIsCmdOpen(true)}
            className="relative flex-1 max-w-md bg-[#11151E] hover:bg-[#151A25] text-left text-xs text-slate-400 pl-9 pr-14 py-2 sm:py-2.5 rounded-lg border border-white/10 hover:border-slate-200/35 transition flex items-center"
          >
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <span className="truncate">¿Qué quieres aprender, certificar o consultar hoy?</span>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-300 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
              ⌘K
            </span>
          </button>

          {/* Barra Derecha: Pregunta IA + Racha + Selector de Rol + Perfil XP */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsCmdOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#131822] hover:bg-[#1B2230] border border-slate-200/25 shadow-[0_0_12px_rgba(226,232,240,0.12)] text-xs font-medium text-white transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-white svg-neon-glow" strokeWidth={1.9} />
              <span className="hidden sm:inline">Pregunta IA</span>
            </button>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs"
              title="Racha activa de estudio"
            >
              <Rocket className="w-3.5 h-3.5 text-white svg-neon-glow" strokeWidth={1.75} />
              <span className="font-mono font-bold text-white">{user.streakDays}</span>
            </div>

            <Link
              href="/commerce"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] text-xs text-slate-200 font-medium transition"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.75} />
              <span>Matrículas 2027-I</span>
            </Link>

            {/* Conmutador Interactivo de Rol RBAC (Fase 2 IAM) */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-400 via-slate-100 to-white p-[1.5px] shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  <div className="w-full h-full rounded-full bg-obsidian-900 flex items-center justify-center text-[11px] font-bold text-white">
                    {getInitials(user.fullName)}
                  </div>
                </div>
                <span className="hidden sm:inline text-xs font-mono font-bold text-slate-100">
                  {user.xpTotal.toLocaleString('en-US')} pts
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              </button>

              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0D1017] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-2 z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">@{user.username}</p>
                  </div>
                  <div className="px-3 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Simular Rol RBAC (IAM Fase 2)</span>
                  </div>
                  {(['student', 'instructor', 'coordinator', 'super_admin'] as const).map((r) => (
                    <button
                      key={r}
                      disabled={isPending}
                      onClick={() => handleRoleSwitch(r)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                        user.role === r
                          ? 'bg-white text-obsidian-950 font-bold'
                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <span>{r}</span>
                      {user.role === r && <span className="text-[10px] font-mono">ACTIVO</span>}
                    </button>
                  ))}
                  <div className="pt-1 border-t border-white/10">
                    <Link
                      href="/login"
                      onClick={() => setIsRoleMenuOpen(false)}
                      className="w-full px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Vista de Autenticación (/login)</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO CON SCROLL INDEPENDIENTE */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>

        {/* BOTTOM NAVIGATION DOCK PARA MÓVIL (< md) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-obsidian-900/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 z-40">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 ${
              pathname === '/' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <Home className="w-4 h-4" strokeWidth={1.75} />
            <span>Inicio</span>
          </Link>
          <Link
            href="/erp"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 ${
              pathname === '/erp' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" strokeWidth={1.75} />
            <span>ERP</span>
          </Link>
          <Link
            href="/progress"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 ${
              pathname === '/progress' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
            <span>Progreso</span>
          </Link>
          <button
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            className="flex flex-col items-center gap-1 text-[11px] text-slate-400 hover:text-white py-1 px-3"
          >
            <Bell className="w-4 h-4" strokeWidth={1.75} />
            <span>Alertas</span>
          </button>
          <Link
            href="/profile"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 ${
              pathname === '/profile' ? 'text-white' : 'text-slate-400'
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
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1017] border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="p-3.5 border-b border-white/10 flex items-center gap-3">
              <Command className="w-4 h-4 text-slate-300 shrink-0" strokeWidth={1.75} />
              <input
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                type="text"
                placeholder="Salta a una vista, facultad o módulo del ERP..."
                className="w-full bg-transparent text-xs text-white focus:outline-none"
              />
              <button
                onClick={() => setIsCmdOpen(false)}
                className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/10"
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
                  className="w-full p-2.5 rounded-lg hover:bg-white/[0.06] flex items-center justify-between text-slate-200 hover:text-white transition"
                >
                  <span>{act.label}</span>
                  <span className="font-mono text-[10px] text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
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
