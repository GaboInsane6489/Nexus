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
export type {
  ValidateCouponInput,
  VerifyCohortEligibilityInput,
  SubmitOrderInput,
  ApproveOrderInput,
  CreateCohortInput,
  CreateCouponInput,
} from './application/schemas';
export {
  listActiveCoupons,
  findCouponByCode,
  getCommerceOfferingsSnapshot,
  checkCohortEligibilityRpc,
  listStudentOrders,
  listPendingTreasuryOrders,
  listCatalogSelectOptions,
  type OrderLineSummary,
  type StudentOrderSummary,
  type PendingTreasuryOrderSummary,
  type CatalogSelectOptions,
} from './infrastructure/queries';
export type {
  ConfirmOrderRpcResult,
  ApproveOrderRpcResult,
} from './infrastructure/mutations';
export {
  validateCouponCodeAction,
  verifyCohortEligibilityAction,
  submitOrderAndEnrollAction,
  approvePendingOrderAction,
  createCohortAction,
  createCouponAction,
} from './presentation/actions';
export { CommerceCheckoutExplorerClient } from './presentation/components/CommerceCheckoutExplorerClient';
