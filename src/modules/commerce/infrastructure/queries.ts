'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type {
  CohortEligibilityResult,
  CohortOfferingEntity,
  CouponEntity,
  OrderStatus,
  PaymentMethod,
} from '../domain/entities';

export interface OrderLineSummary {
  id: string;
  itemType: string;
  cohortId: string | null;
  cohortCode: string;
  cohortName: string;
  courseTitle: string;
  unitPrice: number;
}

export interface StudentOrderSummary {
  id: string;
  invoiceNumber: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  method: PaymentMethod;
  paymentStatus: OrderStatus;
  receiptFileUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  items: OrderLineSummary[];
}

export interface PendingTreasuryOrderSummary {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  method: PaymentMethod;
  paymentStatus: OrderStatus;
  receiptFileUrl: string | null;
  createdAt: string;
  items: OrderLineSummary[];
}

export interface CatalogSelectOptions {
  courses: Array<{
    id: string;
    code: string;
    title: string;
    priceIndividual: number;
  }>;
  terms: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
  }>;
  instructors: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
  }>;
}

export async function listActiveCoupons(limit = 20): Promise<CouponEntity[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('coupons')
    .select(
      'id, code, description, discount_pct, max_uses, current_uses, is_active, valid_until'
    )
    .eq('is_active', true)
    .order('discount_pct', { ascending: true })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    description: row.description,
    discountPct: Number(row.discount_pct),
    maxUses: row.max_uses,
    currentUses: row.current_uses,
    isActive: row.is_active,
    validUntil: row.valid_until,
  }));
}

export async function findCouponByCode(code: string): Promise<CouponEntity | null> {
  const supabase = await createSupabaseServerClient();
  const normalized = code.trim().toUpperCase();
  const { data } = await supabase
    .from('coupons')
    .select(
      'id, code, description, discount_pct, max_uses, current_uses, is_active, valid_until'
    )
    .eq('code', normalized)
    .eq('is_active', true)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    code: data.code,
    description: data.description,
    discountPct: Number(data.discount_pct),
    maxUses: data.max_uses,
    currentUses: data.current_uses,
    isActive: data.is_active,
    validUntil: data.valid_until,
  };
}

export async function getCommerceOfferingsSnapshot(): Promise<{
  cohorts: CohortOfferingEntity[];
  coupons: CouponEntity[];
}> {
  const supabase = await createSupabaseServerClient();

  const [cohortsRes, coursesRes, termsRes, prereqsRes, coupons] = await Promise.all([
    supabase
      .from('cohorts')
      .select(
        'id, code, name, course_id, academic_term_id, schedule_label, max_students, enrolled_count, start_date, end_date, status'
      )
      .order('code', { ascending: true })
      .limit(50),
    supabase
      .from('courses')
      .select(
        'id, code, title, price_individual, academic_credits, min_passing_grade, min_attendance_pct'
      )
      .limit(50),
    supabase.from('academic_terms').select('id, code').limit(20),
    supabase
      .from('course_prerequisites')
      .select('course_id, required_course_id, min_grade_required')
      .limit(100),
    listActiveCoupons(20),
  ]);

  const courseMap = new Map<
    string,
    {
      id: string;
      code: string;
      title: string;
      priceIndividual: number;
      academicCredits: number;
      minPassingGrade: number;
      minAttendancePct: number;
    }
  >();

  for (const c of coursesRes.data ?? []) {
    courseMap.set(c.id, {
      id: c.id,
      code: c.code,
      title: c.title,
      priceIndividual: Number(c.price_individual),
      academicCredits: c.academic_credits,
      minPassingGrade: Number(c.min_passing_grade),
      minAttendancePct: Number(c.min_attendance_pct),
    });
  }

  const termCodeMap = new Map<string, string>();
  for (const t of termsRes.data ?? []) {
    termCodeMap.set(t.id, t.code);
  }

  const prereqsByCourse = new Map<
    string,
    CohortOfferingEntity['requiredPrerequisites']
  >();
  for (const p of prereqsRes.data ?? []) {
    const reqCourse = courseMap.get(p.required_course_id);
    if (!reqCourse) continue;
    const list = prereqsByCourse.get(p.course_id) ?? [];
    list.push({
      requiredCourseId: p.required_course_id,
      code: reqCourse.code,
      title: reqCourse.title,
      minGradeRequired: Number(p.min_grade_required),
    });
    prereqsByCourse.set(p.course_id, list);
  }

  const cohorts: CohortOfferingEntity[] = (cohortsRes.data ?? []).map((row) => {
    const course = courseMap.get(row.course_id);
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      courseId: row.course_id,
      courseCode: course?.code ?? '',
      courseTitle: course?.title ?? row.name,
      coursePrice: course?.priceIndividual ?? 0,
      courseCredits: course?.academicCredits ?? 0,
      minPassingGrade: course?.minPassingGrade ?? 0,
      minAttendancePct: course?.minAttendancePct ?? 0,
      academicTermCode: termCodeMap.get(row.academic_term_id) ?? '',
      scheduleLabel: row.schedule_label,
      maxStudents: row.max_students,
      enrolledCount: row.enrolled_count,
      availableSeats: Math.max(0, row.max_students - row.enrolled_count),
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      requiredPrerequisites: prereqsByCourse.get(row.course_id) ?? [],
    };
  });

  return { cohorts, coupons };
}

export async function checkCohortEligibilityRpc(
  cohortId: string,
  studentId: string
): Promise<CohortEligibilityResult> {
  if (!studentId || !studentId.trim()) {
    return {
      eligible: false,
      reason: 'COHORT_NOT_FOUND',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    'fn_check_cohort_enrollment_eligibility',
    {
      p_student_id: studentId,
      p_cohort_id: cohortId,
    }
  );

  if (error || !data || typeof data !== 'object') {
    return {
      eligible: false,
      reason: 'COHORT_NOT_FOUND',
    };
  }

  const payload = data as Record<string, unknown>;
  return {
    eligible: Boolean(payload.eligible),
    reason: (payload.reason as CohortEligibilityResult['reason']) ?? 'OK',
    availableSeats:
      typeof payload.available_seats === 'number'
        ? payload.available_seats
        : undefined,
    missingPrerequisites: Array.isArray(payload.missing_prerequisites)
      ? (payload.missing_prerequisites as CohortEligibilityResult['missingPrerequisites'])
      : undefined,
  };
}

async function buildOrderItemsMap(
  orderIds: string[]
): Promise<Map<string, OrderLineSummary[]>> {
  const result = new Map<string, OrderLineSummary[]>();
  if (orderIds.length === 0) return result;

  const supabase = await createSupabaseServerClient();
  const { data: itemRows } = await supabase
    .from('order_items')
    .select('id, order_id, item_type, course_id, target_cohort_id, unit_price')
    .in('order_id', orderIds);

  const cohortIds = Array.from(
    new Set(
      (itemRows ?? [])
        .map((i) => i.target_cohort_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const directCourseIds = Array.from(
    new Set(
      (itemRows ?? [])
        .map((i) => i.course_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const cohortsMap = new Map<
    string,
    { code: string; name: string; courseId: string }
  >();
  if (cohortIds.length > 0) {
    const { data: cohortsData } = await supabase
      .from('cohorts')
      .select('id, code, name, course_id')
      .in('id', cohortIds);

    for (const c of cohortsData ?? []) {
      cohortsMap.set(c.id, {
        code: c.code,
        name: c.name,
        courseId: c.course_id,
      });
    }
  }

  const allCourseIds = Array.from(
    new Set([
      ...directCourseIds,
      ...Array.from(cohortsMap.values()).map((c) => c.courseId),
    ])
  );
  const coursesMap = new Map<string, string>();
  if (allCourseIds.length > 0) {
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', allCourseIds);

    for (const cr of coursesData ?? []) {
      coursesMap.set(cr.id, cr.title);
    }
  }

  for (const item of itemRows ?? []) {
    const cohort = item.target_cohort_id
      ? cohortsMap.get(item.target_cohort_id)
      : undefined;
    const resolvedCourseId = item.course_id ?? cohort?.courseId ?? '';
    const line: OrderLineSummary = {
      id: item.id,
      itemType: item.item_type,
      cohortId: item.target_cohort_id,
      cohortCode: cohort?.code ?? '',
      cohortName: cohort?.name ?? '',
      courseTitle: coursesMap.get(resolvedCourseId) ?? cohort?.name ?? '',
      unitPrice: Number(item.unit_price),
    };
    const list = result.get(item.order_id) ?? [];
    list.push(line);
    result.set(item.order_id, list);
  }

  return result;
}

export async function listStudentOrders(
  studentId: string
): Promise<StudentOrderSummary[]> {
  if (!studentId || !studentId.trim()) return [];

  const supabase = await createSupabaseServerClient();
  const { data: ordersData } = await supabase
    .from('orders')
    .select(
      'id, invoice_number, subtotal_amount, discount_amount, total_amount, currency, method, payment_status, receipt_file_url, paid_at, created_at'
    )
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(50);

  const orders = ordersData ?? [];
  const itemsByOrder = await buildOrderItemsMap(orders.map((o) => o.id));

  return orders.map((row) => ({
    id: row.id,
    invoiceNumber: row.invoice_number,
    subtotalAmount: Number(row.subtotal_amount),
    discountAmount: Number(row.discount_amount),
    totalAmount: Number(row.total_amount),
    currency: row.currency,
    method: row.method,
    paymentStatus: row.payment_status,
    receiptFileUrl: row.receipt_file_url,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    items: itemsByOrder.get(row.id) ?? [],
  }));
}

export async function listPendingTreasuryOrders(): Promise<
  PendingTreasuryOrderSummary[]
> {
  const supabase = await createSupabaseServerClient();
  const { data: ordersData } = await supabase
    .from('orders')
    .select(
      'id, invoice_number, student_id, subtotal_amount, discount_amount, total_amount, currency, method, payment_status, receipt_file_url, created_at'
    )
    .in('payment_status', ['pending', 'under_review'])
    .order('created_at', { ascending: true })
    .limit(50);

  const orders = ordersData ?? [];
  if (orders.length === 0) return [];

  const studentIds = Array.from(new Set(orders.map((o) => o.student_id)));
  const [profilesRes, itemsByOrder] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', studentIds),
    buildOrderItemsMap(orders.map((o) => o.id)),
  ]);

  const profileMap = new Map<string, { fullName: string; email: string }>();
  for (const p of profilesRes.data ?? []) {
    profileMap.set(p.id, { fullName: p.full_name, email: p.email });
  }

  return orders.map((row) => {
    const student = profileMap.get(row.student_id);
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      studentId: row.student_id,
      studentName: student?.fullName ?? '',
      studentEmail: student?.email ?? '',
      subtotalAmount: Number(row.subtotal_amount),
      discountAmount: Number(row.discount_amount),
      totalAmount: Number(row.total_amount),
      currency: row.currency,
      method: row.method,
      paymentStatus: row.payment_status,
      receiptFileUrl: row.receipt_file_url,
      createdAt: row.created_at,
      items: itemsByOrder.get(row.id) ?? [],
    };
  });
}

export async function listCatalogSelectOptions(): Promise<CatalogSelectOptions> {
  const supabase = await createSupabaseServerClient();

  const [coursesRes, termsRes, roleRowsRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, code, title, price_individual')
      .eq('is_published', true)
      .order('code', { ascending: true })
      .limit(100),
    supabase
      .from('academic_terms')
      .select('id, code, name, status')
      .in('status', ['planning', 'enrollment_open', 'in_progress'])
      .order('start_date', { ascending: true })
      .limit(30),
    supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['instructor', 'coordinator', 'super_admin'])
      .limit(100),
  ]);

  const roleMap = new Map<string, string>();
  for (const r of roleRowsRes.data ?? []) {
    roleMap.set(r.user_id, r.role);
  }

  const staffIds = Array.from(roleMap.keys());
  let instructors: CatalogSelectOptions['instructors'] = [];
  if (staffIds.length > 0) {
    const { data: staffProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', staffIds)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    instructors = (staffProfiles ?? []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      role: roleMap.get(p.id) ?? 'instructor',
    }));
  }

  return {
    courses: (coursesRes.data ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      priceIndividual: Number(c.price_individual),
    })),
    terms: (termsRes.data ?? []).map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      status: t.status,
    })),
    instructors,
  };
}
