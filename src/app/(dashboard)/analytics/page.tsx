import React from 'react';
import {
  getExecutiveAnalyticsSnapshotRpc,
  ExecutiveAnalyticsDashboardClient,
} from '@/modules/analytics';

export default async function AnalyticsPage() {
  const snapshot = await getExecutiveAnalyticsSnapshotRpc();

  return <ExecutiveAnalyticsDashboardClient snapshot={snapshot} />;
}
