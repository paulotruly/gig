import type { PrismaClient, Prisma } from '@gig/db';
import { z } from 'zod';
import { HttpError } from './errors';

export function parse<Schema extends z.ZodType>(schema: Schema, data: unknown): z.output<Schema> {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Cita o campo, nunca o valor recebido.
    const fields = [...new Set(result.error.issues.map((i) => i.path.join('.') || 'corpo'))];
    throw new HttpError(400, 'invalid_request', `Dados inválidos em: ${fields.join(', ')}.`);
  }
  return result.data;
}

const idSchema = z.coerce.number().int().positive().max(2_147_483_647);

export function parseId(value: unknown): number {
  const result = idSchema.safeParse(value);
  if (!result.success) {
    throw new HttpError(404, 'not_found', 'Recurso não encontrado.');
  }
  return result.data;
}

type AuditEntry = {
  actorUserId?: number | null;
  businessId?: number | null;
  action: string;
  targetType?: string;
  targetId?: string | number;
};

type Db = PrismaClient | Prisma.TransactionClient;

// Registra quem fez o quê, sem valores nem descrições (regras 7 e 9).
export async function audit(db: Db, entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      actorUserId: entry.actorUserId ?? null,
      businessId: entry.businessId ?? null,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId === undefined ? null : String(entry.targetId),
    },
  });
}

export async function recordUsageEvent(
  db: Db,
  businessId: number,
  event: 'CONSENT_GRANTED' | 'FIRST_FORECAST_VIEWED' | 'WEEKLY_OPEN' | 'TRACK_COMPLETED',
  dedupeKey: string,
): Promise<void> {
  await db.usageEvent.createMany({
    data: [{ businessId, event, dedupeKey }],
    skipDuplicates: true,
  });
}
