import { commitmentsResponse, transactionsResponse } from '@gig/shared/contracts';
import { createBusiness, createTestApp, registerAndLogin } from './support';

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
});
