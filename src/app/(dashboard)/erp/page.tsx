import React from 'react';
import {
  listCohortErpBundles,
  AcademicErpWorkspaceClient,
} from '@/modules/academic-erp';

export default async function ErpPage() {
  const bundles = await listCohortErpBundles();

  return <AcademicErpWorkspaceClient bundles={bundles} />;
}
