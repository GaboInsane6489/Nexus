'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';

export interface IssuedCertificateResult {
  certificateId: string;
  verificationCode: string;
  signatureHash: string;
}

export async function issueCertificateOnCompletionRpc(
  enrollmentId: string
): Promise<
  | { ok: true; data: IssuedCertificateResult }
  | { ok: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    'rpc_issue_certificate_on_completion',
    {
      p_enrollment_id: enrollmentId,
    }
  );

  if (error || !data || typeof data !== 'object') {
    return {
      ok: false,
      error: error?.message ?? 'No se pudo emitir el certificado.',
    };
  }

  const payload = data as Record<string, unknown>;
  return {
    ok: true,
    data: {
      certificateId: String(payload.certificate_id ?? ''),
      verificationCode: String(payload.verification_code ?? ''),
      signatureHash: String(payload.signature_hash ?? ''),
    },
  };
}

export async function revokeCertificateMutation(
  certificateId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('certificates')
    .update({
      is_revoked: true,
      revoked_reason: reason,
    })
    .eq('id', certificateId)
    .select('id')
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: 'Certificado no encontrado.' };
  }

  return { ok: true };
}
