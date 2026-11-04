import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../../src/app';
import { pino } from 'pino';
import {
  createBusiness,
  createTestApp,
  grantConsent,
  registerAndLogin,
  uniqueEmail,
} from './support';

const { app, prisma } = createTestApp();

afterAll(() => prisma.$disconnect());

describe('banco', () => {
  it('migrações criaram as tabelas e as trilhas', async () => {
    expect(await prisma.track.count()).toBe(4);
  });

  it('o healthcheck consulta o banco', async () => {
    await request(app).get('/health').expect(200);
    const down = createApp({
      logger: pino({ level: 'silent' }),
      checkDatabase: async () => {
        throw new Error('fora do ar');
      },
    });
    const res = await request(down).get('/health').expect(503);
    expect(res.body.error.code).toBe('database_unavailable');
  });

  it('consents e audit_log recusam UPDATE e DELETE', async () => {
    const { agent } = await registerAndLogin(app);
    const businessId = await createBusiness(agent);
    await grantConsent(agent, businessId, 'ASSISTED_INGESTION');
    for (const sql of [
      'UPDATE consents SET scope = "x"',
      'DELETE FROM consents',
      'UPDATE audit_log SET action = "x"',
      'DELETE FROM audit_log',
    ]) {
      await expect(prisma.$executeRawUnsafe(sql)).rejects.toThrow(/só de inserção/);
    }
  });
});

describe('autenticação', () => {
  it('guarda só o hash da senha e do token, em cookie httpOnly', async () => {
    const email = uniqueEmail();
    const password = 'senha-bem-longa';
    await request(app).post('/auth/register').send({ name: 'A', email, password }).expect(201);
    const login = await request(app).post('/auth/login').send({ email, password }).expect(200);

    const cookie = String(login.headers['set-cookie']);
    expect(cookie).toMatch(/gig_session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);

    const token = /gig_session=([^;]+)/.exec(cookie)?.[1] ?? '';
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      include: { sessions: true },
    });
    expect(user.passwordHash).toMatch(/^\$argon2/);
    expect(user.sessions[0]?.tokenHash).not.toBe(token);
    expect(login.body.passwordHash).toBeUndefined();
  });

  it('responde igual para senha errada e e-mail inexistente', async () => {
    const { email } = await registerAndLogin(app);
    const wrong = await request(app)
      .post('/auth/login')
      .send({ email, password: 'senha-errada-aqui' })
      .expect(401);
    const unknown = await request(app)
      .post('/auth/login')
      .send({ email: uniqueEmail(), password: 'senha-errada-aqui' })
      .expect(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it('recusa e-mail repetido e senha curta', async () => {
    const { email } = await registerAndLogin(app);
    await request(app)
      .post('/auth/register')
      .send({ name: 'B', email, password: 'senha-bem-longa' })
      .expect(409);
    await request(app)
      .post('/auth/register')
      .send({ name: 'B', email: uniqueEmail(), password: 'curta' })
      .expect(400);
  });

  it('a renovação invalida o token anterior, e o encerramento invalida o atual', async () => {
    const { email, password } = await registerAndLogin(app);
    const login = await request(app).post('/auth/login').send({ email, password });
    const oldCookie = String(login.headers['set-cookie']).split(';')[0] ?? '';
    const refreshed = await request(app).post('/auth/refresh').set('Cookie', oldCookie).expect(204);
    const newCookie = String(refreshed.headers['set-cookie']).split(';')[0] ?? '';

    await request(app).get('/businesses').set('Cookie', oldCookie).expect(401);
    await request(app).get('/businesses').set('Cookie', newCookie).expect(200);
    await request(app).post('/auth/logout').set('Cookie', newCookie).expect(204);
    await request(app).get('/businesses').set('Cookie', newCookie).expect(401);
  });

  it('sessão vencida e token aleatório não entram', async () => {
    const { email, password, userId } = await registerAndLogin(app);
    const login = await request(app).post('/auth/login').send({ email, password });
    const cookie = String(login.headers['set-cookie']).split(';')[0] ?? '';
    await prisma.session.updateMany({ where: { userId }, data: { expiresAt: new Date(0) } });
    await request(app).get('/businesses').set('Cookie', cookie).expect(401);
    await request(app)
      .get('/businesses')
      .set('Cookie', `gig_session=${randomBytes(32).toString('base64url')}`)
      .expect(401);
  });

  it('limita as tentativas de login', async () => {
    const limited = createTestApp({ loginLimit: 2 });
    const body = { email: uniqueEmail(), password: 'senha-errada-aqui' };
    await request(limited.app).post('/auth/login').send(body).expect(401);
    await request(limited.app).post('/auth/login').send(body).expect(401);
    const res = await request(limited.app).post('/auth/login').send(body).expect(429);
    expect(res.body.error.code).toBe('too_many_requests');
    await limited.prisma.$disconnect();
  });
});

describe('limite por usuário', () => {
  it('conta por usuário, sem afetar outra pessoa no mesmo IP', async () => {
    const limited = createTestApp({ userLimit: 2 });
    const first = await registerAndLogin(limited.app);
    const second = await registerAndLogin(limited.app);
    await first.agent.get('/businesses').expect(200);
    await first.agent.get('/businesses').expect(200);
    const res = await first.agent.get('/businesses').expect(429);
    expect(res.body.error.code).toBe('too_many_requests');
    await second.agent.get('/businesses').expect(200);
    await limited.prisma.$disconnect();
  });
});

describe('isolamento entre negócios', () => {
  it('todas as rotas do negócio respondem 404 para quem não pertence a ele', async () => {
    const owner = await registerAndLogin(app);
    const stranger = await registerAndLogin(app);
    const businessId = await createBusiness(owner.agent);
    const consentId = await grantConsent(owner.agent, businessId, 'ASSISTED_INGESTION');
    const base = `/businesses/${businessId}`;

    await stranger.agent.get(`${base}/transactions`).expect(404);
    await stranger.agent.get(`${base}/forecast`).expect(404);
    await stranger.agent.get(`${base}/alerts`).expect(404);
    await stranger.agent.get(`${base}/commitments`).expect(404);
    await stranger.agent.get(`${base}/consents`).expect(404);
    await stranger.agent
      .post(`${base}/statements?format=csv`)
      .set('Content-Type', 'text/csv')
      .send('data;descricao;valor\n05/10/2026;x;1,00\n')
      .expect(404);
    await stranger.agent
      .put(`${base}/cash-balance`)
      .send({ amount: '1.00', date: '2026-01-01' })
      .expect(404);
    await stranger.agent.delete(`/consents/${consentId}`).expect(404);
    await stranger.agent
      .post('/consents')
      .send({ businessId, purpose: 'OPEN_FINANCE', scope: 'x' })
      .expect(404);
    await stranger.agent.post('/tracks/1/progress').send({ businessId, percent: 10 }).expect(404);

    const list = await stranger.agent.get('/businesses').expect(200);
    expect(list.body.businesses).toEqual([]);
  });

  it('sem sessão, as rotas respondem 401', async () => {
    await request(app).get('/businesses').expect(401);
    await request(app).get('/tracks').expect(401);
    await request(app).get('/businesses/1/forecast').expect(401);
  });

  it('o contador só envia extrato, e sair do negócio revoga o acesso', async () => {
    const owner = await registerAndLogin(app);
    const accountant = await registerAndLogin(app);
    const businessId = await createBusiness(owner.agent);
    const base = `/businesses/${businessId}`;
    await grantConsent(owner.agent, businessId, 'ASSISTED_INGESTION');
    await owner.agent.post(`${base}/members`).send({ email: accountant.email }).expect(201);
    await owner.agent.post(`${base}/members`).send({ email: accountant.email }).expect(409);

    const csv = 'data;descricao;valor\n05/10/2026;Venda;100,00\n';
    const upload = () =>
      accountant.agent
        .post(`${base}/statements?format=csv`)
        .set('Content-Type', 'text/csv')
        .send(csv);
    await upload().expect(201);

    await accountant.agent.get(`${base}/transactions`).expect(404);
    await accountant.agent.get(`${base}/forecast`).expect(404);
    await accountant.agent.post(`${base}/members`).send({ email: owner.email }).expect(404);
    await accountant.agent
      .post('/consents')
      .send({ businessId, purpose: 'OPEN_FINANCE', scope: 'x' })
      .expect(404);

    await owner.agent.delete(`${base}/members/${accountant.userId}`).expect(204);
    await upload().expect(404);
    await owner.agent.delete(`${base}/members/${owner.userId}`).expect(404);
  });

  it('valida o saldo como texto decimal', async () => {
    const { agent } = await registerAndLogin(app);
    const businessId = await createBusiness(agent);
    const url = `/businesses/${businessId}/cash-balance`;
    await agent.put(url).send({ amount: 1000, date: '2026-01-01' }).expect(400);
    await agent.put(url).send({ amount: '1000.00', date: '2999-01-01' }).expect(400);
    await agent.put(url).send({ amount: '-50.25', date: '2026-01-01' }).expect(204);
    const saved = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
    expect(saved.cashBalance?.toFixed(2)).toBe('-50.25');
  });
});

describe('consentimentos e auditoria', () => {
  it('revogar preserva o histórico e é idempotente', async () => {
    const { agent, userId } = await registerAndLogin(app);
    const businessId = await createBusiness(agent);
    const consentId = await grantConsent(agent, businessId, 'ASSISTED_INGESTION');

    await agent.delete(`/consents/${consentId}`).expect(204);
    await agent.delete(`/consents/${consentId}`).expect(204);

    const res = await agent.get(`/businesses/${businessId}/consents`).expect(200);
    expect(res.body.consents.map((c: { status: string }) => c.status)).toEqual([
      'GRANTED',
      'REVOKED',
    ]);

    const log = await prisma.auditLog.findMany({ where: { businessId, actorUserId: userId } });
    const actions = log.map((entry) => entry.action);
    expect(actions).toEqual(expect.arrayContaining(['consent.grant', 'consent.revoke']));

    const events = await prisma.usageEvent.findMany({ where: { businessId } });
    expect(events.map((e) => e.event)).toEqual(['CONSENT_GRANTED']);
  });

  it('recusa expiração no passado e finalidade desconhecida', async () => {
    const { agent } = await registerAndLogin(app);
    const businessId = await createBusiness(agent);
    await agent
      .post('/consents')
      .send({ businessId, purpose: 'OPEN_FINANCE', scope: 'x', expiresAt: '2020-01-01T00:00:00Z' })
      .expect(400);
    await agent.post('/consents').send({ businessId, purpose: 'VENDER', scope: 'x' }).expect(400);
  });

  it('o consentimento vencido deixa de permitir a importação', async () => {
    const { agent } = await registerAndLogin(app);
    const businessId = await createBusiness(agent);
    const consentId = await grantConsent(agent, businessId, 'ASSISTED_INGESTION', {
      expiresAt: new Date(Date.now() + 1500).toISOString(),
    });
    expect(consentId).toBeGreaterThan(0);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    await agent
      .post(`/businesses/${businessId}/statements?format=csv`)
      .set('Content-Type', 'text/csv')
      .send('data;descricao;valor\n05/10/2026;x;1,00\n')
      .expect(403);
  });
});
