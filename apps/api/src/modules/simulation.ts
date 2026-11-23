// Ambiente simulado (funcionalidade 025): o negócio novo nasce com dados fictícios sorteados.
import { createHash, randomInt, randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient } from '@gig/db';
import { classifyTransaction, fromIsoDate, generateSimulatedBusiness, toCents } from '@gig/shared';
import { audit } from '../http';

export const SIMULATED_CONSENT_SCOPE = 'Dados simulados do ambiente de testes';

function todayInBrazil(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

export async function populateSimulatedBusiness(
  tx: Prisma.TransactionClient,
  input: {
    businessId: number;
    userId: number;
    type: 'MEI' | 'ME' | 'STARTUP' | 'SERVICE_PROVIDER';
    seed?: number;
    asOf?: string;
  },
): Promise<{ scenario: string; seed: number }> {
  const { businessId, userId } = input;
  const seed = input.seed ?? randomInt(0, 2 ** 31);
  const asOf = input.asOf ?? todayInBrazil();
  const tracks = await tx.track.findMany({ orderBy: { id: 'asc' }, select: { id: true } });
  const simulated = generateSimulatedBusiness({
    seed,
    asOf,
    type: input.type,
    trackCount: tracks.length,
  });

  // O worker encontra o negócio marcado e calcula a previsão e os alertas (regras 11 e 18).
  await tx.business.update({
    where: { id: businessId },
    data: {
      cashBalance: simulated.cashBalance,
      cashBalanceDate: fromIsoDate(asOf),
      forecastDirtyAt: new Date(),
    },
  });
  // Um negócio antigo pode já ter o consentimento concedido; não duplica (027).
  const granted = await tx.consent.findFirst({
    where: { businessId, purpose: 'ASSISTED_INGESTION', status: 'GRANTED' },
    select: { id: true },
  });
  if (!granted) {
    await tx.consent.create({
      data: {
        businessId,
        consentRef: randomUUID(),
        purpose: 'ASSISTED_INGESTION',
        scope: SIMULATED_CONSENT_SCOPE,
        status: 'GRANTED',
        grantedAt: new Date(),
        createdByUserId: userId,
      },
    });
  }
  await tx.transaction.createMany({
    data: simulated.transactions.map((t, index) => {
      const classification = classifyTransaction(t.description, toCents(t.amount));
      return {
        businessId,
        date: fromIsoDate(t.date),
        amount: t.amount,
        description: t.description,
        category: classification.category,
        label: classification.label,
        labelSource: classification.source,
        dedupKey: createHash('sha256')
          .update(`simulacao:${seed}:${index}:${t.date}:${t.description}:${t.amount}`)
          .digest('hex'),
      };
    }),
  });
  await tx.commitment.createMany({
    data: simulated.commitments.map((c) => ({
      businessId,
      type: c.type,
      description: c.description,
      amount: c.amount,
      dueDate: fromIsoDate(c.dueDate),
      recurrence: c.recurrence,
    })),
  });
  // O progresso que a pessoa já registrou numa trilha é mantido (027).
  const started = new Set(
    (await tx.trackProgress.findMany({ where: { businessId }, select: { trackId: true } })).map(
      (p) => p.trackId,
    ),
  );
  const progress = tracks
    .map((track, index) => ({ track, percent: simulated.trackPercents[index] ?? 0 }))
    .filter(({ track, percent }) => percent > 0 && !started.has(track.id));
  if (progress.length > 0) {
    await tx.trackProgress.createMany({
      data: progress.map(({ track, percent }) => ({
        businessId,
        trackId: track.id,
        percent,
        completedAt: percent === 100 ? new Date() : null,
      })),
    });
  }
  // Cenário e semente bastam para reproduzir o caso; nenhum valor vai para o registro (regra 7).
  await audit(tx, {
    actorUserId: userId,
    businessId,
    action: 'business.simulate',
    targetType: 'simulation',
    targetId: `${simulated.scenario}:${seed}`,
  });
  return { scenario: simulated.scenario, seed };
}

export type SimulatedRun = { businessId: number; scenario?: string; seed?: number };

// Negócios criados antes do modo (027): só os vazios, sem transações nem compromissos, e
// sem consentimento de entrada assistida revogado. Rodar de novo não muda nada (regra 18).
export async function simulateEmptyBusinesses(
  prisma: PrismaClient,
  options: { dryRun?: boolean; asOf?: string; businessIds?: number[] } = {},
): Promise<SimulatedRun[]> {
  const candidates = await prisma.business.findMany({
    where: {
      ...(options.businessIds ? { id: { in: options.businessIds } } : {}),
      transactions: { none: {} },
      commitments: { none: {} },
      consents: { none: { purpose: 'ASSISTED_INGESTION', status: 'REVOKED' } },
      members: { some: { role: 'OWNER' } },
    },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      type: true,
      members: {
        where: { role: 'OWNER' },
        orderBy: { id: 'asc' },
        take: 1,
        select: { userId: true },
      },
    },
  });
  if (options.dryRun) return candidates.map((b) => ({ businessId: b.id }));

  const runs: SimulatedRun[] = [];
  for (const business of candidates) {
    const owner = business.members[0];
    if (!owner) continue;
    const result = await prisma.$transaction(
      async (tx) => {
        // Confere de novo dentro da transação: o negócio pode ter recebido dados no meio do caminho.
        const busy =
          (await tx.transaction.count({ where: { businessId: business.id } })) +
          (await tx.commitment.count({ where: { businessId: business.id } }));
        if (busy > 0) return null;
        return populateSimulatedBusiness(tx, {
          businessId: business.id,
          userId: owner.userId,
          type: business.type,
          asOf: options.asOf,
        });
      },
      { timeout: 20_000 },
    );
    if (result) runs.push({ businessId: business.id, ...result });
  }
  return runs;
}
