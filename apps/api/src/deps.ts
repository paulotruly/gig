import type { PrismaClient } from '@gig/db';
import type { WhatsAppSender } from '@gig/shared';
import type { RequestHandler } from 'express';
import type { Config } from './config';

export type GoogleOAuth = {
  exchangeCode(input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
  }): Promise<{ id_token: string }>;
};

export type Deps = {
  googleOAuth?: GoogleOAuth;
  prisma: PrismaClient;
  // Em produção, conexão com usuário somente leitura de partner_metrics (regra 4).
  partnerMetricsDb: PrismaClient;
  config: Config;
  whatsapp: WhatsAppSender;
};

export type RouterDeps = Deps & { authenticate: RequestHandler };
