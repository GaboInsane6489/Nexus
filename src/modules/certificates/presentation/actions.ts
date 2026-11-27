'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserProfile } from '@/modules/iam';
import type { ActionResult } from '@/shared/types/action-result';
import type { CertificateVerificationPayload } from '../domain/entities';
import { verifyCertificateByCodeRpc } from '../infrastructure/queries';
import {
  issueCertificateOnCompletionRpc,
  revokeCertificateMutation,
  type IssuedCertificateResult,
} from '../infrastructure/mutations';

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

export async function issueCertificateAction(
  enrollmentId: string
): Promise<ActionResult<IssuedCertificateResult>> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Debes iniciar sesión para emitir un certificado.',
      },
    };
  }

  const cleanEnrollmentId = enrollmentId.trim();
  if (!cleanEnrollmentId) {
    return {
      success: false,
      error: {
        code: 'INVALID_ENROLLMENT',
        message: 'El identificador de matrícula es obligatorio.',
      },
    };
  }

  const result = await issueCertificateOnCompletionRpc(cleanEnrollmentId);
  if (!result.ok) {
    return {
      success: false,
      error: {
        code: 'ISSUE_CERTIFICATE_FAILED',
        message: result.error,
      },
    };
  }

  revalidatePath('/verify');
  revalidatePath('/profile');

  return {
    success: true,
    data: result.data,
    message: 'Certificado emitido y firmado correctamente.',
  };
}

export async function revokeCertificateAction(
  certificateId: string,
  reason: string
): Promise<ActionResult<{ certificateId: string }>> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Debes iniciar sesión para revocar un certificado.',
      },
    };
  }

  if (profile.role !== 'coordinator' && profile.role !== 'super_admin') {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message:
          'Solo coordinadores o super administradores pueden revocar certificados.',
      },
    };
  }

  const cleanCertificateId = certificateId.trim();
  const cleanReason = reason.trim();

  if (!cleanCertificateId) {
    return {
      success: false,
      error: {
        code: 'INVALID_CERTIFICATE',
        message: 'El identificador del certificado es obligatorio.',
      },
    };
  }

  if (cleanReason.length < 5) {
    return {
      success: false,
      error: {
        code: 'INVALID_REASON',
        message: 'Debes indicar un motivo de revocación de al menos 5 caracteres.',
      },
    };
  }

  const result = await revokeCertificateMutation(
    cleanCertificateId,
    cleanReason
  );
  if (!result.ok) {
    return {
      success: false,
      error: {
        code: 'REVOKE_CERTIFICATE_FAILED',
        message: result.error,
      },
    };
  }

  revalidatePath('/verify');
  revalidatePath('/profile');

  return {
    success: true,
    data: { certificateId: cleanCertificateId },
    message: 'Certificado revocado correctamente.',
  };
}
