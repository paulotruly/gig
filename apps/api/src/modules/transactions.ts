import {
  categoryFor,
  fromIsoDate,
  normalizeDescription,
  originOf,
  toCents,
  toIsoDate,
} from '@gig/shared';
import { listTransactionsQuery, patchTransactionBody } from '@gig/shared/contracts';
import { Router } from 'express';
import type { RouterDeps } from '../deps';
import { notFoundError } from '../errors';
import { audit, parse, parseId } from '../http';
import { currentUserId, requireBusinessRole } from '../middlewares/auth';

export function transactionsRouter({ prisma, authenticate }: RouterDeps): Router {
  const router = Router();

  router.get('/businesses/:id/transactions', authenticate, async (req, res) => {
    const userId = currentUserId(req);
    const businessId = parseId(req.params.id);
    await requireBusinessRole(prisma, userId, businessId);
    const query = parse(listTransactionsQuery, req.query);
    const where = {
      businessId,
      date: {
        ...(query.from ? { gte: fromIsoDate(query.from) } : {}),
        ...(query.to ? { lte: fromIsoDate(query.to) } : {}),
      },
    };
    const [total, rows] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    await audit(prisma, { actorUserId: userId, businessId, action: 'transactions.list' });
    res.json({
      total,
      page: query.page,
      pageSize: query.pageSize,
      transactions: rows.map((t) => ({
        id: t.id,
        date: toIsoDate(t.date),
        amount: t.amount.toFixed(2),
        description: t.description,
        category: t.category,
        label: t.label,
        origin: originOf(t.label),
        labelSource: t.labelSource,
        userCorrected: t.userCorrected,
      })),
    });
  });

  router.patch('/transactions/:id', authenticate, async (req, res) => {
    const userId = currentUserId(req);
    const body = parse(patchTransactionBody, req.body);
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: parseId(req.params.id),
        business: { members: { some: { userId, role: 'OWNER' } } },
      },
    });
    if (!transaction) {
      throw notFoundError();
    }
    const { businessId } = transaction;
    const pattern = normalizeDescription(transaction.description);

    const updated = await prisma.$transaction(
      async (tx) => {
        const result = await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            label: body.label,
            category: categoryFor(body.label, toCents(transaction.amount.toFixed(2))),
            labelSource: 'USER',
            userCorrected: true,
          },
        });
        if (pattern.length > 0) {
          await tx.classificationRule.upsert({
            where: { businessId_pattern: { businessId, pattern } },
            create: { businessId, pattern, label: body.label },
            update: { label: body.label },
          });
          // A correção alcança as parecidas, mas nunca outra correção feita à mão (regra 13).
          const candidates = await tx.transaction.findMany({
            where: { businessId, userCorrected: false },
            select: { id: true, description: true, amount: true },
          });
          const similar = candidates.filter((c) => normalizeDescription(c.description) === pattern);
          for (const sign of [1, -1]) {
            const ids = similar
              .filter((c) => Math.sign(c.amount.toNumber()) === sign)
              .map((c) => c.id);
            if (ids.length > 0) {
              await tx.transaction.updateMany({
                where: { id: { in: ids }, businessId },
                data: {
                  label: body.label,
                  category: categoryFor(body.label, sign),
                  labelSource: 'LEARNED',
                },
              });
            }
          }
        }
        await tx.business.update({
          where: { id: businessId },
          data: { forecastDirtyAt: new Date() },
        });
        await audit(tx, {
          actorUserId: userId,
          businessId,
          action: 'transaction.correct',
          targetType: 'transaction',
          targetId: transaction.id,
        });
        return result;
      },
      { timeout: 60_000 },
    );

    res.json({
      id: updated.id,
      date: toIsoDate(updated.date),
      amount: updated.amount.toFixed(2),
      description: updated.description,
      category: updated.category,
      label: updated.label,
      origin: originOf(updated.label),
      labelSource: updated.labelSource,
      userCorrected: updated.userCorrected,
    });
  });

  return router;
}
