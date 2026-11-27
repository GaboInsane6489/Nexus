export interface ExecutiveAnalyticsSnapshot {
  curricular: {
    publishedPaths: number;
    publishedCourses: number;
    dagPrerequisiteEdges: number;
    activeLessons: number;
  };
  commercialAndCohorts: {
    openCohorts: number;
    totalSeatsCapacity: number;
    totalSeatsEnrolled: number;
    globalOccupancyPct: number;
    estimatedCohortTuitionUsd: number;
  };
  academicErp: {
    scheduledSessions: number;
    weightedEvaluationItems: number;
  };
  gamificationAndCerts: {
    catalogBadges: number;
    validCertificatesSha256: number;
    revokedCertificates: number;
  };
  generatedAt: string;
}
