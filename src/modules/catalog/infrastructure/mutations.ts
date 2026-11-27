'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type {
  AddPrerequisiteEdgeInput,
  CreateAcademicTermOutput,
  CreateCourseModuleOutput,
  CreateCourseOutput,
  CreateLearningPathOutput,
  CreateLessonOutput,
} from '../application/schemas';

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

export async function deletePrerequisiteEdgeRecord(edgeId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('course_prerequisites').delete().eq('id', edgeId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function insertAcademicTermRecord(
  input: CreateAcademicTermOutput
): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('academic_terms')
    .insert({
      code: input.code,
      name: input.name,
      start_date: input.startDate,
      end_date: input.endDate,
      status: input.status,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear el período académico.');
  }

  return { id: data.id };
}

export async function insertLearningPathRecord(
  input: CreateLearningPathOutput
): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('learning_paths')
    .insert({
      slug: input.slug,
      faculty_name: input.facultyName,
      title: input.title,
      summary: input.summary,
      icon_key: input.iconKey,
      price_bundle: input.priceBundle,
      estimated_weeks: input.estimatedWeeks,
      is_published: input.isPublished,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear la ruta de aprendizaje.');
  }

  if (input.courseIds && input.courseIds.length > 0) {
    const items = input.courseIds.map((courseId, index) => ({
      learning_path_id: data.id,
      course_id: courseId,
      step_order: index + 1,
      is_mandatory: true,
    }));

    const { error: itemsError } = await supabase.from('learning_path_items').insert(items);
    if (itemsError) {
      throw new Error(itemsError.message);
    }
  }

  return { id: data.id };
}

export async function insertCourseRecord(
  input: CreateCourseOutput
): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('courses')
    .insert({
      code: input.code,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      level_label: input.levelLabel,
      price_individual: input.priceIndividual,
      academic_credits: input.academicCredits,
      total_hours: input.totalHours,
      min_passing_grade: input.minPassingGrade,
      min_attendance_pct: input.minAttendancePct,
      is_published: input.isPublished,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear el curso.');
  }

  return { id: data.id };
}

export async function insertCourseModuleRecord(
  input: CreateCourseModuleOutput
): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('course_modules')
    .insert({
      course_id: input.courseId,
      title: input.title,
      sort_order: input.sortOrder,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear el módulo.');
  }

  return { id: data.id };
}

export async function insertLessonRecord(
  input: CreateLessonOutput
): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      module_id: input.moduleId,
      title: input.title,
      content_type: input.contentType,
      duration_minutes: input.durationMinutes,
      is_free_preview: input.isFreePreview,
      sort_order: input.sortOrder,
      video_url: input.videoUrl ? input.videoUrl : null,
      markdown_body: input.markdownBody ? input.markdownBody : null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear la lección.');
  }

  return { id: data.id };
}
