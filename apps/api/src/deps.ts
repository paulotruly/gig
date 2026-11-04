import type { PrismaClient } from '@gig/db';
import type { WhatsAppSender } from '@gig/shared';
import type { RequestHandler } from 'express';
import type { Config } from './config';

export type Deps = {
  prisma: PrismaClient;
  // Em produção, conexão com usuário somente leitura de partner_metrics (regra 4).
  partnerMetricsDb: PrismaClient;
  config: Config;
  whatsapp: WhatsAppSender;
};

export type RouterDeps = Deps & { authenticate: RequestHandler };
