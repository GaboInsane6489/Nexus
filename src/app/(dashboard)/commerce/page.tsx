import React from 'react';
import {
  getCommerceOfferingsSnapshot,
  CommerceCheckoutExplorerClient,
} from '@/modules/commerce';

export default async function CommercePage() {
  const snapshot = await getCommerceOfferingsSnapshot();

  return (
    <CommerceCheckoutExplorerClient
      cohorts={snapshot.cohorts}
      coupons={snapshot.coupons}
    />
  );
}
