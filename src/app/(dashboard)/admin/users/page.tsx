import React from 'react';
import { redirect } from 'next/navigation';
import {
  getCurrentUserProfile,
  listDirectoryUsers,
  AdminUsersConsoleClient,
} from '@/modules/iam';

export default async function AdminUsersPage() {
  const [currentUser, directoryUsers] = await Promise.all([
    getCurrentUserProfile(),
    listDirectoryUsers(),
  ]);

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <AdminUsersConsoleClient
      currentUser={currentUser}
      initialUsers={directoryUsers}
    />
  );
}
