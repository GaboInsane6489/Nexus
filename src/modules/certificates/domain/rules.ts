/**
 * Conjunción estricta de certificación de Nexus (Regla Inquebrantable #5):
 * Un certificado se emite si y solo si:
 *  1) finalGrade >= minPassingGrade
 *  2) attendancePct >= minAttendancePct
 *  3) isOrderPaid === true
 */
export function isEligibleForCertificateIssuance(params: {
  finalGrade: number;
  minPassingGrade: number;
  attendancePct: number;
  minAttendancePct: number;
  isOrderPaid: boolean;
}): boolean {
  return (
    params.isOrderPaid &&
    params.finalGrade >= params.minPassingGrade &&
    params.attendancePct >= params.minAttendancePct
  );
}
