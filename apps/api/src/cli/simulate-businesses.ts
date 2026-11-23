import { createPrisma } from '@gig/db';
import { simulateEmptyBusinesses } from '../modules/simulation';

// Simula os negócios criados antes do ambiente simulado (027). A saída não traz valores (regra 7).
async function main() {
  const args = process.argv.slice(2);
  const databaseUrl = process.env.DATABASE_URL;
  const unknown = args.filter((a) => a !== '--dry-run');
  if (!databaseUrl || unknown.length > 0) {
    console.error('Uso: simulate-businesses [--dry-run]');
    console.error('A variável DATABASE_URL é obrigatória.');
    process.exit(1);
  }
  const dryRun = args.includes('--dry-run');
  const prisma = createPrisma(databaseUrl);
  try {
    const runs = await simulateEmptyBusinesses(prisma, { dryRun });
    for (const run of runs) {
      console.log(
        dryRun
          ? `Negócio ${run.businessId}: vazio, seria simulado.`
          : `Negócio ${run.businessId}: ${run.scenario} (semente ${run.seed}).`,
      );
    }
    console.log(
      dryRun
        ? `${runs.length} negócio(s) vazio(s) seriam simulados.`
        : `${runs.length} negócio(s) simulado(s).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
