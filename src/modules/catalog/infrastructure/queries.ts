'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type {
  AcademicTermEntity,
  CourseEntity,
  CourseModuleEntity,
  CoursePrerequisiteEdge,
  LearningPathEntity,
} from '../domain/entities';

export async function listAcademicTerms(limit = 20): Promise<AcademicTermEntity[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('academic_terms')
    .select('id, code, name, start_date, end_date, status')
    .order('start_date', { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
  }));
}

export async function listPublishedLearningPaths(limit = 20): Promise<LearningPathEntity[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('learning_paths')
    .select(
      'id, slug, faculty_name, title, summary, icon_key, price_bundle, estimated_weeks, is_published'
    )
    .eq('is_published', true)
    .order('created_at', { ascending: true })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    facultyName: row.faculty_name,
    title: row.title,
    summary: row.summary,
    iconKey: row.icon_key,
    priceBundle: Number(row.price_bundle),
    estimatedWeeks: row.estimated_weeks,
    isPublished: row.is_published,
  }));
}

export async function getCurriculumDagSnapshot(): Promise<{
  terms: AcademicTermEntity[];
  paths: LearningPathEntity[];
  courses: CourseEntity[];
  edges: CoursePrerequisiteEdge[];
}> {
  const supabase = await createSupabaseServerClient();

  const [termsRes, pathsRes, coursesRes, edgesRes, modulesRes, lessonsRes] = await Promise.all([
    supabase
      .from('academic_terms')
      .select('id, code, name, start_date, end_date, status')
      .order('start_date', { ascending: false })
      .limit(10),
    supabase
      .from('learning_paths')
      .select(
        'id, slug, faculty_name, title, summary, icon_key, price_bundle, estimated_weeks, is_published'
      )
      .eq('is_published', true)
      .order('created_at', { ascending: true })
      .limit(20),
    supabase
      .from('courses')
      .select(
        'id, code, slug, title, summary, level_label, price_individual, academic_credits, total_hours, min_passing_grade, min_attendance_pct, is_published'
      )
      .eq('is_published', true)
      .order('code', { ascending: true })
      .limit(50),
    supabase
      .from('course_prerequisites')
      .select('id, course_id, required_course_id, min_grade_required')
      .limit(100),
    supabase
      .from('course_modules')
      .select('id, course_id, title, sort_order')
      .order('sort_order', { ascending: true })
      .limit(100),
    supabase
      .from('lessons')
      .select('id, module_id, title, content_type, duration_minutes, is_free_preview, sort_order')
      .order('sort_order', { ascending: true })
      .limit(250),
  ]);

  const lessonsByModule = new Map<string, CourseModuleEntity['lessons']>();
  for (const l of lessonsRes.data ?? []) {
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push({
      id: l.id,
      moduleId: l.module_id,
      title: l.title,
      contentType: l.content_type,
      durationMinutes: l.duration_minutes,
      isFreePreview: l.is_free_preview,
      sortOrder: l.sort_order,
    });
    lessonsByModule.set(l.module_id, arr);
  }

  const modulesByCourse = new Map<string, CourseModuleEntity[]>();
  for (const m of modulesRes.data ?? []) {
    const arr = modulesByCourse.get(m.course_id) ?? [];
    arr.push({
      id: m.id,
      courseId: m.course_id,
      title: m.title,
      sortOrder: m.sort_order,
      lessons: lessonsByModule.get(m.id) ?? [],
    });
    modulesByCourse.set(m.course_id, arr);
  }

  const terms: AcademicTermEntity[] = (termsRes.data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
  }));

  const paths: LearningPathEntity[] = (pathsRes.data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    facultyName: r.faculty_name,
    title: r.title,
    summary: r.summary,
    iconKey: r.icon_key,
    priceBundle: Number(r.price_bundle),
    estimatedWeeks: r.estimated_weeks,
    isPublished: r.is_published,
  }));

  const courses: CourseEntity[] = (coursesRes.data ?? []).map((r, idx) => ({
    id: r.id,
    code: r.code,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    levelLabel: r.level_label,
    priceIndividual: Number(r.price_individual),
    academicCredits: r.academic_credits,
    totalHours: r.total_hours,
    minPassingGrade: Number(r.min_passing_grade),
    minAttendancePct: Number(r.min_attendance_pct),
    isPublished: r.is_published,
    stepOrder: idx + 1,
    modules: modulesByCourse.get(r.id) ?? [],
  }));

  const edges: CoursePrerequisiteEdge[] = (edgesRes.data ?? []).map((e) => ({
    id: e.id,
    courseId: e.course_id,
    requiredCourseId: e.required_course_id,
    minGradeRequired: Number(e.min_grade_required),
  }));

  return { terms, paths, courses, edges };
}
