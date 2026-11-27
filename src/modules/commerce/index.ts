// API Pública del Módulo Commerce (Nivel 2) — Gobernado por nexus-architecture-guard
export type {
  CohortStatus,
  OrderStatus,
  PaymentMethod,
  OrderItemType,
  EnrollmentStatus,
  RiskLevel,
  CohortOfferingEntity,
  CouponEntity,
  OrderPricingBreakdown,
  CohortEligibilityResult,
} from './domain/entities';
export {
  calculateOrderPricing,
  calculateCohortOccupancyPct,
} from './domain/rules';
export {
  listActiveCoupons,
  findCouponByCode,
  getCommerceOfferingsSnapshot,
  checkCohortEligibilityRpc,
} from './infrastructure/queries';
export {
  validateCouponCodeAction,
  verifyCohortEligibilityAction,
} from './presentation/actions';
export { CommerceCheckoutExplorerClient } from './presentation/components/CommerceCheckoutExplorerClient';
