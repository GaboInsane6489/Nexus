import React from 'react';
import {
  listIssuedCertificates,
  verifyCertificateByCodeRpc,
  CertificateVerifierClient,
} from '@/modules/certificates';
import { listCatalogBadgesWithStatus } from '@/modules/gamification';

export default async function VerifyPortalPage() {
  const [allCertificates, initialVerification, badges] = await Promise.all([
    listIssuedCertificates(10),
    verifyCertificateByCodeRpc('NEX-2026-9F4K2M8X'),
    listCatalogBadgesWithStatus(),
  ]);

  return (
    <CertificateVerifierClient
      initialPayload={initialVerification}
      allCertificates={allCertificates}
      badges={badges}
    />
  );
}
