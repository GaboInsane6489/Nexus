'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type {
  CreateCohortOutput,
  CreateCouponOutput,
  SubmitOrderInput,
} from '../application/schemas';

export interface ConfirmOrderRpcResult {
  orderId: string;
  enrollmentId: string | null;
  status: string;
  totalAmount: number;
}

export interface ApproveOrderRpcResult {
  orderId: string;
  status: string;
}

function isMissingRpcError(code?: string, message?: string): boolean {
  if (code === 'PGRST202' || code === '42883') return true;
  if (!message) return false;
  return (
    message.includes('Could not find the function') ||
    message.includes('does not exist')
  );
}

export async function executeConfirmOrderAndEnrollRpc(
  input: SubmitOrderInput
): Promise<ConfirmOrderRpcResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    'rpc_confirm_order_and_enroll' as never,
    {
      p_cohort_id: input.cohortId,
      p_payment_method: input.paymentMethod,
      p_coupon_code: input.couponCode ?? null,
      p_receipt_url: input.receiptUrl ?? null,
    } as never
  );

  if (error) {
    if (isMissingRpcError(error.code, error.message)) {
      throw new Error(
        'La función transaccional rpc_confirm_order_and_enroll aún no está aplicada en Supabase. Ejecuta la migración de RPCs de comercio.'
      );
    }
    throw new Error(error.message);
  }

  const payload = (data ?? {}) as Record<string, unknown>;
  return {
    orderId: String(payload.order_id ?? ''),
    enrollmentId:
      typeof payload.enrollment_id === 'string' ? payload.enrollment_id : null,
    status: String(payload.status ?? 'pending'),
    totalAmount: Number(payload.total_usd ?? payload.total_amount ?? 0),
  };
}

export async function executeApprovePendingOrderRpc(
  orderId: string
): Promise<ApproveOrderRpcResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    'rpc_approve_pending_order' as never,
    {
      p_order_id: orderId,
    } as never
  );

  if (error) {
    if (isMissingRpcError(error.code, error.message)) {
      throw new Error(
        'La función transaccional rpc_approve_pending_order aún no está aplicada en Supabase. Ejecuta la migración de RPCs de comercio.'
      );
    }
    throw new Error(error.message);
  }

  const payload = (data ?? {}) as Record<string, unknown>;
  return {
    orderId: String(payload.order_id ?? orderId),
    status: String(payload.status ?? 'paid'),
  };
}

export async function insertCohortRecord(
  input: CreateCohortOutput
): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();

  const { data: term, error: termError } = await supabase
    .from('academic_terms')
    .select('start_date, end_date')
    .eq('id', input.termId)
    .single();

  if (termError || !term) {
    throw new Error('Período académico no encontrado.');
  }

  const { data, error } = await supabase
    .from('cohorts')
    .insert({
      course_id: input.courseId,
      academic_term_id: input.termId,
      code: input.code,
      name: input.name,
      schedule_label: input.scheduleLabel,
      max_students: input.maxCapacity,
      instructor_id: input.instructorId ?? null,
      start_date: term.start_date,
      end_date: term.end_date,
      status: 'upcoming',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear la cohorte.');
  }

  return { id: data.id };
}

export async function insertCouponRecord(
  input: CreateCouponOutput
): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const discountPct =
    input.discountType === 'percentage'
      ? Math.min(100, Math.max(0.01, input.discountValue))
      : Math.min(100, Math.max(0.01, input.discountValue));

  const label =
    input.discountType === 'percentage'
      ? `${discountPct}% de descuento`
      : `Descuento fijo (${input.discountValue} USD)`;

  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code: input.code,
      description: `Cupón ${input.code} — ${label}`,
      discount_pct: discountPct,
      max_uses: input.maxUses ?? 100,
      valid_until: input.validUntil ?? null,
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear el cupón.');
  }

  return { id: data.id };
}
