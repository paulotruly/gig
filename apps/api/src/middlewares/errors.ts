import type { NextFunction, Request, Response } from 'express';
import { errorBody } from '../errors';

export function notFound(_req: Request, res: Response) {
  res.status(404).json(errorBody('not_found', 'Recurso não encontrado.'));
}

function isInvalidJson(err: unknown): boolean {
  return err instanceof SyntaxError && (err as { type?: string }).type === 'entity.parse.failed';
}

// O Express só reconhece o middleware de erro pelos quatro parâmetros.
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (isInvalidJson(err)) {
    res.status(400).json(errorBody('invalid_json', 'O corpo da requisição não é um JSON válido.'));
    return;
  }
  // Só o tipo do erro vai para o log: a mensagem pode conter dados pessoais (regra 7).
  req.log.error({ errorName: err instanceof Error ? err.name : typeof err }, 'erro interno');
  res.status(500).json(errorBody('internal_error', 'Erro interno.'));
}
