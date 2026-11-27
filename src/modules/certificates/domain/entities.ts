export type CertificateVerificationStatus = 'VALID' | 'REVOKED' | 'NOT_FOUND';

export interface CertificateSnapshotEntity {
  id: string;
  verificationCode: string;
  studentFullName: string;
  studentDocument: string;
  courseCode: string;
  courseTitle: string;
  academicCredits: number;
  finalGrade: number;
  attendancePct: number;
  signatureHash: string;
  isRevoked: boolean;
  revokedReason: string | null;
  issuedAt: string;
}

export interface CertificateVerificationPayload {
  found: boolean;
  status: CertificateVerificationStatus;
  verificationCode: string;
  certificate?: CertificateSnapshotEntity;
}
