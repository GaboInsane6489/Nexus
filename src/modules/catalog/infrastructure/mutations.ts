'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type { AddPrerequisiteEdgeInput } from '../application/schemas';

export async function insertPrerequisiteEdgeRecord(
  input: AddPrerequisiteEdgeInput
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('course_prerequisites').insert({
    course_id: input.courseId,
    required_course_id: input.requiredCourseId,
    min_grade_required: input.minGradeRequired,
  });

  if (error) {
    throw new Error(error.message);
  }
}
