import { isConsentActive, type PrismaClient } from '@gig/db';
import { divRound, fromCents, MIN_BUSINESSES_PER_INDICATOR } from '@gig/shared';

function percent(part: number, total: number): string {
  return fromCents(divRound(part * 10_000, total));
}

export async function computePartnerMetrics(prisma: PrismaClient, period: string) {
  const partners = await prisma.partner.findMany({ select: { id: true } });
  let published = 0;

  for (const partner of partners) {
    const businesses = await prisma.business.findMany({
      where: { partnerId: partner.id },
      select: { id: true },
    });
    const eligible: number[] = [];
    for (const business of businesses) {
      if (await isConsentActive(prisma, business.id, 'PARTNER_AGGREGATES')) {
        eligible.push(business.id);
      }
    }

    // Abaixo do mínimo, nada é publicado e indicadores antigos do período somem (regra 4).
    if (eligible.length < MIN_BUSINESSES_PER_INDICATOR) {
      await prisma.partnerMetric.deleteMany({ where: { partnerId: partner.id, period } });
      continue;
    }

    const withForecast = await prisma.forecast.findMany({
      where: { businessId: { in: eligible } },
      distinct: ['businessId'],
      select: { businessId: true },
    });
    const learners = await prisma.trackProgress.findMany({
      where: { businessId: { in: eligible }, percent: 100 },
      distinct: ['businessId'],
      select: { businessId: true },
    });

    const indicators = [
      { indicator: 'active_businesses', value: fromCents(eligible.length * 100) },
      {
        indicator: 'businesses_with_forecast_percent',
        value: percent(withForecast.length, eligible.length),
      },
      {
        indicator: 'businesses_completed_track_percent',
        value: percent(learners.length, eligible.length),
      },
    ];
    for (const { indicator, value } of indicators) {
      await prisma.partnerMetric.upsert({
        where: { partnerId_period_indicator: { partnerId: partner.id, period, indicator } },
        create: { partnerId: partner.id, period, indicator, value, businessCount: eligible.length },
        update: { value, businessCount: eligible.length },
      });
      published += 1;
    }
  }
  return { published };
}
