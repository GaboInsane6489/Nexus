import React from 'react';
import { getCurrentUserProfile, ProfileViewClient } from '@/modules/iam';

export default async function ProfilePage() {
  const profile = await getCurrentUserProfile();
  return <ProfileViewClient initialProfile={profile} />;
}
