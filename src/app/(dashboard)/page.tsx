import React from 'react';
import {
  getCurriculumDagSnapshot,
  getActiveAcademicTerm,
} from '@/modules/catalog';
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from '@/shared/lib/supabase/server';
import { HomeExplorerClient } from './HomeExplorerClient';

async function getOpenCohortsCount(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from('cohorts')
      .select('id', { count: 'exact', head: true })
      .in('status', ['upcoming', 'active']);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  const [snapshot, activeTerm, openCohortsCount] = await Promise.all([
    getCurriculumDagSnapshot(),
    getActiveAcademicTerm(),
    getOpenCohortsCount(),
  ]);

  return (
    <HomeExplorerClient
      paths={snapshot.paths}
      courses={snapshot.courses}
      activeTerm={activeTerm}
      openCohortsCount={openCohortsCount}
    />
  );
}
