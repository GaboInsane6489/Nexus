'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type {
  CohortEligibilityResult,
  CohortOfferingEntity,
  CouponEntity,
} from '../domain/entities';

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
      courseCode: course?.code ?? 'CUR',
      courseTitle: course?.title ?? row.name,
      coursePrice: course?.priceIndividual ?? 79,
      courseCredits: course?.academicCredits ?? 4,
      minPassingGrade: course?.minPassingGrade ?? 70,
      minAttendancePct: course?.minAttendancePct ?? 80,
      academicTermCode: termCodeMap.get(row.academic_term_id) ?? '2027-I',
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
  studentId = '00000000-0000-0000-0000-000000000001'
): Promise<CohortEligibilityResult> {
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
