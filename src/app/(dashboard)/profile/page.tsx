import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile, listUserCertificates, ProfileViewClient } from '@/modules/iam';

export default async function ProfilePage() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect('/login');
  }
  const certificates = await listUserCertificates(profile.id);
  return <ProfileViewClient initialProfile={profile} certificates={certificates} />;
}
