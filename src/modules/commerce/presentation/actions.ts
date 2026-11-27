'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserProfile } from '@/modules/iam';
import type { ActionResult } from '@/shared/types/action-result';
import type { CohortEligibilityResult, CouponEntity } from '../domain/entities';
import {
  approveOrderSchema,
  createCohortSchema,
  createCouponSchema,
  submitOrderSchema,
  validateCouponSchema,
  verifyCohortEligibilitySchema,
  type ApproveOrderInput,
  type CreateCohortInput,
  type CreateCouponInput,
  type SubmitOrderInput,
  type ValidateCouponInput,
  type VerifyCohortEligibilityInput,
} from '../application/schemas';
import {
  checkCohortEligibilityRpc,
  findCouponByCode,
} from '../infrastructure/queries';
import {
  executeApprovePendingOrderRpc,
  executeConfirmOrderAndEnrollRpc,
  insertCohortRecord,
  insertCouponRecord,
  type ApproveOrderRpcResult,
  type ConfirmOrderRpcResult,
} from '../infrastructure/mutations';

async function requireCommerceStaffRole(): Promise<ActionResult<never> | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return {
      success: false,
      error: {
        code: 'RBAC_FORBIDDEN',
        message: 'Se requiere rol coordinator o super_admin para esta operación.',
      },
    };
  }
  return null;
}

export async function validateCouponCodeAction(
  input: ValidateCouponInput
): Promise<ActionResult<{ coupon: CouponEntity }>> {
  const parsed = validateCouponSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_COUPON_FORMAT',
        message: 'Ingresa un código de cupón válido.',
      },
    };
  }

  const coupon = await findCouponByCode(parsed.data.code);
  if (!coupon) {
    return {
      success: false,
      error: {
        code: 'COUPON_NOT_FOUND',
        message: `El cupón '${parsed.data.code}' no existe o ha expirado en PostgreSQL.`,
      },
    };
  }

  if (coupon.currentUses >= coupon.maxUses) {
    return {
      success: false,
      error: {
        code: 'COUPON_EXHAUSTED',
        message: 'Este cupón ha alcanzado su límite máximo de usos.',
      },
    };
  }

  return {
    success: true,
    data: { coupon },
    message: `Cupón ${coupon.code} aplicado (${coupon.discountPct}% de descuento).`,
  };
}

export async function verifyCohortEligibilityAction(
  input: VerifyCohortEligibilityInput
): Promise<ActionResult<CohortEligibilityResult>> {
  const parsed = verifyCohortEligibilitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'ID de cohorte inválido.',
      },
    };
  }

  const profile = await getCurrentUserProfile();
  const studentId = parsed.data.studentId ?? profile?.id;

  if (!studentId) {
    return {
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Inicia sesión para verificar tu elegibilidad de matrícula.',
      },
    };
  }

  const result = await checkCohortEligibilityRpc(parsed.data.cohortId, studentId);

  return {
    success: true,
    data: result,
  };
}

export async function submitOrderAndEnrollAction(
  input: SubmitOrderInput
): Promise<ActionResult<ConfirmOrderRpcResult>> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return {
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Debes iniciar sesión para confirmar tu orden y matrícula.',
      },
    };
  }

  const parsed = submitOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los datos de pago seleccionados.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const result = await executeConfirmOrderAndEnrollRpc(parsed.data);
    revalidatePath('/commerce');
    return {
      success: true,
      data: result,
      message:
        result.status === 'paid'
          ? 'Pago confirmado y matrícula activada correctamente.'
          : 'Orden registrada. Pendiente de validación en Tesorería.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'ORDER_SUBMISSION_FAILED',
        message: err instanceof Error ? err.message : 'No se pudo procesar la orden.',
      },
    };
  }
}

export async function approvePendingOrderAction(
  input: ApproveOrderInput
): Promise<ActionResult<ApproveOrderRpcResult>> {
  const rbacError = await requireCommerceStaffRole();
  if (rbacError) return rbacError;

  const parsed = approveOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'ID de orden inválido.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const result = await executeApprovePendingOrderRpc(parsed.data.orderId);
    revalidatePath('/commerce');
    return {
      success: true,
      data: result,
      message: 'Orden aprobada y matrícula activada.',
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'ORDER_APPROVAL_FAILED',
        message: err instanceof Error ? err.message : 'No se pudo aprobar la orden.',
      },
    };
  }
}

export async function createCohortAction(
  input: CreateCohortInput
): Promise<ActionResult<{ id: string }>> {
  const rbacError = await requireCommerceStaffRole();
  if (rbacError) return rbacError;

  const parsed = createCohortSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los datos de la cohorte.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const result = await insertCohortRecord(parsed.data);
    revalidatePath('/commerce');
    return {
      success: true,
      data: result,
      message: `Cohorte ${parsed.data.code} creada correctamente.`,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'COHORT_CREATION_FAILED',
        message: err instanceof Error ? err.message : 'No se pudo crear la cohorte.',
      },
    };
  }
}

export async function createCouponAction(
  input: CreateCouponInput
): Promise<ActionResult<{ id: string }>> {
  const rbacError = await requireCommerceStaffRole();
  if (rbacError) return rbacError;

  const parsed = createCouponSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los datos del cupón.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const result = await insertCouponRecord(parsed.data);
    revalidatePath('/commerce');
    return {
      success: true,
      data: result,
      message: `Cupón ${parsed.data.code} creado correctamente.`,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'COUPON_CREATION_FAILED',
        message: err instanceof Error ? err.message : 'No se pudo crear el cupón.',
      },
    };
  }
}
