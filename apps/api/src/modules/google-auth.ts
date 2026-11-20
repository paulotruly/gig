import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Router, type CookieOptions } from 'express';
import { z } from 'zod';
import { authProvidersResponse } from '@gig/shared/contracts';
import type { GoogleOAuth, RouterDeps } from '../deps';
import { HttpError } from '../errors';
import { audit } from '../http';
import { createSession, setSessionCookie } from './auth';

const ATTEMPT_COOKIE = 'gig_google_attempt';
const ATTEMPT_MS = 10 * 60 * 1000;
const attemptSchema = z.object({
  state: z.string().min(1),
  nonce: z.string().min(1),
  codeVerifier: z.string().min(43),
  expiresAt: z.number(),
});
const claimsSchema = z.object({
  iss: z.enum(['https://accounts.google.com', 'accounts.google.com']),
  aud: z.string(),
  exp: z.number(),
  nonce: z.string(),
  email_verified: z.literal(true),
  sub: z.string().min(1).max(255),
  email: z.email().max(191),
  // Conta Google pode não ter nome de perfil; nesse caso, usa a parte do e-mail antes do @.
  name: z.string().trim().max(120).optional(),
});

const googleOAuth: GoogleOAuth = {
  async exchangeCode({ code, codeVerifier, redirectUri, clientId, clientSecret }) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    });
    if (!response.ok) throw new Error('token_exchange_failed');
    return z.object({ id_token: z.string() }).parse(await response.json());
  },
};

export function googleAuthRouter(deps: RouterDeps): Router {
  const { config, prisma } = deps;
  const oauth = deps.googleOAuth ?? googleOAuth;
  const router = Router();
  const enabled = Boolean(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET);
  const baseUrl = config.APP_BASE_URL.replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    path: '/api/auth/google',
  };
  const sign = (value: string) =>
    createHmac('sha256', config.GOOGLE_CLIENT_SECRET!).update(value).digest();

  router.get('/auth/providers', (_req, res) => {
    res.json(authProvidersResponse.parse({ google: enabled }));
  });

  router.get('/auth/google', (_req, res) => {
    if (!enabled) throw new HttpError(404, 'google_disabled', 'Login com Google indisponível.');
    const attempt = {
      state: randomBytes(32).toString('base64url'),
      nonce: randomBytes(32).toString('base64url'),
      codeVerifier: randomBytes(32).toString('base64url'),
      expiresAt: Date.now() + ATTEMPT_MS,
    };
    const value = Buffer.from(JSON.stringify(attempt)).toString('base64url');
    res.cookie(ATTEMPT_COOKIE, `${value}.${sign(value).toString('base64url')}`, {
      ...cookieOptions,
      maxAge: ATTEMPT_MS,
    });
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: attempt.state,
      nonce: attempt.nonce,
      code_challenge_method: 'S256',
      code_challenge: createHash('sha256').update(attempt.codeVerifier).digest('base64url'),
    }).toString();
    res.redirect(url.toString());
  });

  router.get('/auth/google/callback', async (req, res) => {
    res.clearCookie(ATTEMPT_COOKIE, cookieOptions);
    let reason = 'invalid_attempt';
    try {
      if (!enabled || req.query.error) throw new Error();
      const cookie: unknown = req.cookies[ATTEMPT_COOKIE];
      if (typeof cookie !== 'string') throw new Error();
      const parts = cookie.split('.');
      if (parts.length !== 2) throw new Error();
      const value = parts[0]!;
      const signature = Buffer.from(parts[1]!, 'base64url');
      const expected = sign(value);
      if (signature.length !== expected.length || !timingSafeEqual(signature, expected))
        throw new Error();
      const attempt = attemptSchema.parse(
        JSON.parse(Buffer.from(value, 'base64url').toString('utf8')),
      );
      if (
        attempt.expiresAt <= Date.now() ||
        req.query.state !== attempt.state ||
        typeof req.query.code !== 'string' ||
        !req.query.code
      )
        throw new Error();
      reason = 'token_exchange_failed';
      const token = await oauth.exchangeCode({
        code: req.query.code,
        codeVerifier: attempt.codeVerifier,
        redirectUri,
        clientId: config.GOOGLE_CLIENT_ID!,
        clientSecret: config.GOOGLE_CLIENT_SECRET!,
      });
      reason = 'invalid_token';
      const jwt = token.id_token.split('.');
      if (jwt.length !== 3 || jwt.some((part) => !part)) throw new Error();
      // Recebido diretamente do endpoint do Google por TLS (OIDC Core §3.1.3.7).
      const claims = claimsSchema.parse(
        JSON.parse(Buffer.from(jwt[1]!, 'base64url').toString('utf8')),
      );
      if (
        claims.aud !== config.GOOGLE_CLIENT_ID ||
        claims.exp <= Date.now() / 1000 ||
        claims.nonce !== attempt.nonce
      )
        throw new Error();
      reason = 'account_or_session_failed';
      const session = await prisma.$transaction(async (tx) => {
        let user = await tx.user.findUnique({ where: { googleSub: claims.sub } });
        if (!user) {
          user = await tx.user.findUnique({ where: { email: claims.email.toLowerCase() } });
          if (user) {
            // Não substitui um vínculo existente com outra identidade Google.
            const linked = await tx.user.updateMany({
              where: { id: user.id, googleSub: null },
              data: { googleSub: claims.sub },
            });
            if (linked.count !== 1) throw new Error();
            await audit(tx, {
              actorUserId: user.id,
              action: 'user.google_link',
              targetType: 'google',
            });
          } else {
            user = await tx.user.create({
              data: {
                name: (claims.name || claims.email.split('@')[0]!).slice(0, 120),
                email: claims.email.toLowerCase(),
                googleSub: claims.sub,
              },
            });
            await audit(tx, {
              actorUserId: user.id,
              action: 'user.register',
              targetType: 'google',
            });
          }
        }
        await audit(tx, { actorUserId: user.id, action: 'session.login', targetType: 'google' });
        return createSession(tx, user.id);
      });
      setSessionCookie(config, res, session);
      res.redirect(config.APP_BASE_URL);
    } catch {
      req.log.warn({ reason }, 'Falha no login com Google.');
      res.redirect(`${baseUrl}/?erro=google`);
    }
  });
  return router;
}
