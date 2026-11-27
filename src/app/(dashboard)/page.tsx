import React from 'react';
import { getCurriculumDagSnapshot } from '@/modules/catalog';
import { HomeExplorerClient } from './HomeExplorerClient';

export default async function HomePage() {
  const snapshot = await getCurriculumDagSnapshot();

  return (
    <HomeExplorerClient
      paths={snapshot.paths}
      courses={snapshot.courses}
    />
  );
}
