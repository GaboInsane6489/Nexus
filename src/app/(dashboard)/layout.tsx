import React from 'react';
import { getCurrentUserProfile } from '@/modules/iam';
import { NexusAppShell } from '@/shared/components/shell/NexusAppShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserProfile();

  return <NexusAppShell user={user}>{children}</NexusAppShell>;
}
