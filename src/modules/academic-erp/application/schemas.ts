import { z } from 'zod';

export const attendanceStatusSchema = z.enum(['present', 'late', 'absent', 'excused']);

export const gradeRectificationRequestSchema = z.object({
  submissionId: z.string().min(1),
  previousScore: z.number().min(0).max(100),
  newScore: z.number().min(0).max(100),
  justificationReason: z
    .string()
    .min(10, 'La justificación de rectificación de acta requiere mínimo 10 caracteres.')
    .max(300),
});

export type GradeRectificationRequestInput = z.infer<typeof gradeRectificationRequestSchema>;
