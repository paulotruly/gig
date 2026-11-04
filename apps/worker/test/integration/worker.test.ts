import { randomBytes, randomUUID } from 'node:crypto';
import { createPrisma, type BusinessType, type ConsentPurpose } from '@gig/db';
import { fromIsoDate, type WhatsAppSender } from '@gig/shared';
import { dispatchPendingAlerts } from '../../src/dispatch-alerts';
import { syncOpenFinance, type OpenFinanceProvider } from '../../src/open-finance';
import { computePartnerMetrics } from '../../src/partner-metrics';
import { recalculateBusiness, recalculateDirty } from '../../src/recalculate';
import { encryptToken } from '../../src/token-cipher';

const prisma = createPrisma(process.env.DATABASE_URL_TEST ?? '');
const ASOF = '2026-11-04';

afterAll(() => prisma.$disconnect());

let counter = 0;

async function createOwner(phone: string | null = null) {
  counter += 1;
  return prisma.user.create({
    data: {
      name: 'Pessoa',
      email: `worker-${process.pid}-${Date.now()}-${counter}@exemplo.test`,
      passwordHash: 'x',
      phone,
    },
  });
}

async function createBusiness(
  options: {
    type?: BusinessType;
    cash?: string | null;
    partnerId?: number;
    phone?: string;
  } = {},
) {
  const owner = await createOwner(options.phone ?? null);
  const cash = options.cash === undefined ? '5000.00' : options.cash;
  return prisma.business.create({
    data: {
      name: 'Negócio',
      type: options.type ?? 'MEI',
      partnerId: options.partnerId ?? null,
      cashBalance: cash,
      cashBalanceDate: cash === null ? null : fromIsoDate('2026-10-31'),
      forecastDirtyAt: new Date(),
      members: { create: { userId: owner.id, role: 'OWNER' } },
    },
  });
}

async function grant(businessId: number, purpose: ConsentPurpose) {
  return prisma.consent.create({
    data: {
      businessId,
      consentRef: randomUUID(),
      purpose,
      scope: 'teste',
      status: 'GRANTED',
      grantedAt: new Date(),
      createdByUserId: 0,
    },
  });
}

async function revoke(consent: Awaited<ReturnType<typeof grant>>) {
  await prisma.consent.create({
    data: {
      businessId: consent.businessId,
      consentRef: consent.consentRef,
      purpose: consent.purpose,
      scope: consent.scope,
      status: 'REVOKED',
      grantedAt: consent.grantedAt,
      revokedAt: new Date(),
      createdByUserId: consent.createdByUserId,
    },
  });
}

async function addHistory(businessId: number, revenue = '3000.00', expense = '-1000.00') {
  const rows = ['2026-07', '2026-08', '2026-09', '2026-10'].flatMap((month, index) => [
    { date: `${month}-05`, amount: revenue, category: 'receitas', key: `r${index}` },
    { date: `${month}-10`, amount: expense, category: 'operacao', key: `d${index}` },
  ]);
  await prisma.transaction.createMany({
    data: rows.map((row) => ({
      businessId,
      date: fromIsoDate(row.date),
      amount: row.amount,
      description: 'Movimento',
      category: row.category,
      label: 'BUSINESS' as const,
      labelSource: 'RULE' as const,
      dedupKey: row.key.padEnd(64, '0'),
    })),
  });
}

async function readyBusiness(options: Parameters<typeof createBusiness>[0] = {}) {
  const business = await createBusiness(options);
  await grant(business.id, 'ASSISTED_INGESTION');
  await addHistory(business.id);
  return business;
}

describe('recalculateBusiness', () => {
  it('grava a previsão com cenários e versão das regras', async () => {
    const business = await readyBusiness();
    expect(await recalculateBusiness(prisma, business.id, ASOF)).toBe('created');

    const forecast = await prisma.forecast.findFirstOrThrow({
      where: { businessId: business.id },
      include: { scenarios: true },
    });
    expect(forecast.rulesVersion).toBe('1.0.0');
    expect(forecast.scenarios).toHaveLength(3);
    expect(forecast.safeWithdrawal.toFixed(2)).toBe('5000.00');

    const after = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    expect(after.forecastDirtyAt).toBeNull();
  });

  it('é idempotente, em sequência e em paralelo', async () => {
    const business = await readyBusiness();
    const outcomes = await Promise.all(
      [1, 2, 3, 4].map(() => recalculateBusiness(prisma, business.id, ASOF)),
    );
    expect(outcomes.filter((o) => o === 'created')).toHaveLength(1);
    expect(await recalculateBusiness(prisma, business.id, ASOF)).toBe('unchanged');
    expect(await prisma.forecast.count({ where: { businessId: business.id } })).toBe(1);
    expect(await prisma.forecastScenario.count({ where: { businessId: business.id } })).toBe(3);
  });

  it('gera outra previsão quando a entrada ou a data-base mudam', async () => {
    const business = await readyBusiness();
    await recalculateBusiness(prisma, business.id, ASOF);
    expect(await recalculateBusiness(prisma, business.id, '2026-11-05')).toBe('created');
    await prisma.commitment.create({
      data: {
        businessId: business.id,
        type: 'FIXED_EXPENSE',
        description: 'Aluguel',
        amount: '100.00',
        dueDate: fromIsoDate('2026-11-20'),
      },
    });
    expect(await recalculateBusiness(prisma, business.id, '2026-11-05')).toBe('created');
  });

  it('sem consentimento ativo, não gera previsão', async () => {
    const none = await createBusiness();
    await addHistory(none.id);
    expect(await recalculateBusiness(prisma, none.id, ASOF)).toBe('no_consent');

    const revoked = await createBusiness();
    await addHistory(revoked.id);
    await revoke(await grant(revoked.id, 'ASSISTED_INGESTION'));
    expect(await recalculateBusiness(prisma, revoked.id, ASOF)).toBe('no_consent');

    const forecasts = await prisma.forecast.count({
      where: { businessId: { in: [none.id, revoked.id] } },
    });
    expect(forecasts).toBe(0);
  });

  it('informa a falta de saldo e de histórico', async () => {
    const withoutBalance = await readyBusiness({ cash: null });
    expect(await recalculateBusiness(prisma, withoutBalance.id, ASOF)).toBe('no_balance');
    const withoutHistory = await createBusiness();
    await grant(withoutHistory.id, 'ASSISTED_INGESTION');
    expect(await recalculateBusiness(prisma, withoutHistory.id, ASOF)).toBe('insufficient_history');
  });

  it('o saldo soma só as transações posteriores à data informada', async () => {
    const business = await readyBusiness();
    await prisma.transaction.create({
      data: {
        businessId: business.id,
        date: fromIsoDate('2026-11-02'),
        amount: '-750.50',
        description: 'Pessoal',
        category: 'pessoal',
        label: 'PERSONAL',
        labelSource: 'RULE',
        dedupKey: 'p'.repeat(64),
      },
    });
    await recalculateBusiness(prisma, business.id, ASOF);
    const forecast = await prisma.forecast.findFirstOrThrow({ where: { businessId: business.id } });
    expect(forecast.safeWithdrawal.toFixed(2)).toBe('4249.50');
  });

  it('recalculateDirty só processa o que mudou', async () => {
    const business = await readyBusiness();
    await recalculateDirty(prisma, ASOF);
    const clean = await prisma.business.count({
      where: { forecastDirtyAt: { not: null } },
    });
    expect(clean).toBe(0);
    expect(await prisma.forecast.count({ where: { businessId: business.id } })).toBe(1);
  });
});

describe('alertas', () => {
  async function businessInTrouble(options: Parameters<typeof createBusiness>[0] = {}) {
    const business = await createBusiness({ cash: '100.00', ...options });
    await grant(business.id, 'ASSISTED_INGESTION');
    await addHistory(business.id, '1000.00', '-5000.00');
    return business;
  }

  it('cria o alerta com regra, dados e trilha, sem repetir', async () => {
    const business = await businessInTrouble();
    await recalculateBusiness(prisma, business.id, ASOF);
    const alerts = await prisma.alert.findMany({ where: { businessId: business.id } });
    const soon = alerts.find((a) => a.ruleId === 'conservative_negative_soon');
    expect(soon).toMatchObject({
      channel: 'APP',
      status: 'SENT',
      trackSlug: 'fluxo-de-caixa',
      rulesVersion: '1.0.0',
    });
    expect(soon?.explanation).toContain('15 dias');
    expect(soon?.data).toHaveProperty('firstNegativeDate');

    const count = alerts.length;
    await recalculateBusiness(prisma, business.id, ASOF);
    expect(await prisma.alert.count({ where: { businessId: business.id } })).toBe(count);
  });

  it('só avalia runway de startup', async () => {
    const startup = await businessInTrouble({ type: 'STARTUP' });
    const mei = await businessInTrouble();
    await recalculateBusiness(prisma, startup.id, ASOF);
    await recalculateBusiness(prisma, mei.id, ASOF);
    const rules = async (businessId: number) =>
      (await prisma.alert.findMany({ where: { businessId } })).map((a) => a.ruleId);
    expect(await rules(startup.id)).toContain('low_runway');
    expect(await rules(mei.id)).not.toContain('low_runway');
  });

  function phone(): string {
    return `55${String(Date.now()).slice(-9)}${Math.floor(Math.random() * 90 + 10)}`;
  }

  async function pendingOnWhatsapp() {
    const business = await businessInTrouble({ phone: phone() });
    const consent = await grant(business.id, 'WHATSAPP_NOTIFICATIONS');
    await recalculateBusiness(prisma, business.id, ASOF);
    return { business, consent };
  }

  function recordingSender(fail = false) {
    const sent: string[] = [];
    const sender: WhatsAppSender = {
      send: async (_to, text) => {
        if (fail) {
          throw new Error('sem internet');
        }
        sent.push(text);
      },
    };
    return { sender, sent };
  }

  it('envia pelo WhatsApp uma só vez', async () => {
    const { business } = await pendingOnWhatsapp();
    const { sender, sent } = recordingSender();
    await dispatchPendingAlerts(prisma, sender);
    const total = sent.length;
    expect(total).toBeGreaterThan(0);
    await dispatchPendingAlerts(prisma, sender);
    expect(sent).toHaveLength(total);
    const pending = await prisma.alert.count({
      where: { businessId: business.id, status: 'PENDING' },
    });
    expect(pending).toBe(0);
  });

  it('não envia se o consentimento foi revogado depois de o alerta ser criado', async () => {
    const { business, consent } = await pendingOnWhatsapp();
    await revoke(consent);
    const { sender, sent } = recordingSender();
    await dispatchPendingAlerts(prisma, sender);
    expect(sent).toEqual([]);
    const skipped = await prisma.alert.findMany({ where: { businessId: business.id } });
    expect(skipped.every((a) => a.status === 'SKIPPED')).toBe(true);
  });

  it('mantém pendente para reenvio quando o envio falha', async () => {
    const { business } = await pendingOnWhatsapp();
    await dispatchPendingAlerts(prisma, recordingSender(true).sender);
    const alerts = await prisma.alert.findMany({ where: { businessId: business.id } });
    expect(alerts.every((a) => a.status === 'PENDING')).toBe(true);
    await prisma.alert.updateMany({
      where: { businessId: business.id },
      data: { status: 'SKIPPED' },
    });
  });
});

describe('indicadores do parceiro', () => {
  async function partnerWithBusinesses(withConsent: number, withoutConsent = 0) {
    const partner = await prisma.partner.create({
      data: {
        name: 'Parceiro',
        type: 'COMMUNITY',
        joinCode: randomBytes(12).toString('base64url'),
      },
    });
    const ids: number[] = [];
    for (let i = 0; i < withConsent + withoutConsent; i += 1) {
      const business = await createBusiness({ partnerId: partner.id });
      if (i < withConsent) {
        await grant(business.id, 'PARTNER_AGGREGATES');
      }
      ids.push(business.id);
    }
    return { partner, ids };
  }

  it('não publica abaixo de 5 negócios, nem contando quem não consentiu', async () => {
    const { partner } = await partnerWithBusinesses(4, 3);
    await computePartnerMetrics(prisma, '2026-11');
    expect(await prisma.partnerMetric.count({ where: { partnerId: partner.id } })).toBe(0);
  });

  it('publica agregados a partir de 5 e é idempotente', async () => {
    const { partner, ids } = await partnerWithBusinesses(5);
    const track = await prisma.track.findFirstOrThrow();
    await prisma.trackProgress.create({
      data: { businessId: ids[0] ?? 0, trackId: track.id, percent: 100 },
    });
    await computePartnerMetrics(prisma, '2026-11');
    await computePartnerMetrics(prisma, '2026-11');
    const metrics = await prisma.partnerMetric.findMany({
      where: { partnerId: partner.id },
      orderBy: { indicator: 'asc' },
    });
    expect(metrics.map((m) => [m.indicator, m.value.toFixed(2), m.businessCount])).toEqual([
      ['active_businesses', '5.00', 5],
      ['businesses_completed_track_percent', '20.00', 5],
      ['businesses_with_forecast_percent', '0.00', 5],
    ]);
  });

  it('retira o indicador quando o grupo cai abaixo do mínimo', async () => {
    const { partner, ids } = await partnerWithBusinesses(5);
    await computePartnerMetrics(prisma, '2026-11');
    expect(await prisma.partnerMetric.count({ where: { partnerId: partner.id } })).toBe(3);
    const consent = await prisma.consent.findFirstOrThrow({
      where: { businessId: ids[0], purpose: 'PARTNER_AGGREGATES' },
    });
    await revoke(consent);
    await computePartnerMetrics(prisma, '2026-11');
    expect(await prisma.partnerMetric.count({ where: { partnerId: partner.id } })).toBe(0);
  });
});

describe('Open Finance', () => {
  const key = randomBytes(32).toString('base64');

  function fakeProvider() {
    const calls: { accessToken: string }[] = [];
    const provider: OpenFinanceProvider = {
      listTransactions: async (params) => {
        calls.push({ accessToken: params.accessToken });
        return [
          { externalId: 'x1', date: '2026-10-05', amount: '-75.60', description: 'PGTO DAS' },
          { externalId: 'x2', date: '2026-10-06', amount: '100.00', description: 'Venda' },
        ];
      },
    };
    return { provider, calls };
  }

  async function connectedBusiness() {
    const business = await createBusiness();
    await prisma.account.create({
      data: {
        businessId: business.id,
        institution: 'Banco de Teste',
        type: 'PJ',
        externalRef: randomBytes(6).toString('hex'),
        accessTokenEncrypted: encryptToken('token-real', key),
      },
    });
    return business;
  }

  async function clearOtherAccounts(businessId: number) {
    await prisma.account.updateMany({
      where: { businessId: { not: businessId } },
      data: { accessTokenEncrypted: null },
    });
  }

  it('sincroniza sem duplicar, com token decifrado e etiqueta aplicada', async () => {
    const business = await connectedBusiness();
    await clearOtherAccounts(business.id);
    await grant(business.id, 'OPEN_FINANCE');
    const { provider, calls } = fakeProvider();

    const first = await syncOpenFinance(prisma, provider, key);
    const second = await syncOpenFinance(prisma, provider, key);
    expect(first).toMatchObject({ synced: 1, imported: 2 });
    expect(second).toMatchObject({ synced: 1, imported: 0 });
    expect(calls[0]?.accessToken).toBe('token-real');

    const rows = await prisma.transaction.findMany({ where: { businessId: business.id } });
    expect(rows).toHaveLength(2);
    expect(rows.find((t) => t.description === 'PGTO DAS')?.label).toBe('TAX');
  });

  it('não chama o provedor sem consentimento ativo ou depois da revogação', async () => {
    const business = await connectedBusiness();
    await clearOtherAccounts(business.id);
    const { provider, calls } = fakeProvider();
    expect(await syncOpenFinance(prisma, provider, key)).toMatchObject({ withoutConsent: 1 });
    await revoke(await grant(business.id, 'OPEN_FINANCE'));
    expect(await syncOpenFinance(prisma, provider, key)).toMatchObject({ withoutConsent: 1 });
    expect(calls).toEqual([]);
  });

  it('sem provedor configurado, não faz nada', async () => {
    expect(await syncOpenFinance(prisma, null, key)).toEqual({
      synced: 0,
      withoutConsent: 0,
      imported: 0,
    });
  });
});
