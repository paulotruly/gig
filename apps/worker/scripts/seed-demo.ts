// Dados fictícios para ver o app com um negócio completo. Só para bancos locais (funcionalidade 019).
import { createHash } from 'node:crypto';
import { createPrisma } from '@gig/db';
import {
  addDays,
  addMonths,
  classifyTransaction,
  dateInMonth,
  fromIsoDate,
  monthOf,
  toCents,
} from '@gig/shared';
import argon2 from 'argon2';
import { recalculateBusiness } from '../src/recalculate';

const DEMO_EMAIL = 'demo@gig.local';
const DEMO_PASSWORD = 'demonstracao-gig';
const HISTORY_MONTHS = 6;

type Entry = { day: number; description: string; amounts: readonly string[] };

// Cada lista tem um valor por mês, do mais antigo ao atual; "0" pula o mês.
const MONTHLY_ENTRIES: readonly Entry[] = [
  { day: 3, description: 'PIX RECEBIDO ACME TECNOLOGIA', amounts: ['3500.00'] },
  {
    day: 10,
    description: 'PIX RECEBIDO PADARIA BOM GOSTO',
    amounts: ['1800.00', '2200.00', '1500.00', '2600.00', '2000.00', '2400.00', '2100.00'],
  },
  {
    day: 18,
    description: 'TED RECEBIDA STUDIO NORTE',
    amounts: ['1200.00', '0', '1600.00', '900.00', '1400.00', '1100.00', '1300.00'],
  },
  {
    day: 25,
    description: 'PIX RECEBIDO CLINICA VIDA',
    amounts: ['900.00', '1300.00', '800.00', '1500.00', '1000.00', '1200.00', '1100.00'],
  },
  { day: 5, description: 'ALUGUEL COWORKING CENTRO', amounts: ['-1200.00'] },
  { day: 8, description: 'ASSINATURA ADOBE CREATIVE CLOUD', amounts: ['-124.90'] },
  {
    day: 12,
    description: 'FORNECEDOR GRAFICA RAPIDA',
    amounts: ['-380.00', '-450.00', '-300.00', '-520.00', '-410.00', '-390.00', '-430.00'],
  },
  { day: 15, description: 'PRO LABORE', amounts: ['-1500.00'] },
  { day: 20, description: 'PGTO DAS MEI', amounts: ['-75.90'] },
  { day: 22, description: 'INTERNET FIBRA ESCRITORIO', amounts: ['-119.90'] },
  {
    day: 9,
    description: 'FARMACIA SAO PAULO',
    amounts: ['-86.40', '-42.90', '-120.00', '-65.30', '-98.75', '-54.10', '-77.80'],
  },
  {
    day: 14,
    description: 'SUPERMERCADO EXTRA',
    amounts: ['-232.15', '-198.60', '-276.40', '-210.00', '-245.90', '-188.30', '-221.70'],
  },
  {
    day: 27,
    description: 'RESTAURANTE SABOR CASEIRO',
    amounts: ['-64.00', '-58.50', '-72.30', '-49.90', '-81.20', '-60.00', '-66.40'],
  },
];

function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

// Próxima data com o dia pedido, a partir de amanhã.
function nextOn(day: number, asOf: string): string {
  const thisMonth = dateInMonth(monthOf(asOf), day);
  return thisMonth > asOf ? thisMonth : dateInMonth(addMonths(monthOf(asOf), 1), day);
}

function buildTransactions(asOf: string) {
  const firstMonth = addMonths(monthOf(asOf), -HISTORY_MONTHS);
  const rows = [];
  for (let index = 0; index <= HISTORY_MONTHS; index += 1) {
    const month = addMonths(firstMonth, index);
    for (const entry of MONTHLY_ENTRIES) {
      const amount = entry.amounts[Math.min(index, entry.amounts.length - 1)] ?? '0';
      const date = dateInMonth(month, entry.day);
      // O mês corrente só vai até ontem, como um extrato baixado hoje.
      if (amount === '0' || date >= asOf) continue;
      const classification = classifyTransaction(entry.description, toCents(amount));
      rows.push({
        date: fromIsoDate(date),
        amount,
        description: entry.description,
        category: classification.category,
        label: classification.label,
        labelSource: classification.source,
        dedupKey: createHash('sha256')
          .update(`seed-demo:${date}:${entry.description}:${amount}`)
          .digest('hex'),
      });
    }
  }
  return rows;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('A seed de demonstração não roda em produção.');
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.startsWith('mysql://')) {
    throw new Error('Defina DATABASE_URL no .env da raiz (veja o .env.example).');
  }

  const prisma = createPrisma(databaseUrl);
  try {
    if (await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })) {
      console.log(`O usuário ${DEMO_EMAIL} já existe; nada foi alterado.`);
      console.log('Para recomeçar, recrie o banco local e rode as migrações.');
      return;
    }

    const asOf = today();
    const passwordHash = await argon2.hash(DEMO_PASSWORD);
    const transactions = buildTransactions(asOf);

    const businessId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: 'Ester Demonstração', email: DEMO_EMAIL, passwordHash },
      });
      const business = await tx.business.create({
        data: {
          name: 'Studio Criativo Demo',
          type: 'MEI',
          cashBalance: '4220.00',
          cashBalanceDate: fromIsoDate(asOf),
          forecastDirtyAt: new Date(),
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
      });
      await tx.consent.create({
        data: {
          businessId: business.id,
          consentRef: `seed-demo-${business.id}`,
          purpose: 'ASSISTED_INGESTION',
          scope: 'Extratos enviados pelo app (CSV e OFX)',
          status: 'GRANTED',
          grantedAt: new Date(),
          createdByUserId: user.id,
        },
      });
      await tx.transaction.createMany({
        data: transactions.map((t) => ({ ...t, businessId: business.id })),
      });
      const monthly = (description: string, amount: string, day: number) =>
        ({
          businessId: business.id,
          type: 'FIXED_EXPENSE',
          description,
          amount,
          dueDate: fromIsoDate(nextOn(day, asOf)),
          recurrence: 'MONTHLY',
        }) as const;
      await tx.commitment.createMany({
        data: [
          monthly('DAS MEI', '75.90', 20),
          monthly('Aluguel do coworking', '1200.00', 5),
          monthly('Honorários do contador', '180.00', 10),
          {
            businessId: business.id,
            type: 'RECEIVABLE',
            description: 'Projeto de identidade visual Beta',
            amount: '2400.00',
            dueDate: fromIsoDate(addDays(asOf, 12)),
            recurrence: 'NONE',
          },
        ],
      });
      return business.id;
    });

    // A previsão e os alertas saem do mesmo cálculo do worker, nunca de valores fixos.
    const outcome = await recalculateBusiness(prisma, businessId, asOf);
    const alerts = await prisma.alert.count({ where: { businessId } });

    console.log(`Negócio de demonstração criado com ${transactions.length} transações.`);
    console.log(`Previsão: ${outcome}; alertas: ${alerts}.`);
    console.log(`Entre com ${DEMO_EMAIL} e a senha ${DEMO_PASSWORD}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
