import { createHmac, randomBytes } from 'node:crypto';
import { createPrisma, type PrismaClient } from '@gig/db';
import { fromIsoDate } from '@gig/shared';
import { pino } from 'pino';
import request from 'supertest';
import { apiRouters, createApp } from '../../src/app';
import { loadConfig } from '../../src/config';
import {
  createBusiness,
  createTestApp,
  databaseUrl,
  grantConsent,
  registerAndLogin,
  WHATSAPP_SECRET,
} from './support';

const { app, prisma, sent } = createTestApp();

afterAll(() => prisma.$disconnect());

function webhookPayload(from: string, id = randomBytes(8).toString('hex')) {
  return JSON.stringify({
    entry: [{ changes: [{ value: { messages: [{ id, from, text: { body: 'previsão' } }] } }] }],
  });
}

function postWebhook(payload: string, secret = WHATSAPP_SECRET) {
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return request(app)
    .post('/webhooks/whatsapp')
    .set('Content-Type', 'application/json')
    .set('X-Hub-Signature-256', `sha256=${signature}`)
    .send(payload);
}

function randomPhone(): string {
  return `55${String(Date.now()).slice(-9)}${Math.floor(Math.random() * 90 + 10)}`;
}

async function addForecast(businessId: number) {
  const forecast = await prisma.forecast.create({
    data: {
      businessId,
      asOf: fromIsoDate('2026-11-04'),
      horizonWeeks: 4,
      safeWithdrawal: '987.65',
      explanation: [],
      rulesVersion: '1.0.0',
      inputHash: randomBytes(32).toString('hex'),
    },
  });
  await prisma.forecastScenario.createMany({
    data: (['CONSERVATIVE', 'LIKELY', 'FAVORABLE'] as const).map((scenario) => ({
      businessId,
      forecastId: forecast.id,
      scenario,
      endBalance: '100.00',
      runwayStatus: 'NOT_BURNING' as const,
      monthlyRevenue: '1.00',
      monthlyExpense: '1.00',
    })),
  });
}

describe('webhook do WhatsApp', () => {
  beforeEach(() => {
    sent.length = 0;
  });

  it('a verificação exige o token e só devolve um desafio simples', async () => {
    const url = '/webhooks/whatsapp?hub.mode=subscribe';
    const ok = await request(app)
      .get(`${url}&hub.verify_token=token-de-verificacao&hub.challenge=abc123`)
      .expect(200);
    expect(ok.text).toBe('abc123');
    await request(app).get(`${url}&hub.verify_token=errado&hub.challenge=abc`).expect(403);
    await request(app)
      .get(`${url}&hub.verify_token=token-de-verificacao&hub.challenge=%3Cscript%3E`)
      .expect(403);
  });

  it('recusa assinatura inválida ou ausente, sem responder', async () => {
    const payload = webhookPayload(randomPhone());
    await postWebhook(payload, 'outro-segredo').expect(401);
    await request(app)
      .post('/webhooks/whatsapp')
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(401);
    expect(sent).toEqual([]);
  });

  it('com consentimento, responde curto com dados e link', async () => {
    const phone = randomPhone();
    const { agent } = await registerAndLogin(app, { phone });
    const businessId = await createBusiness(agent);
    await grantConsent(agent, businessId, 'WHATSAPP_NOTIFICATIONS');
    await addForecast(businessId);

    await postWebhook(webhookPayload(phone)).expect(200);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe(phone);
    expect(sent[0]?.text).toContain('R$ 987,65');
    expect(sent[0]?.text).toContain('/previsao');
    expect(sent[0]?.text.split('\n').length).toBeLessThanOrEqual(3);
  });

  it('a mesma mensagem recebida duas vezes gera uma só resposta', async () => {
    const payload = webhookPayload(randomPhone());
    await postWebhook(payload).expect(200);
    await postWebhook(payload).expect(200);
    expect(sent).toHaveLength(1);
  });

  it('sem consentimento ativo, nenhum dado financeiro sai', async () => {
    const phone = randomPhone();
    const { agent } = await registerAndLogin(app, { phone });
    const businessId = await createBusiness(agent);
    await addForecast(businessId);

    await postWebhook(webhookPayload(phone)).expect(200);
    const consentId = await grantConsent(agent, businessId, 'WHATSAPP_NOTIFICATIONS');
    await agent.delete(`/consents/${consentId}`).expect(204);
    await postWebhook(webhookPayload(phone)).expect(200);

    expect(sent).toHaveLength(2);
    for (const message of sent) {
      expect(message.text).not.toContain('R$');
      expect(message.text).toContain('/consentimentos');
    }
  });

  it('não guarda o texto da mensagem', async () => {
    const id = randomBytes(8).toString('hex');
    await postWebhook(webhookPayload(randomPhone(), id)).expect(200);
    const saved = await prisma.whatsappMessage.findUniqueOrThrow({ where: { externalId: id } });
    expect(JSON.stringify(saved)).not.toContain('previsão');
  });

  it('fica indisponível sem o segredo configurado', async () => {
    const closed = createApp({
      logger: pino({ level: 'silent' }),
      routers: apiRouters({
        prisma,
        partnerMetricsDb: prisma,
        config: loadConfig({ DATABASE_URL: databaseUrl }),
        whatsapp: { send: async () => undefined },
      }),
    });
    await request(closed)
      .post('/webhooks/whatsapp')
      .set('Content-Type', 'application/json')
      .send('{}')
      .expect(503);
  });
});

describe('indicadores do parceiro', () => {
  let readOnly: PrismaClient;
  const username = `metricas_${process.pid}`;
  const password = 'senha-so-de-teste';

  beforeAll(async () => {
    const url = new URL(databaseUrl);
    const database = url.pathname.slice(1);
    await prisma.$executeRawUnsafe(
      `CREATE USER IF NOT EXISTS '${username}'@'%' IDENTIFIED BY '${password}'`,
    );
    await prisma.$executeRawUnsafe(
      `GRANT SELECT ON \`${database}\`.\`partner_metrics\` TO '${username}'@'%'`,
    );
    url.username = username;
    url.password = password;
    url.searchParams.set('allowPublicKeyRetrieval', 'true');
    readOnly = createPrisma(url.toString());
  });

  afterAll(async () => {
    await readOnly.$disconnect();
    await prisma.$executeRawUnsafe(`DROP USER IF EXISTS '${username}'@'%'`);
  });

  async function partnerWith(email: string) {
    return prisma.partner.create({
      data: {
        name: 'Aceleradora de Teste',
        type: 'ACCELERATOR',
        joinCode: randomBytes(12).toString('base64url'),
        members: { create: { user: { connect: { email } } } },
      },
    });
  }

  it('só o membro do parceiro lê, e pela conexão somente leitura', async () => {
    const restricted = createTestApp({ partnerDb: readOnly });
    const member = await registerAndLogin(restricted.app);
    const stranger = await registerAndLogin(restricted.app);
    const partner = await partnerWith(member.email);
    await prisma.partnerMetric.create({
      data: {
        partnerId: partner.id,
        period: '2026-11',
        indicator: 'active_businesses',
        value: '7.00',
        businessCount: 7,
      },
    });

    const res = await member.agent.get(`/partners/${partner.id}/metrics`).expect(200);
    expect(res.body.metrics).toEqual([
      { period: '2026-11', indicator: 'active_businesses', value: '7.00', businessCount: 7 },
    ]);
    await stranger.agent.get(`/partners/${partner.id}/metrics`).expect(404);
    await member.agent.get(`/partners/${partner.id}/metrics?period=novembro`).expect(400);
    await restricted.prisma.$disconnect();
  });

  it('o usuário somente leitura não enxerga dados individuais nem escreve', async () => {
    await expect(readOnly.transaction.count()).rejects.toThrow();
    await expect(readOnly.user.count()).rejects.toThrow();
    await expect(readOnly.business.count()).rejects.toThrow();
    await expect(readOnly.partnerMetric.deleteMany({ where: { partnerId: 0 } })).rejects.toThrow();
    await expect(readOnly.partnerMetric.count()).resolves.toBeGreaterThanOrEqual(0);
  });

  it('o código de adesão inválido é recusado e o válido liga o negócio', async () => {
    const owner = await registerAndLogin(app);
    await owner.agent
      .post('/businesses')
      .send({ name: 'X', type: 'ME', partnerCode: 'nao-existe' })
      .expect(400);
    const partner = await partnerWith(owner.email);
    const businessId = await createBusiness(owner.agent, { partnerCode: partner.joinCode });
    const saved = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
    expect(saved.partnerId).toBe(partner.id);
  });
});
