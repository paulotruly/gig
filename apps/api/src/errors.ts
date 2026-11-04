export function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function notFoundError(): HttpError {
  return new HttpError(404, 'not_found', 'Recurso não encontrado.');
}
