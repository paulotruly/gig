import { createPrisma, type PrismaClient } from '@gig/db';
import { pino } from 'pino';
import request from 'supertest';
import { apiRouters, createApp } from '../../src/app';
import { loadConfig } from '../../src/config';

export const databaseUrl = process.env.DATABASE_URL_TEST ?? '';
export const WHATSAPP_SECRET = 'segredo-de-teste';

let counter = 0;

export function createTestApp(
  overrides: { loginLimit?: number; userLimit?: number; partnerDb?: PrismaClient } = {},
) {
  const prisma = createPrisma(databaseUrl);
  const sent: { to: string; text: string }[] = [];
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: databaseUrl,
    WHATSAPP_APP_SECRET: WHATSAPP_SECRET,
    WHATSAPP_VERIFY_TOKEN: 'token-de-verificacao',
    LOGIN_LIMIT_PER_15_MINUTES: String(overrides.loginLimit ?? 100_000),
    RATE_LIMIT_PER_USER_PER_MINUTE: String(overrides.userLimit ?? 100_000),
  });
  const app = createApp({
    logger: pino({ level: 'silent' }),
    checkDatabase: () => prisma.$queryRaw`SELECT 1`,
    routers: apiRouters({
      prisma,
      partnerMetricsDb: overrides.partnerDb ?? prisma,
      config,
      whatsapp: {
        send: async (to, text) => {
          sent.push({ to, text });
        },
      },
    }),
  });
  return { app, prisma, sent };
}

export type TestApp = ReturnType<typeof createTestApp>['app'];

export function uniqueEmail(): string {
  counter += 1;
  return `pessoa-${process.pid}-${Date.now()}-${counter}@exemplo.test`;
}

export async function registerAndLogin(app: TestApp, extra: { phone?: string } = {}) {
  const agent = request.agent(app);
  const email = uniqueEmail();
  const password = 'senha-bem-longa';
  const registered = await agent
    .post('/auth/register')
    .send({ name: 'Pessoa de Teste', email, password, ...extra })
    .expect(201);
  await agent.post('/auth/login').send({ email, password }).expect(200);
  return { agent, email, password, userId: registered.body.id as number };
}

export async function createBusiness(
  agent: ReturnType<typeof request.agent>,
  body: object = {},
): Promise<number> {
  const res = await agent
    .post('/businesses')
    .send({ name: 'Negócio de Teste', type: 'MEI', ...body })
    .expect(201);
  return res.body.id as number;
}

export async function grantConsent(
  agent: ReturnType<typeof request.agent>,
  businessId: number,
  purpose: string,
  extra: object = {},
): Promise<number> {
  const res = await agent
    .post('/consents')
    .send({ businessId, purpose, scope: 'extratos da conta PJ', ...extra })
    .expect(201);
  return res.body.id as number;
}
