import { randomBytes } from 'node:crypto';
import { createPrisma, type PartnerType } from '@gig/db';
import { PARTNER_TYPES } from '@gig/shared/contracts';

// Parceiros entram por contrato, não por cadastro aberto: a criação é um comando de operação.
async function main() {
  const [name, type, email] = process.argv.slice(2);
  const databaseUrl = process.env.DATABASE_URL;
  if (!name || !email || !databaseUrl || !PARTNER_TYPES.includes(type as PartnerType)) {
    console.error(`Uso: create-partner <nome> <${PARTNER_TYPES.join('|')}> <e-mail do usuário>`);
    console.error(
      'A variável DATABASE_URL é obrigatória, e o usuário já precisa estar cadastrado.',
    );
    process.exit(1);
  }
  const prisma = createPrisma(databaseUrl);
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      console.error('Não há usuário com esse e-mail.');
      process.exit(1);
    }
    const partner = await prisma.partner.create({
      data: {
        name,
        type: type as PartnerType,
        joinCode: randomBytes(12).toString('base64url'),
        members: { create: { userId: user.id } },
      },
    });
    console.log(`Parceiro ${partner.id} criado. Código de adesão: ${partner.joinCode}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
