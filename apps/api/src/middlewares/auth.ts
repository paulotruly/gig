import { createHash } from 'node:crypto';
import type { MemberRole, PrismaClient } from '@gig/db';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { HttpError, notFoundError } from '../errors';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: number;
    sessionId?: number;
    rawBody?: Buffer;
  }
}

export const SESSION_COOKIE = 'gig_session';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function requireAuth(prisma: PrismaClient): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    if (typeof token === 'string' && token.length > 0) {
      const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) } });
      if (session && !session.revokedAt && session.expiresAt > new Date()) {
        req.userId = session.userId;
        req.sessionId = session.id;
        next();
        return;
      }
    }
    next(new HttpError(401, 'unauthenticated', 'É preciso entrar para acessar este recurso.'));
  };
}

export function currentUserId(req: Request): number {
  if (req.userId === undefined) {
    throw new HttpError(401, 'unauthenticated', 'É preciso entrar para acessar este recurso.');
  }
  return req.userId;
}

// Sem vínculo com o papel exigido, responde 404 para não revelar que o negócio existe.
export async function requireBusinessRole(
  prisma: PrismaClient,
  userId: number,
  businessId: number,
  roles: readonly MemberRole[] = ['OWNER'],
): Promise<void> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: { role: true },
  });
  if (!member || !roles.includes(member.role)) {
    throw notFoundError();
  }
}
