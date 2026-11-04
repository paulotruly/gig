import { createHash } from 'node:crypto';
import { isConsentActive, type PrismaClient } from '@gig/db';
import { classifyTransaction, fromIsoDate, isDecimalString, toCents } from '@gig/shared';
import { decryptToken } from './token-cipher';

export type ProviderTransaction = {
  externalId: string;
  date: string;
  amount: string;
  description: string;
};

// Só leitura: nenhuma operação pode iniciar pagamento ou mover dinheiro (regra 1).
export interface OpenFinanceProvider {
  listTransactions(params: {
    accessToken: string;
    externalRef: string;
    since: Date | null;
  }): Promise<ProviderTransaction[]>;
}

export async function syncOpenFinance(
  prisma: PrismaClient,
  provider: OpenFinanceProvider | null,
  tokenKey: string | undefined,
) {
  const summary = { synced: 0, withoutConsent: 0, imported: 0 };
  if (!provider || !tokenKey) {
    return summary;
  }
  const accounts = await prisma.account.findMany({
    where: { accessTokenEncrypted: { not: null } },
    orderBy: { id: 'asc' },
  });
  for (const account of accounts) {
    const { businessId } = account;
    // Confere antes de cada sincronização, nunca antes de um lote inteiro (regra 5).
    if (!(await isConsentActive(prisma, businessId, 'OPEN_FINANCE'))) {
      summary.withoutConsent += 1;
      continue;
    }
    const transactions = await provider.listTransactions({
      accessToken: decryptToken(account.accessTokenEncrypted ?? '', tokenKey),
      externalRef: account.externalRef,
      since: account.lastSyncedAt,
    });
    const rules = await prisma.classificationRule.findMany({
      where: { businessId },
      select: { pattern: true, label: true },
    });
    const { count } = await prisma.transaction.createMany({
      skipDuplicates: true,
      data: transactions
        .filter((t) => isDecimalString(t.amount))
        .map((t) => {
          const classification = classifyTransaction(t.description, toCents(t.amount), rules);
          return {
            businessId,
            accountId: account.id,
            date: fromIsoDate(t.date),
            amount: t.amount,
            description: t.description.slice(0, 255),
            category: classification.category,
            label: classification.label,
            labelSource: classification.source,
            dedupKey: createHash('sha256')
              .update(`openfinance|${account.id}|${t.externalId}`)
              .digest('hex'),
          };
        }),
    });
    await prisma.account.update({
      where: { id: account.id },
      data: { lastSyncedAt: new Date() },
    });
    if (count > 0) {
      await prisma.business.update({
        where: { id: businessId },
        data: { forecastDirtyAt: new Date() },
      });
    }
    summary.synced += 1;
    summary.imported += count;
  }
  return summary;
}
