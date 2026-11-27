import React from 'react';
import {
  getCurriculumDagSnapshot,
  CatalogDagExplorerClient,
} from '@/modules/catalog';

export default async function LearningPathsDagPage() {
  const snapshot = await getCurriculumDagSnapshot();

  return (
    <CatalogDagExplorerClient
      terms={snapshot.terms}
      paths={snapshot.paths}
      courses={snapshot.courses}
      edges={snapshot.edges}
    />
  );
}
