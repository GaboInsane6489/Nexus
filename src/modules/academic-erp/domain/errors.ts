export class AcademicErpDomainError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AcademicErpDomainError';
    this.code = code;
  }
}
