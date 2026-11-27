import React from 'react';
import { getCurrentUserProfile } from '@/modules/iam';
import {
  listIssuedCertificates,
  verifyCertificateByCodeRpc,
  CertificateVerifierClient,
} from '@/modules/certificates';
import {
  listCatalogBadgesWithStatus,
  getUserGamificationSummary,
} from '@/modules/gamification';

interface VerifyPortalPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function VerifyPortalPage({ searchParams }: VerifyPortalPageProps) {
  const { code } = await searchParams;
  const trimmedCode = code?.trim();
  const currentUser = await getCurrentUserProfile();

  const [allCertificates, initialVerification, badges, gamificationSummary] =
    await Promise.all([
      listIssuedCertificates(10),
      trimmedCode ? verifyCertificateByCodeRpc(trimmedCode) : Promise.resolve(null),
      listCatalogBadgesWithStatus(currentUser?.id),
      currentUser
        ? getUserGamificationSummary(currentUser.id)
        : Promise.resolve(null),
    ]);

  return (
    <CertificateVerifierClient
      initialPayload={initialVerification}
      allCertificates={allCertificates}
      badges={badges}
      userRole={currentUser?.role ?? null}
      initialGamification={gamificationSummary}
    />
  );
}
