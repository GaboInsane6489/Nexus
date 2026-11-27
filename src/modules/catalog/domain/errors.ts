export class CatalogDomainError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'CatalogDomainError';
    this.code = code;
  }
}
