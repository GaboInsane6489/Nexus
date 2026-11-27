import type {
  CohortStatus,
  EnrollmentStatus,
  OrderItemType,
  OrderStatus,
  PaymentMethod,
  RiskLevel,
} from '@/shared/types/database.types';

export type {
  CohortStatus,
  EnrollmentStatus,
  OrderItemType,
  OrderStatus,
  PaymentMethod,
  RiskLevel,
};

export interface CohortOfferingEntity {
  id: string;
  code: string;
  name: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  coursePrice: number;
  courseCredits: number;
  minPassingGrade: number;
  minAttendancePct: number;
  academicTermCode: string;
  scheduleLabel: string;
  maxStudents: number;
  enrolledCount: number;
  availableSeats: number;
  startDate: string;
  endDate: string;
  status: CohortStatus;
  requiredPrerequisites: Array<{
    requiredCourseId: string;
    code: string;
    title: string;
    minGradeRequired: number;
  }>;
}

export interface CouponEntity {
  id: string;
  code: string;
  description: string;
  discountPct: number;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  validUntil: string | null;
}

export interface OrderPricingBreakdown {
  subtotalAmount: number;
  discountPct: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
}

export interface CohortEligibilityResult {
  eligible: boolean;
  reason: 'OK' | 'COHORT_NOT_FOUND' | 'COHORT_CLOSED' | 'COHORT_FULL' | 'PREREQUISITES_MISSING';
  availableSeats?: number;
  missingPrerequisites?: Array<{
    code: string;
    title: string;
    minGrade: number;
  }>;
}
