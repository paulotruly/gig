import { randomUUID } from 'node:crypto';
import { createConsentBody } from '@gig/shared/contracts';
import { Router } from 'express';
import type { RouterDeps } from '../deps';
import { HttpError, notFoundError } from '../errors';
import { audit, parse, parseId, recordUsageEvent } from '../http';
import { currentUserId, requireBusinessRole } from '../middlewares/auth';

export function consentsRouter({ prisma, authenticate }: RouterDeps): Router {
  const router = Router();

  router.post('/consents', authenticate, async (req, res) => {
    const userId = currentUserId(req);
    const body = parse(createConsentBody, req.body);
    await requireBusinessRole(prisma, userId, body.businessId);
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (expiresAt && expiresAt <= new Date()) {
      throw new HttpError(400, 'invalid_request', 'A expiração precisa estar no futuro.');
    }
    const consent = await prisma.consent.create({
      data: {
        businessId: body.businessId,
        consentRef: randomUUID(),
        purpose: body.purpose,
        scope: body.scope,
        status: 'GRANTED',
        grantedAt: new Date(),
        expiresAt,
        createdByUserId: userId,
      },
    });
    await audit(prisma, {
      actorUserId: userId,
      businessId: body.businessId,
      action: 'consent.grant',
      targetType: 'consent',
      targetId: consent.id,
    });
    await recordUsageEvent(
      prisma,
      body.businessId,
      'CONSENT_GRANTED',
      `consent_granted:${consent.consentRef}`,
    );
    // Conceder a entrada de dados pode liberar a primeira previsão.
    await prisma.business.update({
      where: { id: body.businessId },
      data: { forecastDirtyAt: new Date() },
    });
    res.status(201).json({
      id: consent.id,
      businessId: consent.businessId,
      purpose: consent.purpose,
      scope: consent.scope,
      status: consent.status,
      grantedAt: consent.grantedAt,
      expiresAt: consent.expiresAt,
    });
  });

  router.delete('/consents/:id', authenticate, async (req, res) => {
    const userId = currentUserId(req);
    const original = await prisma.consent.findUnique({ where: { id: parseId(req.params.id) } });
    if (!original) {
      throw notFoundError();
    }
    await requireBusinessRole(prisma, userId, original.businessId);
    const latest = await prisma.consent.findFirstOrThrow({
      where: { consentRef: original.consentRef },
      orderBy: { id: 'desc' },
    });
    if (latest.status === 'REVOKED') {
      res.status(204).end();
      return;
    }
    // Revogar é inserir outra linha: o histórico nunca é alterado (regra 5).
    const revocation = await prisma.consent.create({
      data: {
        businessId: original.businessId,
        consentRef: original.consentRef,
        purpose: original.purpose,
        scope: original.scope,
        status: 'REVOKED',
        grantedAt: original.grantedAt,
        expiresAt: original.expiresAt,
        revokedAt: new Date(),
        createdByUserId: userId,
      },
    });
    await audit(prisma, {
      actorUserId: userId,
      businessId: original.businessId,
      action: 'consent.revoke',
      targetType: 'consent',
      targetId: revocation.id,
    });
    res.status(204).end();
  });

  router.get('/businesses/:id/consents', authenticate, async (req, res) => {
    const businessId = parseId(req.params.id);
    await requireBusinessRole(prisma, currentUserId(req), businessId);
    const consents = await prisma.consent.findMany({
      where: { businessId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        consentRef: true,
        purpose: true,
        scope: true,
        status: true,
        grantedAt: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
    res.json({ consents });
  });

  return router;
}
