import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, type ConsentPurpose } from '@prisma/client';

export * from '@prisma/client';

export function createPrisma(databaseUrl: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
}

// Cada mudança é uma nova linha: vale a linha mais recente de cada consentimento.
export async function isConsentActive(
  prisma: PrismaClient,
  businessId: number,
  purpose: ConsentPurpose,
  now: Date = new Date(),
): Promise<boolean> {
  const rows = await prisma.consent.findMany({
    where: { businessId, purpose },
    orderBy: { id: 'desc' },
    select: { consentRef: true, status: true, expiresAt: true },
  });
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.consentRef)) {
      continue;
    }
    seen.add(row.consentRef);
    if (row.status === 'GRANTED' && (row.expiresAt === null || row.expiresAt > now)) {
      return true;
    }
  }
  return false;
}
