import React from 'react';
import { getCurrentUserProfile } from '@/modules/iam';
import { ProgressKardexClient } from './ProgressKardexClient';

export default async function ProgressPage() {
  const user = await getCurrentUserProfile();
  return <ProgressKardexClient user={user} />;
}
