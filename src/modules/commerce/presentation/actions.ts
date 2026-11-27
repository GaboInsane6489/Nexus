'use server';

import type { ActionResult } from '@/shared/types/action-result';
import type { CohortEligibilityResult, CouponEntity } from '../domain/entities';
import {
  validateCouponSchema,
  verifyCohortEligibilitySchema,
  type ValidateCouponInput,
  type VerifyCohortEligibilityInput,
} from '../application/schemas';
import {
  checkCohortEligibilityRpc,
  findCouponByCode,
} from '../infrastructure/queries';

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

  const result = await checkCohortEligibilityRpc(
    parsed.data.cohortId,
    parsed.data.studentId
  );

  return {
    success: true,
    data: result,
  };
}
