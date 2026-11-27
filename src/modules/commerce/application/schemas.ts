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

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type VerifyCohortEligibilityInput = z.infer<typeof verifyCohortEligibilitySchema>;
