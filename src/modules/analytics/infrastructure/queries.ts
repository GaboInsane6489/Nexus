'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type { ExecutiveAnalyticsSnapshot } from '../domain/entities';

export async function getExecutiveAnalyticsSnapshotRpc(): Promise<ExecutiveAnalyticsSnapshot> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('fn_get_executive_analytics_snapshot');

  if (error) {
    throw new Error(error.message);
  }

  const raw = (data ?? {}) as Record<string, Record<string, unknown>>;
  const cur = raw.curricular ?? {};
  const com = raw.commercial_and_cohorts ?? {};
  const erp = raw.academic_erp ?? {};
  const gam = raw.gamification_and_certs ?? {};

  return {
    curricular: {
      publishedPaths: Number(cur.published_paths ?? 0),
      publishedCourses: Number(cur.published_courses ?? 0),
      dagPrerequisiteEdges: Number(cur.dag_prerequisite_edges ?? 0),
      activeLessons: Number(cur.active_lessons ?? 0),
    },
    commercialAndCohorts: {
      openCohorts: Number(com.open_cohorts ?? 0),
      totalSeatsCapacity: Number(com.total_seats_capacity ?? 0),
      totalSeatsEnrolled: Number(com.total_seats_enrolled ?? 0),
      globalOccupancyPct: Number(com.global_occupancy_pct ?? 0),
      estimatedCohortTuitionUsd: Number(com.estimated_cohort_tuition_usd ?? 0),
    },
    academicErp: {
      scheduledSessions: Number(erp.scheduled_sessions ?? 0),
      weightedEvaluationItems: Number(erp.weighted_evaluation_items ?? 0),
    },
    gamificationAndCerts: {
      catalogBadges: Number(gam.catalog_badges ?? 0),
      validCertificatesSha256: Number(gam.valid_certificates_sha256 ?? 0),
      revokedCertificates: Number(gam.revoked_certificates ?? 0),
    },
    generatedAt: String(raw.generated_at ?? new Date().toISOString()),
  };
}
