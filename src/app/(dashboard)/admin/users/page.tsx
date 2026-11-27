import React from 'react';
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

  return (
    <AdminUsersConsoleClient
      currentUser={currentUser}
      initialUsers={directoryUsers}
    />
  );
}
