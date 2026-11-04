import { originOf, type Label } from './classification';
import { addMonths, daysBetween, monthOf } from './dates';
import { toCents } from './money';
import type { Forecast } from './forecast';
import { ALERT_PARAMS, FORECAST_PARAMS } from './params';

export type AlertRuleId =
  'conservative_negative_soon' | 'likely_negative_in_horizon' | 'low_runway' | 'mixed_accounts';

export type AlertCandidate = {
  ruleId: AlertRuleId;
  referenceDate: string;
  trackSlug: string;
  message: string;
  explanation: string;
  data: Record<string, string | number>;
};

export type AlertInput = {
  forecast: Forecast;
  businessType: 'MEI' | 'ME' | 'STARTUP' | 'SERVICE_PROVIDER';
  transactions: readonly { date: string; amount: string; label: Label }[];
};

function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function mixedAccountsPercent(input: AlertInput): number {
  const asOfMonth = monthOf(input.forecast.asOf);
  const firstMonth = addMonths(asOfMonth, -FORECAST_PARAMS.windowMonths);
  const outflows = input.transactions.filter((t) => {
    const month = monthOf(t.date);
    return toCents(t.amount) < 0 && month >= firstMonth && month < asOfMonth;
  });
  if (outflows.length === 0) {
    return 0;
  }
  const personal = outflows.filter((t) => originOf(t.label) === 'PERSONAL').length;
  return Math.floor((personal * 100) / outflows.length);
}

// As mensagens tratam a situação como condição do negócio, nunca como falha da pessoa (regra 16).
export function evaluateAlerts(input: AlertInput): AlertCandidate[] {
  const { forecast, businessType } = input;
  const { conservative, likely } = forecast.scenarios;
  const alerts: AlertCandidate[] = [];

  if (conservative.firstNegativeDate) {
    const days = daysBetween(forecast.asOf, conservative.firstNegativeDate);
    if (days <= ALERT_PARAMS.conservativeNegativeDays) {
      alerts.push({
        ruleId: 'conservative_negative_soon',
        referenceDate: conservative.firstNegativeDate,
        trackSlug: 'fluxo-de-caixa',
        message: `No cenário conservador, o caixa pode ficar negativo em ${formatDate(conservative.firstNegativeDate)}. Vale olhar os próximos vencimentos com antecedência.`,
        explanation: `Regra: saldo conservador negativo em até ${ALERT_PARAMS.conservativeNegativeDays} dias.`,
        data: {
          firstNegativeDate: conservative.firstNegativeDate,
          daysUntilNegative: days,
          endBalance: conservative.endBalance,
        },
      });
    }
  }

  if (likely.firstNegativeDate) {
    alerts.push({
      ruleId: 'likely_negative_in_horizon',
      referenceDate: likely.firstNegativeDate,
      trackSlug: 'fluxo-de-caixa',
      message: `No cenário provável, o caixa pode ficar negativo em ${formatDate(likely.firstNegativeDate)}. Antecipar recebimentos ou renegociar prazos pode ajudar.`,
      explanation: `Regra: saldo provável negativo nas próximas ${forecast.horizonWeeks} semanas.`,
      data: { firstNegativeDate: likely.firstNegativeDate, endBalance: likely.endBalance },
    });
  }

  const runwayMonths = likely.runway.months;
  if (
    businessType === 'STARTUP' &&
    runwayMonths !== null &&
    toCents(runwayMonths) < ALERT_PARAMS.lowRunwayMonths * 100
  ) {
    alerts.push({
      ruleId: 'low_runway',
      referenceDate: `${monthOf(forecast.asOf)}-01`,
      trackSlug: 'runway',
      message: `No cenário provável, o caixa cobre cerca de ${runwayMonths.replace('.', ',')} meses. A referência de mercado para o pré-seed é de 12 a 18 meses.`,
      explanation: `Regra: runway provável abaixo de ${ALERT_PARAMS.lowRunwayMonths} meses.`,
      data: { runwayMonths, referenceMonths: ALERT_PARAMS.lowRunwayMonths },
    });
  }

  const personalPercent = mixedAccountsPercent(input);
  if (personalPercent >= ALERT_PARAMS.mixedAccountsPercent) {
    alerts.push({
      ruleId: 'mixed_accounts',
      referenceDate: `${monthOf(forecast.asOf)}-01`,
      trackSlug: 'separar-contas',
      message: `Cerca de ${personalPercent}% das saídas recentes parecem pessoais. Separar aos poucos deixa a previsão mais precisa, e você pode corrigir qualquer classificação.`,
      explanation: `Regra: ao menos ${ALERT_PARAMS.mixedAccountsPercent}% das saídas da janela com origem pessoal.`,
      data: { personalPercent, referencePercent: ALERT_PARAMS.mixedAccountsPercent },
    });
  }

  return alerts;
}
