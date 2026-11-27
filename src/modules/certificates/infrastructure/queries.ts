'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type {
  CertificateSnapshotEntity,
  CertificateVerificationPayload,
} from '../domain/entities';

export async function listIssuedCertificates(
  limit = 20
): Promise<CertificateSnapshotEntity[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('certificates')
    .select(
      'id, verification_code, student_full_name_snapshot, student_document_snapshot, course_code_snapshot, course_title_snapshot, academic_credits_snapshot, final_grade_snapshot, attendance_pct_snapshot, signature_hash, is_revoked, revoked_reason, issued_at'
    )
    .order('issued_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    verificationCode: row.verification_code,
    studentFullName: row.student_full_name_snapshot,
    studentDocument: row.student_document_snapshot,
    courseCode: row.course_code_snapshot,
    courseTitle: row.course_title_snapshot,
    academicCredits: row.academic_credits_snapshot,
    finalGrade: Number(row.final_grade_snapshot),
    attendancePct: Number(row.attendance_pct_snapshot),
    signatureHash: row.signature_hash,
    isRevoked: row.is_revoked,
    revokedReason: row.revoked_reason,
    issuedAt: row.issued_at,
  }));
}

export async function verifyCertificateByCodeRpc(
  verificationCode: string
): Promise<CertificateVerificationPayload> {
  const supabase = await createSupabaseServerClient();
  const cleanCode = verificationCode.trim().toUpperCase();

  const { data, error } = await supabase.rpc('fn_verify_certificate_by_code', {
    p_verification_code: cleanCode,
  });

  if (error || !data || typeof data !== 'object') {
    return {
      found: false,
      status: 'NOT_FOUND',
      verificationCode: cleanCode,
    };
  }

  const p = data as Record<string, unknown>;
  const found = Boolean(p.found);
  const status =
    (p.status as CertificateVerificationPayload['status']) ?? 'NOT_FOUND';

  if (!found) {
    return {
      found: false,
      status: 'NOT_FOUND',
      verificationCode: cleanCode,
    };
  }

  return {
    found: true,
    status,
    verificationCode: String(p.verification_code ?? cleanCode),
    certificate: {
      id: String(p.verification_code ?? cleanCode),
      verificationCode: String(p.verification_code ?? cleanCode),
      studentFullName: String(p.student_full_name ?? ''),
      studentDocument: String(p.student_document ?? ''),
      courseCode: String(p.course_code ?? ''),
      courseTitle: String(p.course_title ?? ''),
      academicCredits: Number(p.academic_credits ?? 4),
      finalGrade: Number(p.final_grade ?? 0),
      attendancePct: Number(p.attendance_pct ?? 0),
      signatureHash: String(p.signature_hash ?? ''),
      isRevoked: Boolean(p.is_revoked),
      revokedReason: p.revoked_reason ? String(p.revoked_reason) : null,
      issuedAt: String(p.issued_at ?? ''),
    },
  };
}
