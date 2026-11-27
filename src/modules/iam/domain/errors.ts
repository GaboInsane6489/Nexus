export class IamDomainError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'IamDomainError';
    this.code = code;
  }
}
