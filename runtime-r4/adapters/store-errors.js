export class R4StoreError extends Error {
  constructor(code, status = 400, details = {}) {
    super(code);
    this.name = 'R4StoreError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
