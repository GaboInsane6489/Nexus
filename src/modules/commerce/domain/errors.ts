export class CommerceDomainError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'CommerceDomainError';
    this.code = code;
  }
}
