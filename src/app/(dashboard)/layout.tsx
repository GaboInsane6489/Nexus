import React from 'react';
import { getCurrentUserProfile } from '@/modules/iam';
import { NexusAppShell } from '@/shared/components/shell/NexusAppShell';
import { listUserNotifications } from '@/shared/lib/notifications/queries';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserProfile();
  const initialNotifications = user ? await listUserNotifications(user.id) : [];

  return (
    <NexusAppShell user={user} initialNotifications={initialNotifications}>
      {children}
    </NexusAppShell>
  );
}
