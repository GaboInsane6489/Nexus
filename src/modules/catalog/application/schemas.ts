import { z } from 'zod';

export const addPrerequisiteEdgeSchema = z.object({
  courseId: z.string().uuid('Selecciona un curso destino válido.'),
  requiredCourseId: z.string().uuid('Selecciona un curso prerrequisito válido.'),
  minGradeRequired: z
    .number()
    .min(0, 'La nota mínima no puede ser menor a 0.')
    .max(100, 'La nota mínima no puede superar 100.'),
});

export type AddPrerequisiteEdgeInput = z.infer<typeof addPrerequisiteEdgeSchema>;
