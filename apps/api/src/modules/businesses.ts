import { addMemberBody, cashBalanceBody, createBusinessBody } from '@gig/shared/contracts';
import { fromIsoDate, toIsoDate } from '@gig/shared';
import { Router } from 'express';
import type { RouterDeps } from '../deps';
import { HttpError, notFoundError } from '../errors';
import { audit, parse, parseId } from '../http';
import { currentUserId, requireBusinessRole } from '../middlewares/auth';

export function businessesRouter({ prisma, authenticate }: RouterDeps): Router {
  const router = Router();
  router.use('/businesses', authenticate);

  router.post('/businesses', async (req, res) => {
    const userId = currentUserId(req);
    const body = parse(createBusinessBody, req.body);
    let partnerId: number | null = null;
    if (body.partnerCode) {
      const partner = await prisma.partner.findUnique({ where: { joinCode: body.partnerCode } });
      if (!partner) {
        throw new HttpError(400, 'invalid_partner_code', 'Código de parceiro inválido.');
      }
      partnerId = partner.id;
    }
    const business = await prisma.business.create({
      data: {
        name: body.name,
        type: body.type,
        partnerId,
        members: { create: { userId, role: 'OWNER' } },
      },
      select: { id: true, name: true, type: true },
    });
    await audit(prisma, {
      actorUserId: userId,
      businessId: business.id,
      action: 'business.create',
    });
    res.status(201).json(business);
  });

  router.get('/businesses', async (req, res) => {
    const members = await prisma.businessMember.findMany({
      where: { userId: currentUserId(req) },
      select: { role: true, business: { select: { id: true, name: true, type: true } } },
      orderBy: { businessId: 'asc' },
    });
    res.json({ businesses: members.map((m) => ({ ...m.business, role: m.role })) });
  });

  router.put('/businesses/:id/cash-balance', async (req, res) => {
    const userId = currentUserId(req);
    const businessId = parseId(req.params.id);
    await requireBusinessRole(prisma, userId, businessId);
    const body = parse(cashBalanceBody, req.body);
    if (body.date > toIsoDate(new Date())) {
      throw new HttpError(400, 'invalid_request', 'A data do saldo não pode estar no futuro.');
    }
    await prisma.business.update({
      where: { id: businessId },
      data: {
        cashBalance: body.amount,
        cashBalanceDate: fromIsoDate(body.date),
        forecastDirtyAt: new Date(),
      },
    });
    await audit(prisma, { actorUserId: userId, businessId, action: 'business.cash_balance' });
    res.status(204).end();
  });

  router.post('/businesses/:id/members', async (req, res) => {
    const userId = currentUserId(req);
    const businessId = parseId(req.params.id);
    await requireBusinessRole(prisma, userId, businessId);
    const body = parse(addMemberBody, req.body);
    const accountant = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: { id: true },
    });
    if (!accountant) {
      throw new HttpError(404, 'user_not_found', 'Não há usuário com esse e-mail.');
    }
    const existing = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: accountant.id } },
    });
    if (existing) {
      throw new HttpError(409, 'already_member', 'Esse usuário já tem acesso ao negócio.');
    }
    await prisma.businessMember.create({
      data: { businessId, userId: accountant.id, role: 'ACCOUNTANT' },
    });
    await audit(prisma, {
      actorUserId: userId,
      businessId,
      action: 'member.add',
      targetType: 'user',
      targetId: accountant.id,
    });
    res.status(201).json({ userId: accountant.id, role: 'ACCOUNTANT' });
  });

  router.delete('/businesses/:id/members/:userId', async (req, res) => {
    const userId = currentUserId(req);
    const businessId = parseId(req.params.id);
    const targetUserId = parseId(req.params.userId);
    await requireBusinessRole(prisma, userId, businessId);
    const { count } = await prisma.businessMember.deleteMany({
      where: { businessId, userId: targetUserId, role: 'ACCOUNTANT' },
    });
    if (count === 0) {
      throw notFoundError();
    }
    await audit(prisma, {
      actorUserId: userId,
      businessId,
      action: 'member.remove',
      targetType: 'user',
      targetId: targetUserId,
    });
    res.status(204).end();
  });

  return router;
}
