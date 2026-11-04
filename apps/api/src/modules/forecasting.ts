import type { Prisma, PrismaClient } from '@gig/db';
import { addDays, toIsoDate } from '@gig/shared';
import { forecastResponse, type ForecastResponse } from '@gig/shared/contracts';
import { Router } from 'express';
import type { RouterDeps } from '../deps';
import { HttpError } from '../errors';
import { audit, parseId, recordUsageEvent } from '../http';
import { currentUserId, requireBusinessRole } from '../middlewares/auth';

type ForecastWithScenarios = Prisma.ForecastGetPayload<{ include: { scenarios: true } }>;

function scenarioResponse(forecast: ForecastWithScenarios, name: string) {
  const scenario = forecast.scenarios.find((s) => s.scenario === name);
  if (!scenario) {
    throw new Error('Previsão sem um dos cenários.');
  }
  return {
    endBalance: scenario.endBalance.toFixed(2),
    firstNegativeDate: scenario.firstNegativeDate ? toIsoDate(scenario.firstNegativeDate) : null,
    runway: {
      months: scenario.runwayMonths ? scenario.runwayMonths.toFixed(1) : null,
      status: scenario.runwayStatus === 'FINITE' ? ('finite' as const) : ('not_burning' as const),
    },
  };
}

export function toForecastResponse(forecast: ForecastWithScenarios): ForecastResponse {
  return forecastResponse.parse({
    businessId: forecast.businessId,
    generatedAt: toIsoDate(forecast.asOf),
    horizonWeeks: forecast.horizonWeeks,
    scenarios: {
      conservative: scenarioResponse(forecast, 'CONSERVATIVE'),
      likely: scenarioResponse(forecast, 'LIKELY'),
      favorable: scenarioResponse(forecast, 'FAVORABLE'),
    },
    safeWithdrawal: forecast.safeWithdrawal.toFixed(2),
    explanation: forecast.explanation,
    rulesVersion: forecast.rulesVersion,
  });
}

export function latestForecast(
  prisma: PrismaClient,
  businessId: number,
): Promise<ForecastWithScenarios | null> {
  return prisma.forecast.findFirst({
    where: { businessId },
    orderBy: { id: 'desc' },
    include: { scenarios: true },
  });
}

function weekKey(date: Date): string {
  const iso = toIsoDate(date);
  const weekday = (date.getUTCDay() + 6) % 7;
  return addDays(iso, -weekday);
}

export function forecastingRouter({ prisma, authenticate }: RouterDeps): Router {
  const router = Router();

  router.get('/businesses/:id/forecast', authenticate, async (req, res) => {
    const userId = currentUserId(req);
    const businessId = parseId(req.params.id);
    await requireBusinessRole(prisma, userId, businessId);
    const forecast = await latestForecast(prisma, businessId);
    if (!forecast) {
      throw new HttpError(
        404,
        'forecast_not_ready',
        'Ainda não há previsão. Ela depende do saldo informado e de ao menos 3 meses de extrato.',
      );
    }
    await audit(prisma, {
      actorUserId: userId,
      businessId,
      action: 'forecast.view',
      targetType: 'forecast',
      targetId: forecast.id,
    });
    await recordUsageEvent(prisma, businessId, 'FIRST_FORECAST_VIEWED', 'first_forecast_viewed');
    await recordUsageEvent(prisma, businessId, 'WEEKLY_OPEN', `weekly_open:${weekKey(new Date())}`);
    res.json(toForecastResponse(forecast));
  });

  return router;
}
