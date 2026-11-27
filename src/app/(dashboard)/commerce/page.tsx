import React from 'react';
import { getCurrentUserProfile } from '@/modules/iam';
import {
  getCommerceOfferingsSnapshot,
  listStudentOrders,
  listPendingTreasuryOrders,
  listCatalogSelectOptions,
  CommerceCheckoutExplorerClient,
} from '@/modules/commerce';

export default async function CommercePage() {
  const currentUser = await getCurrentUserProfile();
  const isStaff =
    currentUser?.role === 'coordinator' || currentUser?.role === 'super_admin';

  const [snapshot, studentOrders, pendingOrders, selectOptions] =
    await Promise.all([
      getCommerceOfferingsSnapshot(),
      currentUser ? listStudentOrders(currentUser.id) : Promise.resolve([]),
      isStaff ? listPendingTreasuryOrders() : Promise.resolve([]),
      listCatalogSelectOptions(),
    ]);

  return (
    <CommerceCheckoutExplorerClient
      cohorts={snapshot.cohorts}
      coupons={snapshot.coupons}
      currentUserRole={currentUser?.role ?? null}
      studentOrders={studentOrders}
      pendingOrders={pendingOrders}
      selectOptions={selectOptions}
    />
  );
}
