// API Pública del Módulo Certificates (Nivel 4) — Gobernado por nexus-architecture-guard
export type {
  CertificateVerificationStatus,
  CertificateSnapshotEntity,
  CertificateVerificationPayload,
} from './domain/entities';
export { isEligibleForCertificateIssuance } from './domain/rules';
export {
  listIssuedCertificates,
  verifyCertificateByCodeRpc,
} from './infrastructure/queries';
export { verifyCertificateAction } from './presentation/actions';
export { CertificateVerifierClient } from './presentation/components/CertificateVerifierClient';
