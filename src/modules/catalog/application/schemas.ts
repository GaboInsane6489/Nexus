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

export const createAcademicTermSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'El código del período debe tener al menos 2 caracteres.')
      .max(32, 'El código del período no puede superar 32 caracteres.'),
    name: z
      .string()
      .trim()
      .min(3, 'El nombre del período debe tener al menos 3 caracteres.')
      .max(120, 'El nombre del período no puede superar 120 caracteres.'),
    startDate: z.string().min(1, 'La fecha de inicio es obligatoria.'),
    endDate: z.string().min(1, 'La fecha de fin es obligatoria.'),
    status: z
      .enum(['planning', 'enrollment_open', 'in_progress', 'closed'])
      .default('planning'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
    path: ['endDate'],
  });

export type CreateAcademicTermInput = z.input<typeof createAcademicTermSchema>;
export type CreateAcademicTermOutput = z.infer<typeof createAcademicTermSchema>;

export const createLearningPathSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, 'El slug debe tener al menos 2 caracteres.')
    .max(120, 'El slug no puede superar 120 caracteres.')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener minúsculas, números y guiones.'),
  facultyName: z
    .string()
    .trim()
    .min(2, 'El nombre de la facultad es obligatorio.')
    .max(120, 'El nombre de la facultad no puede superar 120 caracteres.'),
  title: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres.')
    .max(160, 'El título no puede superar 160 caracteres.'),
  summary: z
    .string()
    .trim()
    .min(10, 'El resumen debe tener al menos 10 caracteres.')
    .max(1000, 'El resumen no puede superar 1000 caracteres.'),
  iconKey: z.string().trim().min(1).max(64).default('layers'),
  priceBundle: z.number().min(0, 'El precio del paquete no puede ser negativo.'),
  estimatedWeeks: z
    .number()
    .int('Las semanas estimadas deben ser un número entero.')
    .min(1, 'La duración mínima es de 1 semana.')
    .max(260, 'La duración máxima es de 260 semanas.'),
  isPublished: z.boolean().default(true),
  courseIds: z.array(z.string().uuid('Curso inválido en la ruta.')).optional(),
});

export type CreateLearningPathInput = z.input<typeof createLearningPathSchema>;
export type CreateLearningPathOutput = z.infer<typeof createLearningPathSchema>;

export const createCourseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'El código del curso debe tener al menos 2 caracteres.')
    .max(32, 'El código del curso no puede superar 32 caracteres.'),
  slug: z
    .string()
    .trim()
    .min(2, 'El slug debe tener al menos 2 caracteres.')
    .max(120, 'El slug no puede superar 120 caracteres.')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener minúsculas, números y guiones.'),
  title: z
    .string()
    .trim()
    .min(3, 'El título del curso debe tener al menos 3 caracteres.')
    .max(160, 'El título del curso no puede superar 160 caracteres.'),
  summary: z
    .string()
    .trim()
    .min(10, 'El resumen del curso debe tener al menos 10 caracteres.')
    .max(1000, 'El resumen del curso no puede superar 1000 caracteres.'),
  levelLabel: z.string().trim().min(2).max(64).default('Intermedio'),
  priceIndividual: z.number().min(0, 'El precio individual no puede ser negativo.'),
  academicCredits: z.number().int().min(0).max(30).default(3),
  totalHours: z.number().int().min(1).max(1000).default(24),
  minPassingGrade: z.number().min(0).max(100).default(70),
  minAttendancePct: z.number().min(0).max(100).default(80),
  isPublished: z.boolean().default(true),
});

export type CreateCourseInput = z.input<typeof createCourseSchema>;
export type CreateCourseOutput = z.infer<typeof createCourseSchema>;

export const createCourseModuleSchema = z.object({
  courseId: z.string().uuid('Selecciona un curso válido.'),
  title: z
    .string()
    .trim()
    .min(2, 'El título del módulo debe tener al menos 2 caracteres.')
    .max(160, 'El título del módulo no puede superar 160 caracteres.'),
  sortOrder: z.number().int().min(1, 'El orden debe ser al menos 1.').default(1),
});

export type CreateCourseModuleInput = z.input<typeof createCourseModuleSchema>;
export type CreateCourseModuleOutput = z.infer<typeof createCourseModuleSchema>;

export const createLessonSchema = z.object({
  moduleId: z.string().uuid('Selecciona un módulo válido.'),
  title: z
    .string()
    .trim()
    .min(2, 'El título de la lección debe tener al menos 2 caracteres.')
    .max(160, 'El título de la lección no puede superar 160 caracteres.'),
  contentType: z
    .enum(['video', 'reading', 'resource', 'quiz_link'])
    .default('video'),
  durationMinutes: z
    .number()
    .int()
    .min(1, 'La duración mínima es de 1 minuto.')
    .max(600, 'La duración máxima es de 600 minutos.')
    .default(15),
  isFreePreview: z.boolean().default(false),
  sortOrder: z.number().int().min(1, 'El orden debe ser al menos 1.').default(1),
  videoUrl: z
    .string()
    .trim()
    .url('La URL de video no es válida.')
    .optional()
    .or(z.literal('')),
  markdownBody: z.string().optional(),
});

export type CreateLessonInput = z.input<typeof createLessonSchema>;
export type CreateLessonOutput = z.infer<typeof createLessonSchema>;

export const deletePrerequisiteSchema = z.object({
  edgeId: z.string().uuid('Identificador de prerrequisito inválido.'),
});

export type DeletePrerequisiteInput = z.infer<typeof deletePrerequisiteSchema>;
