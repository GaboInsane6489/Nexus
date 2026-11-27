import type { OrderPricingBreakdown } from './entities';

export function calculateOrderPricing(
  subtotalAmount: number,
  discountPct = 0,
  currency = 'USD'
): OrderPricingBreakdown {
  const safeSubtotal = Math.max(0, Number(subtotalAmount.toFixed(2)));
  const clampedPct = Math.min(100, Math.max(0, discountPct));
  const discountAmount = Number(((safeSubtotal * clampedPct) / 100).toFixed(2));
  const totalAmount = Number(Math.max(0, safeSubtotal - discountAmount).toFixed(2));

  return {
    subtotalAmount: safeSubtotal,
    discountPct: clampedPct,
    discountAmount,
    totalAmount,
    currency,
  };
}

export function calculateCohortOccupancyPct(
  enrolledCount: number,
  maxStudents: number
): number {
  if (maxStudents <= 0) return 100;
  return Math.min(100, Math.round((enrolledCount / maxStudents) * 100));
}
