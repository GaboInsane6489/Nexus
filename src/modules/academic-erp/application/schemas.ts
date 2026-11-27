import { z } from 'zod';

export const attendanceStatusSchema = z.enum(['present', 'late', 'absent', 'excused']);

export const evaluationTypeSchema = z.enum([
  'exam',
  'quiz',
  'assignment',
  'project',
  'participation',
]);

export const gradeRectificationRequestSchema = z.object({
  submissionId: z.string().min(1),
  previousScore: z.number().min(0).max(100),
  newScore: z.number().min(0).max(100),
  justificationReason: z
    .string()
    .min(10, 'La justificación de rectificación de acta requiere mínimo 10 caracteres.')
    .max(300),
});

export const createSessionSchema = z.object({
  cohortId: z.string().uuid('ID de cohorte inválido.'),
  sessionNumber: z.coerce.number().int().min(1, 'El número de sesión debe ser mayor a 0.'),
  title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres.').max(200),
  startsAt: z.string().min(1, 'La fecha de inicio es obligatoria.'),
  endsAt: z.string().min(1, 'La fecha de fin es obligatoria.'),
  meetingOrRoomUrl: z.string().trim().max(500).optional().nullable(),
});

export const recordAttendanceSchema = z.object({
  sessionId: z.string().uuid('ID de sesión inválido.'),
  records: z
    .array(
      z.object({
        enrollmentId: z.string().uuid('ID de matrícula inválido.'),
        status: attendanceStatusSchema,
      })
    )
    .min(1, 'Debe registrar al menos un estudiante.'),
});

export const createEvaluationItemSchema = z.object({
  cohortId: z.string().uuid('ID de cohorte inválido.'),
  title: z.string().trim().min(2, 'El título debe tener al menos 2 caracteres.').max(200),
  type: evaluationTypeSchema,
  weightPct: z.coerce
    .number()
    .positive('El peso debe ser mayor a 0%.')
    .max(100, 'El peso no puede superar 100%.'),
  dueDate: z.string().min(1, 'La fecha límite es obligatoria.'),
  allowLateSubmission: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(1).default(1),
});

export const gradeSubmissionSchema = z.object({
  evaluationId: z.string().uuid('ID de evaluación inválido.'),
  enrollmentId: z.string().uuid('ID de matrícula inválido.'),
  score: z.coerce.number().min(0, 'La nota mínima es 0.').max(100, 'La nota máxima es 100.'),
  instructorFeedback: z.string().trim().max(2000).optional().nullable(),
});

export const closeCohortSchema = z.object({
  cohortId: z.string().uuid('ID de cohorte inválido.'),
});

export const rectifyGradeSchema = z.object({
  submissionId: z.string().uuid('ID de entrega inválido.'),
  previousScore: z.coerce.number().min(0).max(100),
  newScore: z.coerce.number().min(0).max(100),
  justificationReason: z
    .string()
    .trim()
    .min(10, 'La justificación de rectificación de acta requiere mínimo 10 caracteres.')
    .max(500),
  evidenceUrl: z.string().trim().max(500).optional().nullable(),
});

export const completeLessonSchema = z.object({
  enrollmentId: z.string().uuid('ID de matrícula inválido.'),
  lessonId: z.string().uuid('ID de lección inválido.'),
  watchedSeconds: z.coerce.number().int().min(0).default(0),
});

export type GradeRectificationRequestInput = z.infer<typeof gradeRectificationRequestSchema>;
export type CreateSessionInput = z.input<typeof createSessionSchema>;
export type CreateSessionOutput = z.output<typeof createSessionSchema>;
export type RecordAttendanceInput = z.input<typeof recordAttendanceSchema>;
export type RecordAttendanceOutput = z.output<typeof recordAttendanceSchema>;
export type CreateEvaluationItemInput = z.input<typeof createEvaluationItemSchema>;
export type CreateEvaluationItemOutput = z.output<typeof createEvaluationItemSchema>;
export type GradeSubmissionInput = z.input<typeof gradeSubmissionSchema>;
export type GradeSubmissionOutput = z.output<typeof gradeSubmissionSchema>;
export type CloseCohortInput = z.input<typeof closeCohortSchema>;
export type RectifyGradeInput = z.input<typeof rectifyGradeSchema>;
export type RectifyGradeOutput = z.output<typeof rectifyGradeSchema>;
export type CompleteLessonInput = z.input<typeof completeLessonSchema>;
export type CompleteLessonOutput = z.output<typeof completeLessonSchema>;
