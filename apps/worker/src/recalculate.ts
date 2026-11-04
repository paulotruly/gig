import { createHash } from 'node:crypto';
import { isConsentActive, Prisma, type PrismaClient, type Scenario } from '@gig/db';
import {
  computeForecast,
  evaluateAlerts,
  fromCents,
  fromIsoDate,
  RULES_VERSION,
  SCENARIOS,
  toCents,
  toIsoDate,
  type Forecast,
  type ForecastCommitment,
  type ForecastTransaction,
  type ScenarioName,
} from '@gig/shared';

export type RecalculationOutcome =
  'created' | 'unchanged' | 'no_consent' | 'no_balance' | 'insufficient_history';

const SCENARIO_COLUMN: Record<ScenarioName, Scenario> = {
  conservative: 'CONSERVATIVE',
  likely: 'LIKELY',
  favorable: 'FAVORABLE',
};

function hashInput(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

async function hasActiveDataConsent(prisma: PrismaClient, businessId: number): Promise<boolean> {
  return (
    (await isConsentActive(prisma, businessId, 'ASSISTED_INGESTION')) ||
    (await isConsentActive(prisma, businessId, 'OPEN_FINANCE'))
  );
}

async function saveForecast(
  prisma: PrismaClient,
  businessId: number,
  forecast: Forecast,
  inputHash: string,
): Promise<'created' | 'unchanged'> {
  try {
    await prisma.$transaction(async (tx) => {
      const saved = await tx.forecast.create({
        data: {
          businessId,
          asOf: fromIsoDate(forecast.asOf),
          horizonWeeks: forecast.horizonWeeks,
          safeWithdrawal: forecast.safeWithdrawal,
          explanation: forecast.explanation,
          rulesVersion: forecast.rulesVersion,
          inputHash,
        },
      });
      await tx.forecastScenario.createMany({
        data: SCENARIOS.map((name) => {
          const scenario = forecast.scenarios[name];
          return {
            businessId,
            forecastId: saved.id,
            scenario: SCENARIO_COLUMN[name],
            endBalance: scenario.endBalance,
            firstNegativeDate: scenario.firstNegativeDate
              ? fromIsoDate(scenario.firstNegativeDate)
              : null,
            runwayMonths: scenario.runway.months,
            runwayStatus: scenario.runway.status === 'finite' ? 'FINITE' : 'NOT_BURNING',
            monthlyRevenue: scenario.monthlyRevenue,
            monthlyExpense: scenario.monthlyExpense,
          } as const;
        }),
      });
    });
    return 'created';
  } catch (err) {
    // Outra execução já gravou a mesma entrada: é o resultado esperado da idempotência.
    if (isUniqueViolation(err)) {
      return 'unchanged';
    }
    throw err;
  }
}

export async function recalculateBusiness(
  prisma: PrismaClient,
  businessId: number,
  asOf: string,
): Promise<RecalculationOutcome> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: {
      members: {
        where: { role: 'OWNER' },
        select: { user: { select: { phone: true } } },
        take: 1,
      },
    },
  });
  const dirtyAt = business.forecastDirtyAt;

  async function finish(outcome: RecalculationOutcome): Promise<RecalculationOutcome> {
    // Só limpa a marca se ninguém mudou os dados durante o cálculo.
    await prisma.business.updateMany({
      where: { id: businessId, forecastDirtyAt: dirtyAt },
      data: { forecastDirtyAt: null },
    });
    return outcome;
  }

  // A conferência acontece antes de ler qualquer transação (regra 5).
  if (!(await hasActiveDataConsent(prisma, businessId))) {
    return finish('no_consent');
  }
  if (business.cashBalance === null || business.cashBalanceDate === null) {
    return finish('no_balance');
  }

  const rows = await prisma.transaction.findMany({
    where: { businessId },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
    select: { date: true, amount: true, label: true, category: true },
  });
  const commitmentRows = await prisma.commitment.findMany({
    where: { businessId },
    orderBy: { id: 'asc' },
  });

  const transactions: ForecastTransaction[] = rows.map((t) => ({
    date: toIsoDate(t.date),
    amount: t.amount.toFixed(2),
    label: t.label,
    category: t.category,
  }));
  const commitments: ForecastCommitment[] = commitmentRows.map((c) => ({
    type: c.type,
    amount: c.amount.toFixed(2),
    dueDate: toIsoDate(c.dueDate),
    recurrence: c.recurrence,
  }));

  const balanceDate = toIsoDate(business.cashBalanceDate);
  const cashCents = transactions
    .filter((t) => t.date > balanceDate)
    .reduce((sum, t) => sum + toCents(t.amount), toCents(business.cashBalance.toFixed(2)));
  const input = { asOf, cashBalance: fromCents(cashCents), transactions, commitments };

  const forecast = computeForecast(input);
  if (forecast.status !== 'ok') {
    return finish('insufficient_history');
  }

  const inputHash = hashInput(input);
  const outcome = await saveForecast(prisma, businessId, forecast, inputHash);

  const alerts = evaluateAlerts({ forecast, businessType: business.type, transactions });
  if (alerts.length > 0) {
    const phone = business.members[0]?.user.phone;
    const useWhatsapp =
      Boolean(phone) && (await isConsentActive(prisma, businessId, 'WHATSAPP_NOTIFICATIONS'));
    // A chave única impede repetir o alerta da mesma regra e data de referência.
    await prisma.alert.createMany({
      skipDuplicates: true,
      data: alerts.map((alert) => ({
        businessId,
        ruleId: alert.ruleId,
        referenceDate: fromIsoDate(alert.referenceDate),
        message: alert.message,
        explanation: alert.explanation,
        data: alert.data,
        trackSlug: alert.trackSlug,
        rulesVersion: RULES_VERSION,
        channel: useWhatsapp ? 'WHATSAPP' : 'APP',
        // No app, o alerta já fica disponível ao ser criado.
        status: useWhatsapp ? 'PENDING' : 'SENT',
        sentAt: useWhatsapp ? null : new Date(),
      })),
    });
  }

  return finish(outcome);
}

export async function recalculateDirty(prisma: PrismaClient, asOf: string) {
  const businesses = await prisma.business.findMany({
    where: { forecastDirtyAt: { not: null } },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  return runAll(prisma, businesses, asOf);
}

// A data-base muda a cada dia, então todas as previsões são refeitas diariamente.
export async function recalculateAll(prisma: PrismaClient, asOf: string) {
  const businesses = await prisma.business.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  return runAll(prisma, businesses, asOf);
}

async function runAll(prisma: PrismaClient, businesses: { id: number }[], asOf: string) {
  const outcomes: Record<string, number> = {};
  for (const { id } of businesses) {
    const outcome = await recalculateBusiness(prisma, id, asOf);
    outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
  }
  return outcomes;
}
