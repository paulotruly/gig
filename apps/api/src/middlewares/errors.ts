import type { NextFunction, Request, Response } from 'express';
import { errorBody, HttpError } from '../errors';

export function notFound(_req: Request, res: Response) {
  res.status(404).json(errorBody('not_found', 'Recurso não encontrado.'));
}

function bodyParserFailure(err: unknown): { status: number; code: string; message: string } | null {
  const type = (err as { type?: unknown } | null)?.type;
  if (type === 'entity.parse.failed') {
    return {
      status: 400,
      code: 'invalid_json',
      message: 'O corpo da requisição não é um JSON válido.',
    };
  }
  if (type === 'entity.too.large') {
    return {
      status: 413,
      code: 'payload_too_large',
      message: 'O corpo da requisição é grande demais.',
    };
  }
  if (typeof type === 'string' && type.includes('.unsupported')) {
    return { status: 415, code: 'unsupported_media', message: 'Formato de conteúdo não aceito.' };
  }
  return null;
}

// O Express só reconhece o middleware de erro pelos quatro parâmetros.
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json(errorBody(err.code, err.message));
    return;
  }
  const failure = bodyParserFailure(err);
  if (failure) {
    res.status(failure.status).json(errorBody(failure.code, failure.message));
    return;
  }
  // Só o tipo do erro vai para o log: a mensagem pode conter dados pessoais (regra 7).
  req.log.error({ errorName: err instanceof Error ? err.name : typeof err }, 'erro interno');
  res.status(500).json(errorBody('internal_error', 'Erro interno.'));
}
