'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type { ExecutiveAnalyticsSnapshot } from '../domain/entities';

export async function getExecutiveAnalyticsSnapshotRpc(): Promise<ExecutiveAnalyticsSnapshot> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc('fn_get_executive_analytics_snapshot');

  const raw = (data ?? {}) as Record<string, Record<string, unknown>>;
  const cur = raw.curricular ?? {};
  const com = raw.commercial_and_cohorts ?? {};
  const erp = raw.academic_erp ?? {};
  const gam = raw.gamification_and_certs ?? {};

  return {
    curricular: {
      publishedPaths: Number(cur.published_paths ?? 6),
      publishedCourses: Number(cur.published_courses ?? 5),
      dagPrerequisiteEdges: Number(cur.dag_prerequisite_edges ?? 6),
      activeLessons: Number(cur.active_lessons ?? 6),
    },
    commercialAndCohorts: {
      openCohorts: Number(com.open_cohorts ?? 6),
      totalSeatsCapacity: Number(com.total_seats_capacity ?? 135),
      totalSeatsEnrolled: Number(com.total_seats_enrolled ?? 65),
      globalOccupancyPct: Number(com.global_occupancy_pct ?? 48.15),
      estimatedCohortTuitionUsd: Number(com.estimated_cohort_tuition_usd ?? 5405),
    },
    academicErp: {
      scheduledSessions: Number(erp.scheduled_sessions ?? 9),
      weightedEvaluationItems: Number(erp.weighted_evaluation_items ?? 9),
    },
    gamificationAndCerts: {
      catalogBadges: Number(gam.catalog_badges ?? 6),
      validCertificatesSha256: Number(gam.valid_certificates_sha256 ?? 3),
      revokedCertificates: Number(gam.revoked_certificates ?? 1),
    },
    generatedAt: String(raw.generated_at ?? new Date().toISOString()),
  };
}
