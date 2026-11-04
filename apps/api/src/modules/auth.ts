import { randomBytes } from 'node:crypto';
import { Prisma } from '@gig/db';
import { loginBody, registerBody } from '@gig/shared/contracts';
import argon2 from 'argon2';
import { Router, type CookieOptions, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { RouterDeps } from '../deps';
import { errorBody, HttpError } from '../errors';
import { audit, parse } from '../http';
import { hashToken, SESSION_COOKIE } from '../middlewares/auth';

const SESSION_MS = 12 * 60 * 60 * 1000;
const ABSOLUTE_MS = 30 * 24 * 60 * 60 * 1000;

function invalidCredentials(): HttpError {
  return new HttpError(401, 'invalid_credentials', 'E-mail ou senha incorretos.');
}

export function authRouter({ prisma, config, authenticate }: RouterDeps): Router {
  const router = Router();
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    path: '/',
  };

  // Calculado uma vez: e-mail inexistente custa o mesmo tempo que senha errada.
  const dummyHash = argon2.hash(randomBytes(32).toString('hex'));

  async function openSession(res: Response, userId: number, absoluteExpiresAt: Date) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Math.min(Date.now() + SESSION_MS, absoluteExpiresAt.getTime()));
    await prisma.session.create({
      data: { userId, tokenHash: hashToken(token), expiresAt, absoluteExpiresAt },
    });
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
  }

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.LOGIN_LIMIT_PER_15_MINUTES,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(errorBody('too_many_requests', 'Muitas tentativas. Tente mais tarde.'));
    },
  });

  router.post('/auth/register', loginLimiter, async (req, res) => {
    const body = parse(registerBody, req.body);
    const passwordHash = await argon2.hash(body.password);
    try {
      const user = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email.toLowerCase(),
          passwordHash,
          phone: body.phone ?? null,
        },
        select: { id: true, name: true, email: true },
      });
      await audit(prisma, { actorUserId: user.id, action: 'user.register' });
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new HttpError(409, 'already_registered', 'E-mail ou telefone já cadastrado.');
      }
      throw err;
    }
  });

  router.post('/auth/login', loginLimiter, async (req, res) => {
    const body = parse(loginBody, req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    const valid = await argon2.verify(user?.passwordHash ?? (await dummyHash), body.password);
    if (!user || !valid) {
      throw invalidCredentials();
    }
    await openSession(res, user.id, new Date(Date.now() + ABSOLUTE_MS));
    await audit(prisma, { actorUserId: user.id, action: 'session.login' });
    res.json({ id: user.id, name: user.name, email: user.email });
  });

  router.post('/auth/refresh', authenticate, async (req: Request, res) => {
    const session = await prisma.session.findUniqueOrThrow({ where: { id: req.sessionId } });
    if (session.absoluteExpiresAt <= new Date()) {
      throw new HttpError(401, 'unauthenticated', 'A sessão expirou. Entre novamente.');
    }
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    await openSession(res, session.userId, session.absoluteExpiresAt);
    res.status(204).end();
  });

  router.post('/auth/logout', authenticate, async (req: Request, res) => {
    await prisma.session.update({ where: { id: req.sessionId }, data: { revokedAt: new Date() } });
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.status(204).end();
  });

  return router;
}
