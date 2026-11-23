import { commitmentsResponse, transactionsResponse } from '@gig/shared/contracts';
import { simulateEmptyBusinesses } from '../../src/modules/simulation';
import { createBusiness, createTestApp, grantConsent, registerAndLogin } from './support';

const simulated = createTestApp({ SIMULATION_MODE: 'true' });
const plain = createTestApp();

afterAll(async () => {
  await simulated.prisma.$disconnect();
  await plain.prisma.$disconnect();
});

describe('ambiente simulado', () => {
  it('cria o negócio já com saldo, transações, compromissos e consentimento', async () => {
    const { agent } = await registerAndLogin(simulated.app);
    const businessId = await createBusiness(agent);
    const { prisma } = simulated;

    const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
    expect(business.cashBalance).not.toBeNull();
    expect(business.forecastDirtyAt).not.toBeNull();

    const transactions = transactionsResponse.parse(
      (await agent.get(`/businesses/${businessId}/transactions?pageSize=100`).expect(200)).body,
    );
    expect(transactions.total).toBeGreaterThan(0);
    const commitments = commitmentsResponse.parse(
      (await agent.get(`/businesses/${businessId}/commitments`).expect(200)).body,
    );
    expect(commitments.commitments.length).toBeGreaterThan(0);

    const consents = await prisma.consent.count({
      where: { businessId, purpose: 'ASSISTED_INGESTION', status: 'GRANTED' },
    });
    expect(consents).toBe(1);
    const log = await prisma.auditLog.findFirstOrThrow({
      where: { businessId, action: 'business.simulate' },
    });
    expect(log.targetId).toMatch(/^[a-z-]+:\d+$/);
  });

  it('sorteia dados diferentes para cada negócio', async () => {
    const { agent } = await registerAndLogin(simulated.app);
    const ids = [];
    for (let i = 0; i < 4; i += 1) ids.push(await createBusiness(agent, { type: 'STARTUP' }));
    const logs = await simulated.prisma.auditLog.findMany({
      where: { businessId: { in: ids }, action: 'business.simulate' },
    });
    expect(new Set(logs.map((l) => l.targetId)).size).toBe(ids.length);
    const balances = await simulated.prisma.business.findMany({ where: { id: { in: ids } } });
    expect(new Set(balances.map((b) => b.cashBalance?.toFixed(2))).size).toBe(ids.length);
  });

  it('sem o modo, cria o negócio vazio', async () => {
    const { agent } = await registerAndLogin(plain.app);
    const businessId = await createBusiness(agent);
    expect(await plain.prisma.transaction.count({ where: { businessId } })).toBe(0);
    expect(await plain.prisma.commitment.count({ where: { businessId } })).toBe(0);
    const business = await plain.prisma.business.findUniqueOrThrow({ where: { id: businessId } });
    expect(business.cashBalance).toBeNull();
  });

  it('simula os negócios antigos vazios e deixa os demais como estão', async () => {
    const { agent } = await registerAndLogin(plain.app);
    const { prisma } = plain;
    const empty = await createBusiness(agent);
    const withHistory = await createBusiness(agent);
    const revoked = await createBusiness(agent);
    const started = await createBusiness(agent);

    await prisma.transaction.create({
      data: {
        businessId: withHistory,
        date: new Date('2026-11-01'),
        amount: '100.00',
        description: 'Venda real',
        category: 'Vendas',
        label: 'BUSINESS',
        labelSource: 'USER',
        dedupKey: `real-${withHistory}`,
      },
    });
    const revokedConsent = await grantConsent(agent, revoked, 'ASSISTED_INGESTION');
    await agent.delete(`/consents/${revokedConsent}`).expect(204);
    await grantConsent(agent, started, 'ASSISTED_INGESTION');
    const track = await prisma.track.findFirstOrThrow({ orderBy: { id: 'asc' } });
    await prisma.trackProgress.create({
      data: { businessId: started, trackId: track.id, percent: 30 },
    });

    const ids = [empty, withHistory, revoked, started];
    const preview = await simulateEmptyBusinesses(prisma, { dryRun: true, businessIds: ids });
    expect(preview.map((r) => r.businessId)).toEqual([empty, started]);
    expect(await prisma.transaction.count({ where: { businessId: empty } })).toBe(0);

    const runs = await simulateEmptyBusinesses(prisma, { businessIds: ids });
    expect(runs.map((r) => r.businessId)).toEqual([empty, started]);
    for (const id of [empty, started]) {
      expect(await prisma.transaction.count({ where: { businessId: id } })).toBeGreaterThan(0);
      expect(await prisma.commitment.count({ where: { businessId: id } })).toBeGreaterThan(0);
      expect(
        await prisma.auditLog.count({ where: { businessId: id, action: 'business.simulate' } }),
      ).toBe(1);
    }
    expect(await prisma.transaction.count({ where: { businessId: withHistory } })).toBe(1);
    expect(await prisma.transaction.count({ where: { businessId: revoked } })).toBe(0);
    expect(
      await prisma.consent.count({
        where: { businessId: started, purpose: 'ASSISTED_INGESTION', status: 'GRANTED' },
      }),
    ).toBe(1);
    const kept = await prisma.trackProgress.findUniqueOrThrow({
      where: { businessId_trackId: { businessId: started, trackId: track.id } },
    });
    expect(kept.percent).toBe(30);

    expect(await simulateEmptyBusinesses(prisma, { businessIds: ids })).toEqual([]);
  });
});
