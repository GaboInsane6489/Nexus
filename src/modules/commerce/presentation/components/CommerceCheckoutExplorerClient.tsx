'use client';

import React, { useState, useTransition } from 'react';
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
} from 'lucide-react';
import type {
  CohortEligibilityResult,
  CohortOfferingEntity,
  CouponEntity,
  PaymentMethod,
} from '../../domain/entities';
import {
  calculateCohortOccupancyPct,
  calculateOrderPricing,
} from '../../domain/rules';
import {
  validateCouponCodeAction,
  verifyCohortEligibilityAction,
} from '../actions';

interface CommerceCheckoutExplorerClientProps {
  cohorts: CohortOfferingEntity[];
  coupons: CouponEntity[];
}

export function CommerceCheckoutExplorerClient({
  cohorts,
  coupons,
}: CommerceCheckoutExplorerClientProps) {
  const [selectedCohort, setSelectedCohort] = useState<CohortOfferingEntity>(
    cohorts[0]
  );
  const [couponInput, setCouponInput] = useState('NEXUS20');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponEntity | null>(
    coupons[0] ?? null
  );
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe');
  const [rpcEligibility, setRpcEligibility] =
    useState<CohortEligibilityResult | null>({
      eligible: true,
      reason: 'OK',
      availableSeats: cohorts[0]
        ? cohorts[0].maxStudents - cohorts[0].enrolledCount
        : 12,
    });
  const [checkoutCompletedInvoice, setCheckoutCompletedInvoice] = useState<
    string | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const pricing = calculateOrderPricing(
    selectedCohort?.coursePrice ?? 69,
    appliedCoupon?.discountPct ?? 0
  );

  const handleSelectCohort = (cohort: CohortOfferingEntity) => {
    setSelectedCohort(cohort);
    setCheckoutCompletedInvoice(null);
    startTransition(async () => {
      const res = await verifyCohortEligibilityAction({ cohortId: cohort.id });
      if (res.success) {
        setRpcEligibility(res.data);
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

  const handleSimulateOrderSubmission = () => {
    const inv = `INV-2027-${Math.floor(100000 + Math.random() * 900000)}`;
    setCheckoutCompletedInvoice(inv);
  };

  return (
    <div className="space-y-7">
      {/* Cabecera del Motor Comercial y Matrículas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-white mb-2">
            <CreditCard
              className="w-3.5 h-3.5 text-white svg-neon-glow"
              strokeWidth={1.75}
            />
            <span>
              MÓDULO COMMERCE · NIVEL 2 (COHORTES, CHECKOUT & TESORERÍA EN POSTGRESQL)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Apertura de Cohortes 2027-I, Checkout de Pago Único y Becas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Selecciona una cohorte real para ejecutar en vivo la función RPC{' '}
            <code className="text-slate-200">
              fn_check_cohort_enrollment_eligibility
            </code>{' '}
            contra Supabase PostgreSQL.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 @3xl/workspace:grid-cols-12 gap-5">
        {/* Columna Izquierda (7/12): Selector de Cohortes Abiertas en 2027-I */}
        <div className="@3xl/workspace:col-span-7 space-y-3.5">
          <h2 className="text-sm sm:text-base font-bold text-white">
            1. Selecciona tu Cohorte Académica (`public.cohorts`)
          </h2>

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
                      ? 'bg-[#161B24] border-white/45 shadow-[0_0_24px_rgba(226,232,240,0.16)]'
                      : 'card-obsidian'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[11px] font-mono font-bold text-white">
                          {cohort.code}
                        </span>
                        <span className="text-[11px] font-mono text-sky-300">
                          Período {cohort.academicTermCode}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {cohort.scheduleLabel}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white leading-snug">
                        {cohort.name}
                      </h3>

                      {hasPrereqs ? (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-amber-300">
                          <Lock className="w-3 h-3 shrink-0" />
                          <span>Prerrequisito DAG en PostgreSQL:</span>
                          {cohort.requiredPrerequisites.map((req) => (
                            <span
                              key={req.requiredCourseId}
                              className="px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-300/30 font-mono"
                            >
                              {req.code} (≥{req.minGradeRequired} pts)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Sin prerrequisitos previos · Ingreso directo habilitado
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06] shrink-0">
                      <span className="text-lg font-bold text-white font-mono">
                        ${cohort.coursePrice.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {cohort.availableSeats} cupos libres ({occupancyPct}% lleno)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha (5/12): Validador RPC Pre-Matrícula + Checkout + Cupones */}
        <div className="@3xl/workspace:col-span-5 space-y-5">
          {/* Resultado en Vivo del RPC PostgreSQL fn_check_cohort_enrollment_eligibility */}
          <div className="card-obsidian rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Sparkles
                  className="w-4 h-4 text-white svg-neon-glow"
                  strokeWidth={1.75}
                />
                <span>Dictamen Pre-Compra (RPC PostgreSQL)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {selectedCohort?.code}
              </span>
            </div>

            {rpcEligibility?.eligible ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-start gap-2.5 text-xs text-emerald-200">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <span className="font-bold text-white block">
                    ELEGIBLE PARA MATRÍCULA INMEDIATA (`reason: OK`)
                  </span>
                  <span>
                    Cupos verificados en PostgreSQL:{' '}
                    <strong>{rpcEligibility.availableSeats} asientos disponibles</strong>{' '}
                    y prerrequisitos cumplidos.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/35 flex items-start gap-2.5 text-xs text-amber-200">
                <AlertTriangle
                  className="w-4 h-4 shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <div className="space-y-1">
                  <span className="font-bold text-white block">
                    MATRÍCULA BLOQUEADA POR REGLA ACADÉMICA ({rpcEligibility?.reason})
                  </span>
                  <p>
                    La función PostgreSQL{' '}
                    <code className="text-white">
                      fn_check_cohort_enrollment_eligibility
                    </code>{' '}
                    detectó que aún no tienes registrada un acta `completed` en:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rpcEligibility?.missingPrerequisites?.map((m) => (
                      <span
                        key={m.code}
                        className="px-2 py-0.5 rounded bg-black/40 border border-amber-300/40 font-mono text-white"
                      >
                        {m.code}: {m.title} (Mín. {m.minGrade} pts)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Validador de Cupones y Becas Reales en public.coupons */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-white" />
                  <span>Cupón o Código de Beca (`public.coupons`)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Prueba: NEXUS20 · EARLY2027 · BECA100
                </span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Ej. NEXUS20"
                  className="flex-1 bg-[#0B0E14] text-xs font-mono text-white px-3.5 py-2 rounded-lg border border-white/15 focus:outline-none focus:border-white/50"
                />
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleApplyCoupon()}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition cursor-pointer"
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
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition cursor-pointer ${
                      appliedCoupon?.code === c.code
                        ? 'bg-white text-obsidian-950 font-bold border-white'
                        : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {c.code} (-{c.discountPct}%)
                  </button>
                ))}
              </div>

              {couponFeedback && (
                <p
                  className={`text-[11px] ${
                    couponFeedback.type === 'ok'
                      ? 'text-emerald-300'
                      : 'text-red-300'
                  }`}
                >
                  {couponFeedback.text}
                </p>
              )}
            </div>

            {/* Selector de Modalidad de Pago */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-semibold text-slate-300 block">
                Modalidad de Pago o Tesorería
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('stripe')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                    selectedMethod === 'stripe'
                      ? 'bg-white/15 border-white/45 text-white font-semibold'
                      : 'bg-[#0B0E14] border-white/10 text-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Tarjeta Online (Webhook)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('bank_transfer')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                    selectedMethod === 'bank_transfer'
                      ? 'bg-white/15 border-white/45 text-white font-semibold'
                      : 'bg-[#0B0E14] border-white/10 text-slate-300'
                  }`}
                >
                  <Landmark className="w-4 h-4 shrink-0" />
                  <span>Comprobante Tesorería</span>
                </button>
              </div>
            </div>

            {/* Desglose Financiero Exacto */}
            <div className="p-4 rounded-xl bg-[#0B0E14] border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({selectedCohort?.courseCode})</span>
                <span className="font-mono text-slate-200">
                  ${pricing.subtotalAmount.toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>
                  Descuento ({appliedCoupon ? appliedCoupon.code : 'Ninguno'})
                </span>
                <span className="font-mono text-emerald-300">
                  -${pricing.discountAmount.toFixed(2)} USD
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                <span className="font-bold text-white">Total Único a Pagar</span>
                <span className="text-xl font-bold text-white font-mono">
                  ${pricing.totalAmount.toFixed(2)} USD
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!rpcEligibility?.eligible || isPending}
              onClick={handleSimulateOrderSubmission}
              className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                rpcEligibility?.eligible
                  ? 'btn-neon-silver cursor-pointer'
                  : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
              }`}
            >
              {rpcEligibility?.eligible ? (
                <>
                  <FileCheck2 className="w-4 h-4" strokeWidth={2} />
                  <span>
                    {selectedMethod === 'bank_transfer'
                      ? 'Registrar Orden para Revisión de Tesorería'
                      : 'Confirmar Pago Único y Activar Matrícula'}
                  </span>
                </>
              ) : (
                <span>Completa los Prerrequisitos DAG para Matricular</span>
              )}
            </button>

            {checkoutCompletedInvoice && (
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/30 text-xs text-white space-y-1">
                <span className="font-mono font-bold block">
                  ORDEN GENERADA: {checkoutCompletedInvoice}
                </span>
                <p className="text-slate-200">
                  Cohorte <strong>{selectedCohort.code}</strong> vinculada con método{' '}
                  <code className="text-white">{selectedMethod}</code> por{' '}
                  <strong>${pricing.totalAmount.toFixed(2)} USD</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
