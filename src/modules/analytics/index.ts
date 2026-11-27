// API Pública del Módulo Analytics (Nivel 4) — Gobernado por nexus-architecture-guard
export type { ExecutiveAnalyticsSnapshot } from './domain/entities';
export { getExecutiveAnalyticsSnapshotRpc } from './infrastructure/queries';
export { ExecutiveAnalyticsDashboardClient } from './presentation/components/ExecutiveAnalyticsDashboardClient';
