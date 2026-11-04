import { createHmac, timingSafeEqual } from 'node:crypto';
import { isConsentActive } from '@gig/db';
import { whatsappWebhookBody } from '@gig/shared/contracts';
import { Router, type Request } from 'express';
import type { Deps } from '../deps';
import { errorBody, HttpError } from '../errors';
import { parse } from '../http';
import { latestForecast, toForecastResponse } from './forecasting';

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function validSignature(req: Request, secret: string): boolean {
  const header = req.get('x-hub-signature-256');
  if (!header || !req.rawBody) {
    return false;
  }
  const expected = `sha256=${createHmac('sha256', secret).update(req.rawBody).digest('hex')}`;
  return safeEqual(header, expected);
}

function money(value: string): string {
  return `R$ ${value.replace('.', ',')}`;
}

export function whatsappRouter({ prisma, config, whatsapp }: Deps): Router {
  const router = Router();
  const detailLink = `${config.APP_BASE_URL}/previsao`;
  const consentLink = `${config.APP_BASE_URL}/consentimentos`;

  async function replyFor(phone: string): Promise<string> {
    const generic = `Para receber sua previsão por aqui, autorize o canal no app: ${consentLink}`;
    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        businessMembers: {
          where: { role: 'OWNER' },
          orderBy: { businessId: 'asc' },
          take: 1,
          select: { businessId: true },
        },
      },
    });
    const businessId = user?.businessMembers[0]?.businessId;
    // Sem consentimento ativo, a resposta não traz nenhum dado financeiro.
    if (!businessId || !(await isConsentActive(prisma, businessId, 'WHATSAPP_NOTIFICATIONS'))) {
      return generic;
    }
    const forecast = await latestForecast(prisma, businessId);
    if (!forecast) {
      return `Sua previsão ainda não está pronta. Acompanhe no app: ${detailLink}`;
    }
    const data = toForecastResponse(forecast);
    return [
      `Retirada segura: ${money(data.safeWithdrawal)}.`,
      `Saldo em ${data.horizonWeeks} semanas: de ${money(data.scenarios.conservative.endBalance)} a ${money(data.scenarios.favorable.endBalance)}.`,
      `Detalhes: ${detailLink}`,
    ].join('\n');
  }

  router.get('/webhooks/whatsapp', (req, res) => {
    const verifyToken = config.WHATSAPP_VERIFY_TOKEN;
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    if (
      !verifyToken ||
      mode !== 'subscribe' ||
      typeof token !== 'string' ||
      !safeEqual(token, verifyToken) ||
      typeof challenge !== 'string' ||
      !/^[\w-]{1,128}$/.test(challenge)
    ) {
      res.status(403).json(errorBody('forbidden', 'Verificação recusada.'));
      return;
    }
    res.type('text/plain').send(challenge);
  });

  router.post('/webhooks/whatsapp', async (req, res) => {
    const secret = config.WHATSAPP_APP_SECRET;
    if (!secret) {
      throw new HttpError(503, 'channel_unavailable', 'Canal indisponível.');
    }
    if (!validSignature(req, secret)) {
      throw new HttpError(401, 'invalid_signature', 'Assinatura inválida.');
    }
    const body = parse(whatsappWebhookBody, req.body);
    const messages = body.entry.flatMap((entry) =>
      entry.changes.flatMap((change) => change.value.messages ?? []),
    );
    for (const message of messages) {
      // O provedor reenvia mensagens: a chave única garante uma só resposta (regra 18).
      const { count } = await prisma.whatsappMessage.createMany({
        data: [{ externalId: message.id }],
        skipDuplicates: true,
      });
      if (count === 0) {
        continue;
      }
      try {
        await whatsapp.send(message.from, await replyFor(message.from));
      } catch (err) {
        req.log.error(
          { errorName: err instanceof Error ? err.name : typeof err },
          'falha no envio',
        );
      }
    }
    res.status(200).json({ received: messages.length });
  });

  return router;
}
