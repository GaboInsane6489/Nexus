import type { LessonContentType, TermStatus } from '@/shared/types/database.types';

export type { LessonContentType, TermStatus };

export interface AcademicTermEntity {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: TermStatus;
}

export interface LearningPathEntity {
  id: string;
  slug: string;
  facultyName: string;
  title: string;
  summary: string;
  iconKey: string;
  priceBundle: number;
  estimatedWeeks: number;
  isPublished: boolean;
}

export interface LessonEntity {
  id: string;
  moduleId: string;
  title: string;
  contentType: LessonContentType;
  durationMinutes: number;
  isFreePreview: boolean;
  sortOrder: number;
}

export interface CourseModuleEntity {
  id: string;
  courseId: string;
  title: string;
  sortOrder: number;
  lessons: LessonEntity[];
}

export interface CourseEntity {
  id: string;
  code: string;
  slug: string;
  title: string;
  summary: string;
  levelLabel: string;
  priceIndividual: number;
  academicCredits: number;
  totalHours: number;
  minPassingGrade: number;
  minAttendancePct: number;
  isPublished: boolean;
  stepOrder?: number;
  modules: CourseModuleEntity[];
}

export interface CoursePrerequisiteEdge {
  id: string;
  courseId: string;
  requiredCourseId: string;
  minGradeRequired: number;
}

export type DagNodeState = 'completed' | 'unlocked' | 'locked';

export interface EvaluatedDagCourseNode extends CourseEntity {
  dagState: DagNodeState;
  missingPrerequisites: Array<{
    courseId: string;
    code: string;
    title: string;
    minGradeRequired: number;
  }>;
}
