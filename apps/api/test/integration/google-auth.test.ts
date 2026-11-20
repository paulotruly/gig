import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { createTestApp, registerAndLogin, uniqueEmail } from './support';

const clientId = 'cliente-de-teste';
const exchangeCode = jest.fn();
const { app, prisma } = createTestApp({
  GOOGLE_CLIENT_ID: clientId,
  GOOGLE_CLIENT_SECRET: 'segredo-de-teste',
  googleOAuth: { exchangeCode },
});
afterAll(() => prisma.$disconnect());
beforeEach(() => exchangeCode.mockReset());

async function start() {
  const response = await request(app).get('/auth/google').expect(302);
  const url = new URL(response.headers.location!);
  const cookie = String(response.headers['set-cookie']).split(';')[0]!;
  const attempt = JSON.parse(
    Buffer.from(decodeURIComponent(cookie.split('=')[1]!).split('.')[0]!, 'base64url').toString(),
  );
  return { response, url, cookie, attempt };
}
function token(nonce: string, overrides: Record<string, unknown> = {}) {
  const claims = {
    iss: 'https://accounts.google.com',
    aud: clientId,
    exp: Math.floor(Date.now() / 1000) + 600,
    nonce,
    email_verified: true,
    sub: randomUUID(),
    email: uniqueEmail(),
    name: 'Pessoa de Teste',
    ...overrides,
  };
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  exchangeCode.mockResolvedValue({
    id_token: `${encode({ alg: 'RS256' })}.${encode(claims)}.${encode('assinatura-ficticia')}`,
  });
  return claims;
}
async function callback(cookie: string, state: string) {
  return request(app)
    .get('/auth/google/callback')
    .set('Cookie', cookie)
    .query({ state, code: 'codigo-de-teste' })
    .expect(302);
}

it('C1: inicia PKCE, state, nonce e cookie da tentativa', async () => {
  await request(app).get('/auth/providers').expect(200, { google: true });
  const { response, url, attempt } = await start();
  expect(url.origin).toBe('https://accounts.google.com');
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.get('state')).toBe(attempt.state);
  expect(url.searchParams.get('nonce')).toBe(attempt.nonce);
  expect(url.searchParams.get('scope')).toBe('openid email profile');
  expect(url.searchParams.get('redirect_uri')).toBe(
    'http://localhost:3001/api/auth/google/callback',
  );
  expect(url.searchParams.get('code_challenge')).toBe(
    createHash('sha256').update(attempt.codeVerifier).digest('base64url'),
  );
  const attributes = String(response.headers['set-cookie']).split('; ');
  expect(attributes).toEqual(
    expect.arrayContaining(['Max-Age=600', 'Path=/api/auth/google', 'HttpOnly', 'SameSite=Lax']),
  );
});

it('C2 e C5: cria conta sem senha, abre sessão, audita e recusa senha', async () => {
  const { cookie, attempt } = await start();
  const claims = token(attempt.nonce);
  const response = await callback(cookie, attempt.state);
  expect(response.headers.location).toBe('http://localhost:3001');
  const cookies = response.headers['set-cookie'] as unknown as string[];
  const sessionCookie = cookies.find((value) => value.startsWith('gig_session='))!.split(';')[0]!;
  await request(app).get('/auth/me').set('Cookie', sessionCookie).expect(200);
  expect(cookies.find((value) => value.startsWith('gig_google_attempt='))).toContain(
    'Expires=Thu, 01 Jan 1970',
  );
  const user = await prisma.user.findUniqueOrThrow({ where: { email: claims.email } });
  expect(user.passwordHash).toBeNull();
  expect(user.googleSub).toBe(claims.sub);
  expect(
    await prisma.auditLog.findMany({
      where: { actorUserId: user.id },
      select: { action: true, targetType: true },
    }),
  ).toEqual(
    expect.arrayContaining([
      { action: 'user.register', targetType: 'google' },
      { action: 'session.login', targetType: 'google' },
    ]),
  );
  expect(exchangeCode).toHaveBeenCalledWith(
    expect.objectContaining({
      codeVerifier: attempt.codeVerifier,
      redirectUri: 'http://localhost:3001/api/auth/google/callback',
    }),
  );
  const denied = await request(app)
    .post('/auth/login')
    .send({ email: claims.email, password: 'qualquer-senha' })
    .expect(401);
  expect(denied.body.error.code).toBe('invalid_credentials');
  const again = await start();
  token(again.attempt.nonce, { sub: claims.sub, email: claims.email });
  expect((await callback(again.cookie, again.attempt.state)).headers.location).toBe(
    'http://localhost:3001',
  );
  expect(await prisma.user.count({ where: { googleSub: claims.sub } })).toBe(1);
});

it('C3: vincula conta existente e mantém login por senha', async () => {
  const { email, password, userId } = await registerAndLogin(app);
  const { cookie, attempt } = await start();
  const claims = token(attempt.nonce, { email });
  expect((await callback(cookie, attempt.state)).headers.location).toBe('http://localhost:3001');
  expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).googleSub).toBe(
    claims.sub,
  );
  expect(
    await prisma.auditLog.count({
      where: { actorUserId: userId, action: 'user.google_link', targetType: 'google' },
    }),
  ).toBe(1);
  await request(app).post('/auth/login').send({ email, password }).expect(200);
});

it('usa o início do e-mail quando a conta Google não tem nome', async () => {
  const { cookie, attempt } = await start();
  const claims = token(attempt.nonce, { name: undefined });
  expect((await callback(cookie, attempt.state)).headers.location).toBe('http://localhost:3001');
  const user = await prisma.user.findUniqueOrThrow({ where: { email: claims.email } });
  expect(user.name).toBe(claims.email.split('@')[0]);
});

it.each([
  'state',
  'nonce',
  'aud',
  'email_verified',
  'exp',
  'iss',
  'cancelamento',
  'cookie',
  'troca',
])('C4: recusa %s inválido sem criar sessão', async (field) => {
  const { cookie, attempt } = await start();
  const overrides: Record<string, unknown> = {
    nonce: 'errado',
    aud: 'errado',
    email_verified: false,
    exp: 0,
    iss: 'https://invalido.test',
  };
  const claims = token(attempt.nonce, field in overrides ? { [field]: overrides[field] } : {});
  if (field === 'troca') exchangeCode.mockRejectedValue(new Error('falha'));
  const sessions = await prisma.session.count();
  const response = await request(app)
    .get('/auth/google/callback')
    .set('Cookie', field === 'cookie' ? 'gig_google_attempt=invalido' : cookie)
    .query({
      state: field === 'state' ? 'errado' : attempt.state,
      code: 'codigo',
      ...(field === 'cancelamento' ? { error: 'access_denied' } : {}),
    })
    .expect(302);
  expect(response.headers.location).toBe('http://localhost:3001/?erro=google');
  expect(String(response.headers['set-cookie'])).not.toContain('gig_session=');
  expect(await prisma.session.count()).toBe(sessions);
  expect(await prisma.user.findUnique({ where: { email: claims.email } })).toBeNull();
});

it.each([{}, { GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '' }, { GOOGLE_CLIENT_ID: clientId }])(
  'C6: desabilita provedor sem configuração completa (%j)',
  async (config) => {
    const disabled = createTestApp(config);
    try {
      await request(disabled.app).get('/auth/providers').expect(200, { google: false });
      const response = await request(disabled.app).get('/auth/google').expect(404);
      expect(response.body.error.code).toBe('google_disabled');
    } finally {
      await disabled.prisma.$disconnect();
    }
  },
);
