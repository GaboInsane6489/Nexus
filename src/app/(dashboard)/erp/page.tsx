import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/iam';
import {
  listCohortErpBundles,
  AcademicErpWorkspaceClient,
} from '@/modules/academic-erp';

export default async function ErpPage() {
  const currentUser = await getCurrentUserProfile();

  if (!currentUser) {
    redirect('/login');
  }

  const bundles = await listCohortErpBundles();

  return (
    <AcademicErpWorkspaceClient
      bundles={bundles}
      currentUserRole={currentUser.role}
      currentUserId={currentUser.id}
    />
  );
}
