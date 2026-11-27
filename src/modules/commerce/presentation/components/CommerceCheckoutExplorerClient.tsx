'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Landmark,
  Ticket,
  ShieldCheck,
  AlertTriangle,
  Users,
  Calendar,
  CheckCircle2,
  Lock,
  Sparkles,
  FileCheck2,
  Receipt,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  BadgeCheck,
  Clock,
} from 'lucide-react';
import type { AppRole } from '@/modules/iam';
import type {
  CohortEligibilityResult,
  CohortOfferingEntity,
  CouponEntity,
  OrderStatus,
  PaymentMethod,
} from '../../domain/entities';
import {
  calculateCohortOccupancyPct,
  calculateOrderPricing,
} from '../../domain/rules';
import type {
  CatalogSelectOptions,
  PendingTreasuryOrderSummary,
  StudentOrderSummary,
} from '../../infrastructure/queries';
import {
  approvePendingOrderAction,
  createCohortAction,
  createCouponAction,
  submitOrderAndEnrollAction,
  validateCouponCodeAction,
  verifyCohortEligibilityAction,
} from '../actions';

interface CommerceCheckoutExplorerClientProps {
  cohorts: CohortOfferingEntity[];
  coupons: CouponEntity[];
  currentUserRole: AppRole | null;
  studentOrders: StudentOrderSummary[];
  pendingOrders: PendingTreasuryOrderSummary[];
  selectOptions: CatalogSelectOptions;
}

const ORDER_STATUS_STYLES: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  paid: {
    label: 'Pagada',
    className: 'bg-emerald-500/15 text-emerald-800 border-emerald-600/25',
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
  },
  under_review: {
    label: 'En Revisión',
    className: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
  },
  failed: {
    label: 'Fallida',
    className: 'bg-red-500/15 text-red-800 border-red-500/30',
  },
  refunded: {
    label: 'Reembolsada',
    className: 'bg-slate-500/15 text-slate-700 border-slate-500/25',
  },
};

export function CommerceCheckoutExplorerClient({
  cohorts,
  coupons,
  currentUserRole,
  studentOrders,
  pendingOrders,
  selectOptions,
}: CommerceCheckoutExplorerClientProps) {
  const router = useRouter();
  const activeCoupons = coupons.filter((c) => c.isActive);
  const isStaff =
    currentUserRole === 'coordinator' || currentUserRole === 'super_admin';

  const [selectedCohort, setSelectedCohort] = useState<
    CohortOfferingEntity | undefined
  >(cohorts[0]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponEntity | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [rpcEligibility, setRpcEligibility] =
    useState<CohortEligibilityResult | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    enrollmentId: string | null;
    status: string;
    totalAmount: number;
  } | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Staff management collapsible state
  const [staffOpen, setStaffOpen] = useState(false);
  const [staffFeedback, setStaffFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  // Create Cohort form state
  const [cohortCourseId, setCohortCourseId] = useState(
    selectOptions.courses[0]?.id ?? ''
  );
  const [cohortTermId, setCohortTermId] = useState(
    selectOptions.terms[0]?.id ?? ''
  );
  const [cohortInstructorId, setCohortInstructorId] = useState('');
  const [cohortCode, setCohortCode] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [cohortSchedule, setCohortSchedule] = useState('');
  const [cohortCapacity, setCohortCapacity] = useState('30');

  // Create Coupon form state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>(
    'percentage'
  );
  const [newCouponValue, setNewCouponValue] = useState('20');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState('100');
  const [newCouponValidUntil, setNewCouponValidUntil] = useState('');

  const [isPending, startTransition] = useTransition();

  const pricing = calculateOrderPricing(
    selectedCohort?.coursePrice ?? 0,
    appliedCoupon?.discountPct ?? 0
  );

  const handleSelectCohort = (cohort: CohortOfferingEntity) => {
    setSelectedCohort(cohort);
    setOrderResult(null);
    setOrderError(null);
    startTransition(async () => {
      const res = await verifyCohortEligibilityAction({ cohortId: cohort.id });
      if (res.success) {
        setRpcEligibility(res.data);
      } else {
        setOrderError(res.error.message);
      }
    });
  };

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply ?? couponInput).trim().toUpperCase();
    setCouponFeedback(null);
    startTransition(async () => {
      const res = await validateCouponCodeAction({ code });
      if (!res.success) {
        setAppliedCoupon(null);
        setCouponFeedback({ type: 'err', text: res.error.message });
        return;
      }
      setAppliedCoupon(res.data.coupon);
      setCouponInput(res.data.coupon.code);
      setCouponFeedback({
        type: 'ok',
        text: `${res.data.coupon.code}: -${res.data.coupon.discountPct}% verificado en public.coupons.`,
      });
    });
  };

  const handleSubmitOrder = () => {
    if (!selectedCohort) return;
    setOrderError(null);
    setOrderResult(null);
    startTransition(async () => {
      const res = await submitOrderAndEnrollAction({
        cohortId: selectedCohort.id,
        paymentMethod: selectedMethod,
        couponCode: appliedCoupon?.code,
        receiptUrl:
          selectedMethod === 'bank_transfer' && receiptUrl.trim().length > 0
            ? receiptUrl.trim()
            : undefined,
      });

      if (!res.success) {
        setOrderError(res.error.message);
        return;
      }

      setOrderResult(res.data);
      setReceiptUrl('');
      router.refresh();
    });
  };

  const handleApproveOrder = (orderId: string) => {
    setStaffFeedback(null);
    startTransition(async () => {
      const res = await approvePendingOrderAction({ orderId });
      if (!res.success) {
        setStaffFeedback({ type: 'err', text: res.error.message });
        return;
      }
      setStaffFeedback({
        type: 'ok',
        text: `Orden ${res.data.orderId} aprobada (${res.data.status}).`,
      });
      router.refresh();
    });
  };

  const handleCreateCohort = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFeedback(null);
    startTransition(async () => {
      const res = await createCohortAction({
        courseId: cohortCourseId,
        termId: cohortTermId,
        instructorId: cohortInstructorId || undefined,
        code: cohortCode,
        name: cohortName,
        scheduleLabel: cohortSchedule,
        maxCapacity: Number(cohortCapacity),
      });

      if (!res.success) {
        setStaffFeedback({ type: 'err', text: res.error.message });
        return;
      }

      setStaffFeedback({
        type: 'ok',
        text: res.message ?? `Cohorte ${cohortCode.toUpperCase()} creada.`,
      });
      setCohortCode('');
      setCohortName('');
      setCohortSchedule('');
      router.refresh();
    });
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFeedback(null);
    startTransition(async () => {
      const res = await createCouponAction({
        code: newCouponCode,
        discountType: newCouponType,
        discountValue: Number(newCouponValue),
        maxUses: Number(newCouponMaxUses),
        validUntil: newCouponValidUntil || undefined,
      });

      if (!res.success) {
        setStaffFeedback({ type: 'err', text: res.error.message });
        return;
      }

      setStaffFeedback({
        type: 'ok',
        text: res.message ?? `Cupón ${newCouponCode.toUpperCase()} creado.`,
      });
      setNewCouponCode('');
      setNewCouponValidUntil('');
      router.refresh();
    });
  };

  return (
    <div className="pt-2 sm:pt-3 space-y-7 animate-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-900/10 text-[11px] font-semibold text-[#090B0F] mb-2 shadow-xs">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
            <span>MÓDULO COMMERCE · NIVEL 2 (COHORTES, CHECKOUT & TESORERÍA)</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#090B0F] tracking-tight">
            Apertura de Cohortes, Checkout de Pago Único y Becas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecciona una cohorte real para verificar elegibilidad con{' '}
            <code className="text-[#090B0F] font-semibold">
              fn_check_cohort_enrollment_eligibility
            </code>{' '}
            y registrar tu orden en Supabase PostgreSQL.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 @3xl/workspace:grid-cols-12 gap-5">
        <div className="@3xl/workspace:col-span-7 space-y-3.5">
          <h2 className="text-sm sm:text-base font-bold text-[#090B0F]">
            1. Selecciona tu Cohorte Académica (public.cohorts)
          </h2>

          {cohorts.length === 0 ? (
            <div className="card-glass rounded-2xl p-6 text-xs text-slate-500">
              No hay cohortes disponibles en este momento.
            </div>
          ) : (
            <div className="space-y-3">
              {cohorts.map((cohort) => {
                const isSelected = selectedCohort?.id === cohort.id;
                const occupancyPct = calculateCohortOccupancyPct(
                  cohort.enrolledCount,
                  cohort.maxStudents
                );
                const hasPrereqs = cohort.requiredPrerequisites.length > 0;

                return (
                  <div
                    key={cohort.id}
                    onClick={() => handleSelectCohort(cohort)}
                    className={`rounded-2xl p-4 sm:p-5 transition cursor-pointer border ${
                      isSelected
                        ? 'bg-white border-[#090B0F] shadow-[0_14px_34px_-10px_rgba(9,11,15,0.16)]'
                        : 'card-glass'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-[#090B0F] text-[11px] font-mono font-bold text-white">
                            {cohort.code}
                          </span>
                          <span className="text-[11px] font-mono text-amber-700 font-semibold">
                            Período {cohort.academicTermCode}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {cohort.scheduleLabel}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#090B0F] leading-snug">
                          {cohort.name}
                        </h3>

                        {hasPrereqs ? (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-amber-800">
                            <Lock className="w-3 h-3 shrink-0" />
                            <span>Prerrequisito DAG en PostgreSQL:</span>
                            {cohort.requiredPrerequisites.map((req) => (
                              <span
                                key={req.requiredCourseId}
                                className="px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 font-mono font-semibold"
                              >
                                {req.code} (≥{req.minGradeRequired} pts)
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Sin prerrequisitos previos · Ingreso directo habilitado
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900/[0.06] shrink-0">
                        <span className="text-lg font-bold text-[#090B0F] font-mono">
                          ${cohort.coursePrice.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {cohort.availableSeats} cupos libres ({occupancyPct}% lleno)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="@3xl/workspace:col-span-5 space-y-5">
          <div className="card-glass rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#090B0F]">
                <Sparkles className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
                <span>Dictamen Pre-Compra (RPC PostgreSQL)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {selectedCohort?.code ?? '—'}
              </span>
            </div>

            {rpcEligibility === null ? (
              <div className="p-3.5 rounded-xl bg-slate-900/[0.04] border border-slate-900/10 flex items-start gap-2.5 text-xs text-slate-600">
                <Sparkles
                  className="w-4 h-4 shrink-0 mt-0.5 text-slate-500"
                  strokeWidth={1.75}
                />
                <span>
                  Selecciona una cohorte para verificar elegibilidad, cupos y
                  prerrequisitos en PostgreSQL.
                </span>
              </div>
            ) : rpcEligibility.eligible ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-600/25 flex items-start gap-2.5 text-xs text-emerald-900">
                <ShieldCheck
                  className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700"
                  strokeWidth={2}
                />
                <div>
                  <span className="font-bold block">
                    ELEGIBLE PARA MATRÍCULA INMEDIATA (reason: OK)
                  </span>
                  <span>
                    Cupos verificados en PostgreSQL:{' '}
                    <strong>{rpcEligibility.availableSeats} asientos disponibles</strong>{' '}
                    y prerrequisitos cumplidos.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle
                  className="w-4 h-4 shrink-0 mt-0.5 text-amber-700"
                  strokeWidth={2}
                />
                <div className="space-y-1">
                  <span className="font-bold block">
                    MATRÍCULA BLOQUEADA POR REGLA ACADÉMICA ({rpcEligibility.reason})
                  </span>
                  <p>
                    La función PostgreSQL{' '}
                    <code className="font-semibold">
                      fn_check_cohort_enrollment_eligibility
                    </code>{' '}
                    detectó que aún no tienes registrada un acta completed en:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rpcEligibility.missingPrerequisites?.map((m) => (
                      <span
                        key={m.code}
                        className="px-2 py-0.5 rounded-md bg-white border border-amber-500/35 font-mono text-[#090B0F] font-semibold"
                      >
                        {m.code}: {m.title} (Mín. {m.minGrade} pts)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-[#090B0F]" />
                  <span>Cupón o Beca (public.coupons)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {activeCoupons.length > 0
                    ? activeCoupons.map((c) => c.code).join(' · ')
                    : 'Sin cupones activos'}
                </span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder={
                    activeCoupons[0]
                      ? `Ej. ${activeCoupons[0].code}`
                      : 'Ingresa código promocional'
                  }
                  className="flex-1 bg-white text-xs font-mono text-[#090B0F] px-3.5 py-2 rounded-xl border border-slate-900/15 focus:outline-none focus:border-[#090B0F]"
                />
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleApplyCoupon()}
                  className="px-4 py-2 rounded-xl bg-slate-900/[0.06] hover:bg-slate-900/[0.12] border border-slate-900/10 text-xs font-semibold text-[#090B0F] transition cursor-pointer"
                >
                  Validar en BD
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {coupons.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleApplyCoupon(c.code)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-mono border transition cursor-pointer ${
                      appliedCoupon?.code === c.code
                        ? 'bg-[#090B0F] text-white font-bold border-[#090B0F]'
                        : 'bg-white text-slate-600 border-slate-900/10 hover:border-slate-900/25'
                    }`}
                  >
                    {c.code} (-{c.discountPct}%)
                  </button>
                ))}
              </div>

              {couponFeedback && (
                <p
                  className={`text-[11px] font-medium ${
                    couponFeedback.type === 'ok'
                      ? 'text-emerald-700'
                      : 'text-red-700'
                  }`}
                >
                  {couponFeedback.text}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-900/10">
              <span className="text-xs font-semibold text-slate-700 block">
                Modalidad de Pago o Tesorería
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('stripe')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                    selectedMethod === 'stripe'
                      ? 'bg-[#090B0F] border-[#090B0F] text-white font-semibold'
                      : 'bg-white border-slate-900/10 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Tarjeta Online</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('bank_transfer')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                    selectedMethod === 'bank_transfer'
                      ? 'bg-[#090B0F] border-[#090B0F] text-white font-semibold'
                      : 'bg-white border-slate-900/10 text-slate-700'
                  }`}
                >
                  <Landmark className="w-4 h-4 shrink-0" />
                  <span>Tesorería</span>
                </button>
              </div>

              {selectedMethod === 'bank_transfer' && (
                <input
                  type="text"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  placeholder="Referencia o URL de comprobante (opcional)"
                  className="w-full bg-white text-xs text-[#090B0F] px-3.5 py-2 rounded-xl border border-slate-900/15 focus:outline-none focus:border-[#090B0F]"
                />
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/[0.04] border border-slate-900/[0.08] space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({selectedCohort?.courseCode ?? '—'})</span>
                <span className="font-mono text-[#090B0F] font-semibold">
                  ${pricing.subtotalAmount.toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  Descuento ({appliedCoupon ? appliedCoupon.code : 'Ninguno'})
                </span>
                <span className="font-mono text-emerald-700 font-semibold">
                  -${pricing.discountAmount.toFixed(2)} USD
                </span>
              </div>
              <div className="pt-2 border-t border-slate-900/10 flex justify-between items-baseline">
                <span className="font-bold text-[#090B0F]">Total Único a Pagar</span>
                <span className="text-xl font-bold text-[#090B0F] font-mono">
                  ${pricing.totalAmount.toFixed(2)} USD
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedCohort || !rpcEligibility?.eligible || isPending}
              onClick={handleSubmitOrder}
              className={`w-full py-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition ${
                selectedCohort && rpcEligibility?.eligible && !isPending
                  ? 'btn-obsidian cursor-pointer'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {rpcEligibility?.eligible ? (
                <>
                  <FileCheck2 className="w-4 h-4" strokeWidth={2} />
                  <span>
                    {isPending
                      ? 'Procesando en Supabase...'
                      : selectedMethod === 'bank_transfer'
                      ? 'Registrar Orden para Revisión de Tesorería'
                      : 'Confirmar Pago Único y Activar Matrícula'}
                  </span>
                </>
              ) : rpcEligibility === null ? (
                <span>Selecciona una Cohorte para Verificar Elegibilidad</span>
              ) : (
                <span>Completa los Prerrequisitos DAG para Matricular</span>
              )}
            </button>

            {orderError && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-900">
                {orderError}
              </div>
            )}

            {orderResult && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-600/25 text-xs text-emerald-900 space-y-1">
                <span className="font-mono font-bold block">
                  ORDEN REGISTRADA: {orderResult.orderId}
                </span>
                <p>
                  Estado:{' '}
                  <code className="font-semibold">{orderResult.status}</code> ·
                  Total:{' '}
                  <strong>${orderResult.totalAmount.toFixed(2)} USD</strong>
                  {orderResult.enrollmentId ? (
                    <>
                      {' '}
                      · Matrícula:{' '}
                      <code className="font-semibold">
                        {orderResult.enrollmentId}
                      </code>
                    </>
                  ) : null}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mis Órdenes y Matrículas */}
      <section className="card-glass rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900/10 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#090B0F]" strokeWidth={1.75} />
            <h2 className="text-sm sm:text-base font-bold text-[#090B0F]">
              Mis Órdenes y Matrículas
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {studentOrders.length} registradas
          </span>
        </div>

        {studentOrders.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aún no tienes órdenes registradas en tu cuenta.
          </p>
        ) : (
          <div className="space-y-2.5">
            {studentOrders.map((order) => {
              const statusMeta = ORDER_STATUS_STYLES[order.paymentStatus];
              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-white border border-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#090B0F]">
                        {order.invoiceNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {order.method}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700">
                      {order.items.length > 0
                        ? order.items
                            .map((item) =>
                              item.cohortCode
                                ? `${item.cohortCode} · ${item.courseTitle}`
                                : item.courseTitle
                            )
                            .join(', ')
                        : 'Orden de matrícula'}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                    <span className="font-mono text-sm font-bold text-[#090B0F]">
                      ${order.totalAmount.toFixed(2)} {order.currency}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Gestión de Cohortes, Cupones y Tesorería (Staff only) */}
      {isStaff && (
        <section className="card-glass rounded-3xl p-5 sm:p-6 space-y-4">
          <button
            type="button"
            onClick={() => setStaffOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
              <h2 className="text-sm sm:text-base font-bold text-[#090B0F]">
                Gestión de Cohortes, Cupones y Tesorería
              </h2>
              {pendingOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-900">
                  {pendingOrders.length} por aprobar
                </span>
              )}
            </div>
            {staffOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {staffOpen && (
            <div className="space-y-6 pt-3 border-t border-slate-900/10">
              {staffFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border ${
                    staffFeedback.type === 'ok'
                      ? 'bg-emerald-500/10 border-emerald-600/25 text-emerald-900'
                      : 'bg-red-500/10 border-red-500/30 text-red-900'
                  }`}
                >
                  {staffFeedback.text}
                </div>
              )}

              {/* Pending Treasury Orders */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#090B0F]">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Órdenes Pendientes de Tesorería</span>
                </div>

                {pendingOrders.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No hay órdenes pendientes de aprobación.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-[#090B0F]">
                              {order.invoiceNumber}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {order.studentName || order.studentEmail}
                            </span>
                            <span className="font-mono text-slate-500">
                              ({order.method})
                            </span>
                          </div>
                          <div className="text-slate-600">
                            ${order.totalAmount.toFixed(2)} {order.currency} ·{' '}
                            {order.items
                              .map((i) => i.cohortCode || i.courseTitle)
                              .join(', ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleApproveOrder(order.id)}
                          className="btn-obsidian px-4 py-2 rounded-full text-xs font-semibold cursor-pointer shrink-0"
                        >
                          Aprobar y Matricular
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 @3xl/workspace:grid-cols-2 gap-5">
                {/* Create Cohort Form */}
                <form
                  onSubmit={handleCreateCohort}
                  className="p-4 rounded-2xl bg-white border border-slate-900/10 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#090B0F]">
                    <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Crear Nueva Cohorte</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <select
                      required
                      value={cohortCourseId}
                      onChange={(e) => setCohortCourseId(e.target.value)}
                      className="bg-white px-3 py-2 rounded-xl border border-slate-900/15 text-[#090B0F]"
                    >
                      <option value="">Selecciona curso...</option>
                      {selectOptions.courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} · {c.title}
                        </option>
                      ))}
                    </select>

                    <select
                      required
                      value={cohortTermId}
                      onChange={(e) => setCohortTermId(e.target.value)}
                      className="bg-white px-3 py-2 rounded-xl border border-slate-900/15 text-[#090B0F]"
                    >
                      <option value="">Selecciona período...</option>
                      {selectOptions.terms.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.code} · {t.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      required
                      value={cohortCode}
                      onChange={(e) => setCohortCode(e.target.value.toUpperCase())}
                      placeholder="Código (ej. COH-2027-02)"
                      className="bg-white px-3 py-2 rounded-xl border border-slate-900/15 font-mono text-[#090B0F]"
                    />

                    <input
                      type="text"
                      required
                      value={cohortName}
                      onChange={(e) => setCohortName(e.target.value)}
                      placeholder="Nombre de cohorte"
                      className="bg-white px-3 py-2 rounded-xl border border-slate-900/15 text-[#090B0F]"
                    />

                    <input
                      type="text"
                      required
                      value={cohortSchedule}
                      onChange={(e) => setCohortSchedule(e.target.value)}
                      placeholder="Horario (ej. Mar/Jue 19:00)"
                      className="bg-white px-3 py-2 rounded-xl border border-slate-900/15 text-[#090B0F]"
                    />

                    <input
                      type="number"
                      required
                      min={1}
                      max={500}
                      value={cohortCapacity}
                      onChange={(e) => setCohortCapacity(e.target.value)}
                      placeholder="Capacidad"
                      className="bg-white px-3 py-2 rounded-xl border border-slate-900/15 font-mono text-[#090B0F]"
                    />

                    <select
                      value={cohortInstructorId}
                      onChange={(e) => setCohortInstructorId(e.target.value)}
                      className="sm:col-span-2 bg-white px-3 py-2 rounded-xl border border-slate-900/15 text-[#090B0F]"
                    >
                      <option value="">Docente asignado (opcional)</option>
                      {selectOptions.instructors.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.fullName} ({inst.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-obsidian px-4 py-2 rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Crear Cohorte
                  </button>
                </form>

                {/* Create Coupon Form */}
                <form
                  onSubmit={handleCreateCoupon}
                  className="p-4 rounded-2xl bg-white border border-slate-900/10 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#090B0F]">
                    <Ticket className="w-3.5 h-3.5 text-amber-600" />
                    <span>Crear Nuevo Cupón o Beca</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <input
                      type="text"
                      required
                      value={newCouponCode}
                      onChange={(e) =>
                        setNewCouponCode(e.target.value.toUpperCase())
                      }
                      placeholder="Código (ej. BECA50)"
                      className="bg-white px-3 py-2 rounded-xl border border-slate-900/15 font-mono text-[#090B0F]"
                    />

                    <select
                      value={newCouponType}
                      onChange={(e) =>
                        setNewCouponType(
                          e.target.value === 'fixed' ? 'fixed' : 'percentage'
                        )
                      }
                      className="bg-white px-3 py-2 rounded-xl border border-slate-900/15 text-[#090B0F]"
                    >
                      <option value="percentage">Porcentaje (%)</option>
                      <option value="fixed">Monto Fijo</option>
                    </select>

                    <input
                      type="number"
                      required
                      min={1}
                      step="0.01"
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(e.target.value)}
                      placeholder="Valor descuento"
                      className="bg-white px-3 py-2 rounded-xl border border-slate-900/15 font-mono text-[#090B0F]"
                    />

                    <input
                      type="number"
                      min={1}
                      value={newCouponMaxUses}
                      onChange={(e) => setNewCouponMaxUses(e.target.value)}
                      placeholder="Usos máximos"
                      className="bg-white px-3 py-2 rounded-xl border border-slate-900/15 font-mono text-[#090B0F]"
                    />

                    <input
                      type="date"
                      value={newCouponValidUntil}
                      onChange={(e) => setNewCouponValidUntil(e.target.value)}
                      className="sm:col-span-2 bg-white px-3 py-2 rounded-xl border border-slate-900/15 font-mono text-[#090B0F]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-obsidian px-4 py-2 rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Crear Cupón
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
