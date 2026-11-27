import { z } from 'zod';

export const paymentMethodSchema = z.enum([
  'stripe',
  'mercadopago',
  'bank_transfer',
  'scholarship',
]);

export const validateCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Ingresa un código de cupón o beca válido.')
    .max(32)
    .transform((v) => v.toUpperCase()),
});

export const verifyCohortEligibilitySchema = z.object({
  cohortId: z.string().uuid('Selecciona una cohorte válida.'),
  studentId: z.string().uuid().optional(),
});

export const submitOrderSchema = z.object({
  cohortId: z.string().uuid('Selecciona una cohorte válida.'),
  paymentMethod: paymentMethodSchema,
  couponCode: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((v) => (v && v.length > 0 ? v.toUpperCase() : undefined)),
  receiptUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export const approveOrderSchema = z.object({
  orderId: z.string().uuid('ID de orden inválido.'),
});

export const createCohortSchema = z.object({
  courseId: z.string().uuid('Selecciona un curso válido.'),
  termId: z.string().uuid('Selecciona un período académico válido.'),
  code: z
    .string()
    .trim()
    .min(2, 'El código de cohorte debe tener al menos 2 caracteres.')
    .max(32)
    .transform((v) => v.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(3, 'El nombre de la cohorte debe tener al menos 3 caracteres.')
    .max(120),
  scheduleLabel: z
    .string()
    .trim()
    .min(3, 'Ingresa un horario válido.')
    .max(120),
  maxCapacity: z.coerce
    .number()
    .int('La capacidad debe ser un número entero.')
    .min(1, 'La capacidad mínima es 1 estudiante.')
    .max(500, 'La capacidad máxima es 500 estudiantes.'),
  instructorId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .pipe(z.string().uuid('ID de docente inválido.').optional()),
});

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'El código debe tener al menos 3 caracteres.')
    .max(32)
    .transform((v) => v.toUpperCase()),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce
    .number()
    .positive('El valor del descuento debe ser mayor a 0.')
    .max(10000),
  maxUses: z.coerce
    .number()
    .int('El máximo de usos debe ser entero.')
    .positive('El máximo de usos debe ser mayor a 0.')
    .optional(),
  validUntil: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type VerifyCohortEligibilityInput = z.infer<typeof verifyCohortEligibilitySchema>;
export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;
export type ApproveOrderInput = z.infer<typeof approveOrderSchema>;
export type CreateCohortInput = z.input<typeof createCohortSchema>;
export type CreateCohortOutput = z.output<typeof createCohortSchema>;
export type CreateCouponInput = z.input<typeof createCouponSchema>;
export type CreateCouponOutput = z.output<typeof createCouponSchema>;
