// Mudar qualquer valor deste arquivo exige nova versão das regras (regra 13).
export const RULES_VERSION = '1.0.0';

export const FORECAST_PARAMS = {
  minHistoryMonths: 3,
  windowMonths: 6,
  horizonWeeks: 4,
  extraordinaryMultiplier: 3,
  extraordinaryMinTransactions: 3,
} as const;

export const ALERT_PARAMS = {
  conservativeNegativeDays: 15,
  lowRunwayMonths: 12,
  mixedAccountsPercent: 20,
} as const;

export const MIN_BUSINESSES_PER_INDICATOR = 5;
