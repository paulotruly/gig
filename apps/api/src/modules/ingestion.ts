import { createHash } from 'node:crypto';
import { isConsentActive } from '@gig/db';
import { classifyTransaction, fromIsoDate, toCents } from '@gig/shared';
import { statementQuery } from '@gig/shared/contracts';
import express, { Router } from 'express';
import type { RouterDeps } from '../deps';
import { HttpError } from '../errors';
import { audit, parse, parseId } from '../http';
import { currentUserId, requireBusinessRole } from '../middlewares/auth';
import { parseCsv, parseOfx } from './statement-parsers';

const CHUNK_SIZE = 1000;

export function ingestionRouter({ prisma, authenticate }: RouterDeps): Router {
  const router = Router();

  router.post(
    '/businesses/:id/statements',
    authenticate,
    express.text({ type: ['text/csv', 'text/plain', 'application/x-ofx'], limit: '5mb' }),
    async (req, res) => {
      const userId = currentUserId(req);
      const businessId = parseId(req.params.id);
      await requireBusinessRole(prisma, userId, businessId, ['OWNER', 'ACCOUNTANT']);
      if (!(await isConsentActive(prisma, businessId, 'ASSISTED_INGESTION'))) {
        throw new HttpError(
          403,
          'consent_required',
          'O dono do negócio precisa autorizar a entrada de extratos.',
        );
      }
      const { format } = parse(statementQuery, req.query);
      if (typeof req.body !== 'string' || req.body.length === 0) {
        throw new HttpError(400, 'invalid_statement', 'Envie o texto do arquivo no corpo.');
      }
      // Tudo é validado antes de gravar: um arquivo com erro não importa nada.
      const parsed = format === 'csv' ? parseCsv(req.body) : parseOfx(req.body);
      const rules = await prisma.classificationRule.findMany({
        where: { businessId },
        select: { pattern: true, label: true },
      });
      const fileHash = createHash('sha256').update(req.body).digest('hex');

      const result = await prisma.$transaction(
        async (tx) => {
          const statementImport = await tx.statementImport.create({
            data: {
              businessId,
              userId,
              format,
              fileHash,
              rowsTotal: parsed.length,
              rowsImported: 0,
            },
          });
          let imported = 0;
          for (let i = 0; i < parsed.length; i += CHUNK_SIZE) {
            const { count } = await tx.transaction.createMany({
              skipDuplicates: true,
              data: parsed.slice(i, i + CHUNK_SIZE).map((item) => {
                const classification = classifyTransaction(
                  item.description,
                  toCents(item.amount),
                  rules,
                );
                return {
                  businessId,
                  importId: statementImport.id,
                  date: fromIsoDate(item.date),
                  amount: item.amount,
                  description: item.description,
                  category: classification.category,
                  label: classification.label,
                  labelSource: classification.source,
                  dedupKey: item.dedupKey,
                };
              }),
            });
            imported += count;
          }
          await tx.statementImport.update({
            where: { id: statementImport.id },
            data: { rowsImported: imported },
          });
          if (imported > 0) {
            await tx.business.update({
              where: { id: businessId },
              data: { forecastDirtyAt: new Date() },
            });
          }
          await audit(tx, {
            actorUserId: userId,
            businessId,
            action: 'statement.import',
            targetType: 'statement_import',
            targetId: statementImport.id,
          });
          return { importId: statementImport.id, imported };
        },
        { timeout: 60_000 },
      );

      res.status(201).json({
        importId: result.importId,
        rowsTotal: parsed.length,
        rowsImported: result.imported,
        duplicates: parsed.length - result.imported,
      });
    },
  );

  return router;
}
