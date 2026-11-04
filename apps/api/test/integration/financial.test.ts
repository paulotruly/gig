import { fromIsoDate } from '@gig/shared';
import { forecastResponse } from '@gig/shared/contracts';
import request from 'supertest';
import { createBusiness, createTestApp, grantConsent, registerAndLogin } from './support';

const { app, prisma } = createTestApp();

afterAll(() => prisma.$disconnect());

async function readyBusiness() {
  const session = await registerAndLogin(app);
  const businessId = await createBusiness(session.agent);
  const consentId = await grantConsent(session.agent, businessId, 'ASSISTED_INGESTION');
  return { ...session, businessId, consentId, base: `/businesses/${businessId}` };
}

type Agent = ReturnType<typeof request.agent>;

function upload(agent: Agent, base: string, csv: string, format = 'csv') {
  return agent
    .post(`${base}/statements?format=${format}`)
    .set('Content-Type', 'text/csv')
    .send(csv);
}

const CSV = `data;descricao;valor
05/10/2026;Venda cliente;1.500,00
06/10/2026;PGTO DAS MEI;-75,60
07/10/2026;Farmácia 123;-40,00
08/10/2026;Farmácia 456;-55,00
`;

describe('entrada assistida', () => {
  it('exige consentimento e para de aceitar após a revogação', async () => {
    const { agent, base, consentId } = await readyBusiness();
    await upload(agent, base, CSV).expect(201);
    await agent.delete(`/consents/${consentId}`).expect(204);
    const res = await upload(agent, base, CSV).expect(403);
    expect(res.body.error.code).toBe('consent_required');
  });

  it('importa, classifica e não duplica ao reenviar', async () => {
    const { agent, base, businessId } = await readyBusiness();
    const first = await upload(agent, base, CSV).expect(201);
    expect(first.body).toMatchObject({ rowsTotal: 4, rowsImported: 4, duplicates: 0 });

    const second = await upload(agent, base, CSV).expect(201);
    expect(second.body).toMatchObject({ rowsTotal: 4, rowsImported: 0, duplicates: 4 });
    expect(await prisma.transaction.count({ where: { businessId } })).toBe(4);

    const list = await agent.get(`${base}/transactions`).expect(200);
    const byDescription = Object.fromEntries(
      list.body.transactions.map((t: { description: string }) => [t.description, t]),
    );
    expect(byDescription['Venda cliente']).toMatchObject({
      amount: '1500.00',
      label: 'BUSINESS',
      origin: 'BUSINESS',
      category: 'receitas',
    });
    expect(byDescription['PGTO DAS MEI']).toMatchObject({ amount: '-75.60', label: 'TAX' });
    expect(byDescription['Farmácia 123']).toMatchObject({ label: 'PERSONAL', origin: 'PERSONAL' });

    const dirty = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
    expect(dirty.forecastDirtyAt).not.toBeNull();
  });

  it('arquivo inválido não grava nada, nem o registro da importação', async () => {
    const { agent, base, businessId } = await readyBusiness();
    const bad = 'data;descricao;valor\n05/10/2026;Boa;1,00\n99/99/2026;Ruim;1,00\n';
    const res = await upload(agent, base, bad).expect(400);
    expect(res.body.error.code).toBe('invalid_statement');
    expect(await prisma.transaction.count({ where: { businessId } })).toBe(0);
    expect(await prisma.statementImport.count({ where: { businessId } })).toBe(0);
  });

  it('não guarda o arquivo, só hash e contagens', async () => {
    const { agent, base, businessId } = await readyBusiness();
    await upload(agent, base, CSV).expect(201);
    const saved = await prisma.statementImport.findFirstOrThrow({ where: { businessId } });
    expect(saved.fileHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(saved)).not.toContain('Venda');
  });

  it('recusa formato desconhecido e corpo acima do limite', async () => {
    const { agent, base } = await readyBusiness();
    await upload(agent, base, CSV, 'xls').expect(400);
    const huge = `data;descricao;valor\n${'05/10/2026;x;1,00\n'.repeat(320_000)}`;
    const res = await upload(agent, base, huge).expect(413);
    expect(res.body.error.code).toBe('payload_too_large');
  });

  it('o log de auditoria não traz valores nem descrições', async () => {
    const { agent, base, businessId } = await readyBusiness();
    await upload(agent, base, CSV).expect(201);
    await agent.get(`${base}/transactions`).expect(200);
    const log = await prisma.auditLog.findMany({ where: { businessId } });
    const text = JSON.stringify(log);
    expect(log.map((l) => l.action)).toEqual(
      expect.arrayContaining(['statement.import', 'transactions.list']),
    );
    expect(text).not.toMatch(/Venda|Farm|1500|75\.6/);
  });
});

describe('correção da classificação', () => {
  it('aprende, alcança as parecidas e nunca sobrescreve outra correção', async () => {
    const { agent, base, businessId } = await readyBusiness();
    await upload(agent, base, CSV).expect(201);
    const rows = await prisma.transaction.findMany({
      where: { businessId, description: { startsWith: 'Farm' } },
      orderBy: { id: 'asc' },
    });
    const [first, second] = rows;

    const res = await agent
      .patch(`/transactions/${first?.id}`)
      .send({ label: 'BUSINESS' })
      .expect(200);
    expect(res.body).toMatchObject({ label: 'BUSINESS', labelSource: 'USER', userCorrected: true });

    const similar = await prisma.transaction.findUniqueOrThrow({ where: { id: second?.id } });
    expect(similar).toMatchObject({
      label: 'BUSINESS',
      labelSource: 'LEARNED',
      userCorrected: false,
    });

    // A segunda correção manual não pode alterar a primeira, que continua protegida.
    await agent.patch(`/transactions/${second?.id}`).send({ label: 'TAX' }).expect(200);
    const original = await prisma.transaction.findUniqueOrThrow({ where: { id: first?.id } });
    expect(original.label).toBe('BUSINESS');

    // Importações futuras usam a última regra aprendida.
    await upload(agent, base, 'data;descricao;valor\n09/10/2026;Farmácia 789;-10,00\n').expect(201);
    const future = await prisma.transaction.findFirstOrThrow({
      where: { businessId, description: 'Farmácia 789' },
    });
    expect(future).toMatchObject({ label: 'TAX', labelSource: 'LEARNED' });
  });

  it('recusa etiqueta inválida e transação de outro negócio', async () => {
    const owner = await readyBusiness();
    const other = await readyBusiness();
    await upload(owner.agent, owner.base, CSV).expect(201);
    const row = await prisma.transaction.findFirstOrThrow({
      where: { businessId: owner.businessId },
    });
    await owner.agent.patch(`/transactions/${row.id}`).send({ label: 'INVENTADA' }).expect(400);
    await other.agent.patch(`/transactions/${row.id}`).send({ label: 'TAX' }).expect(404);
    const unchanged = await prisma.transaction.findUniqueOrThrow({ where: { id: row.id } });
    expect(unchanged.userCorrected).toBe(false);
  });

  it('pagina e filtra por período', async () => {
    const { agent, base } = await readyBusiness();
    await upload(agent, base, CSV).expect(201);
    const page = await agent.get(`${base}/transactions?pageSize=1&page=2`).expect(200);
    expect(page.body).toMatchObject({ total: 4, page: 2, pageSize: 1 });
    expect(page.body.transactions).toHaveLength(1);
    const range = await agent.get(`${base}/transactions?from=2026-10-07&to=2026-10-07`).expect(200);
    expect(range.body.total).toBe(1);
    await agent.get(`${base}/transactions?from=ontem`).expect(400);
  });
});

describe('compromissos', () => {
  it('cria, lista, remove e marca para recálculo', async () => {
    const { agent, base, businessId } = await readyBusiness();
    const created = await agent
      .post(`${base}/commitments`)
      .send({
        type: 'FIXED_EXPENSE',
        description: 'Aluguel',
        amount: '1200.00',
        dueDate: '2026-12-10',
        recurrence: 'MONTHLY',
      })
      .expect(201);
    expect(created.body).toMatchObject({ amount: '1200.00', dueDate: '2026-12-10' });

    await prisma.business.update({ where: { id: businessId }, data: { forecastDirtyAt: null } });
    await agent.delete(`${base}/commitments/${created.body.id}`).expect(204);
    await agent.delete(`${base}/commitments/${created.body.id}`).expect(404);
    const dirty = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
    expect(dirty.forecastDirtyAt).not.toBeNull();

    const list = await agent.get(`${base}/commitments`).expect(200);
    expect(list.body.commitments).toEqual([]);
  });

  it('recusa valor zero, negativo ou numérico', async () => {
    const { agent, base } = await readyBusiness();
    for (const amount of ['0.00', '-5.00', 10]) {
      await agent
        .post(`${base}/commitments`)
        .send({ type: 'RECEIVABLE', description: 'x', amount, dueDate: '2026-12-10' })
        .expect(400);
    }
  });

  it('não remove compromisso de outro negócio pela rota do próprio negócio', async () => {
    const owner = await readyBusiness();
    const other = await readyBusiness();
    const created = await owner.agent
      .post(`${owner.base}/commitments`)
      .send({ type: 'RECEIVABLE', description: 'x', amount: '5.00', dueDate: '2026-12-10' })
      .expect(201);
    await other.agent.delete(`${other.base}/commitments/${created.body.id}`).expect(404);
    expect(await prisma.commitment.count({ where: { id: created.body.id } })).toBe(1);
  });
});

describe('previsão, alertas e trilhas', () => {
  it('sem previsão responde forecast_not_ready', async () => {
    const { agent, base } = await readyBusiness();
    const res = await agent.get(`${base}/forecast`).expect(404);
    expect(res.body.error.code).toBe('forecast_not_ready');
  });

  it('devolve o contrato e registra os eventos uma só vez', async () => {
    const { agent, base, businessId } = await readyBusiness();
    const forecast = await prisma.forecast.create({
      data: {
        businessId,
        asOf: fromIsoDate('2026-11-04'),
        horizonWeeks: 4,
        safeWithdrawal: '1200.00',
        explanation: ['Receita provável = mediana dos últimos 6 meses'],
        rulesVersion: '1.0.0',
        inputHash: 'a'.repeat(64),
      },
    });
    const scenario = {
      businessId,
      forecastId: forecast.id,
      monthlyRevenue: '10.00',
      monthlyExpense: '20.00',
    };
    await prisma.forecastScenario.createMany({
      data: [
        {
          ...scenario,
          scenario: 'CONSERVATIVE',
          endBalance: '1800.10',
          firstNegativeDate: fromIsoDate('2026-11-12'),
          runwayMonths: '8.5',
          runwayStatus: 'FINITE',
        },
        { ...scenario, scenario: 'LIKELY', endBalance: '4300.00', runwayStatus: 'NOT_BURNING' },
        { ...scenario, scenario: 'FAVORABLE', endBalance: '7600.00', runwayStatus: 'NOT_BURNING' },
      ],
    });

    const res = await agent.get(`${base}/forecast`).expect(200);
    await agent.get(`${base}/forecast`).expect(200);
    expect(forecastResponse.safeParse(res.body).success).toBe(true);
    expect(res.body.scenarios.conservative).toEqual({
      endBalance: '1800.10',
      firstNegativeDate: '2026-11-12',
      runway: { months: '8.5', status: 'finite' },
    });
    expect(res.body.scenarios.likely.runway).toEqual({ months: null, status: 'not_burning' });

    const events = await prisma.usageEvent.findMany({ where: { businessId } });
    const count = (event: string) => events.filter((e) => e.event === event).length;
    expect(count('FIRST_FORECAST_VIEWED')).toBe(1);
    expect(count('WEEKLY_OPEN')).toBe(1);
  });

  it('o progresso nunca regride e a conclusão gera um só evento', async () => {
    const { agent, businessId } = await readyBusiness();
    const tracks = await agent.get('/tracks').expect(200);
    expect(tracks.body.tracks).toHaveLength(4);
    const url = `/tracks/${tracks.body.tracks[0].id}/progress`;

    const up = await agent.post(url).send({ businessId, percent: 60 }).expect(200);
    expect(up.body.percent).toBe(60);
    const down = await agent.post(url).send({ businessId, percent: 10 }).expect(200);
    expect(down.body.percent).toBe(60);

    await agent.post(url).send({ businessId, percent: 100 }).expect(200);
    await agent.post(url).send({ businessId, percent: 100 }).expect(200);
    await agent.post(url).send({ businessId, percent: 101 }).expect(400);
    const events = await prisma.usageEvent.count({
      where: { businessId, event: 'TRACK_COMPLETED' },
    });
    expect(events).toBe(1);
    await agent.post('/tracks/999999/progress').send({ businessId, percent: 1 }).expect(404);
  });
});
