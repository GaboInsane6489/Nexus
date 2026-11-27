'use server';

import type { ActionResult } from '@/shared/types/action-result';
import type { CertificateVerificationPayload } from '../domain/entities';
import { verifyCertificateByCodeRpc } from '../infrastructure/queries';

export async function verifyCertificateAction(
  code: string
): Promise<ActionResult<CertificateVerificationPayload>> {
  if (!code || code.trim().length < 4) {
    return {
      success: false,
      error: {
        code: 'INVALID_CODE',
        message: 'Ingresa un código de verificación válido (ej. NEX-2026-9F4K2M8X).',
      },
    };
  }

  const payload = await verifyCertificateByCodeRpc(code);
  return {
    success: true,
    data: payload,
  };
}
