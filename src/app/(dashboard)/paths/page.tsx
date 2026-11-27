import React from 'react';
import { getCurrentUserProfile } from '@/modules/iam';
import {
  getCurriculumDagSnapshot,
  listUserCompletedCourseIds,
  CatalogDagExplorerClient,
} from '@/modules/catalog';

export default async function LearningPathsDagPage() {
  const currentUser = await getCurrentUserProfile();
  const [snapshot, completedCourseIds] = await Promise.all([
    getCurriculumDagSnapshot(),
    currentUser ? listUserCompletedCourseIds(currentUser.id) : Promise.resolve([]),
  ]);

  return (
    <CatalogDagExplorerClient
      terms={snapshot.terms}
      paths={snapshot.paths}
      courses={snapshot.courses}
      edges={snapshot.edges}
      userRole={currentUser?.role ?? 'student'}
      completedCourseIds={completedCourseIds}
    />
  );
}
