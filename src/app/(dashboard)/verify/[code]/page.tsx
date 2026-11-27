import React from 'react';
import {
  listIssuedCertificates,
  verifyCertificateByCodeRpc,
  CertificateVerifierClient,
} from '@/modules/certificates';
import { listCatalogBadgesWithStatus } from '@/modules/gamification';

export default async function VerifyByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [allCertificates, initialVerification, badges] = await Promise.all([
    listIssuedCertificates(10),
    verifyCertificateByCodeRpc(code),
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
