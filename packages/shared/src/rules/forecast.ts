import { originOf, type Label } from './classification';
import { addDays, addMonths, dateInMonth, monthOf } from './dates';
import { divRound, fromCents, toCents } from './money';
import { FORECAST_PARAMS, RULES_VERSION } from './params';

export type ForecastTransaction = {
  date: string;
  amount: string;
  label: Label;
  category: string;
};

export type ForecastCommitment = {
  type: 'FIXED_EXPENSE' | 'RECEIVABLE';
  amount: string;
  dueDate: string;
  recurrence: 'NONE' | 'MONTHLY';
};

export type ForecastInput = {
  asOf: string;
  cashBalance: string;
  transactions: readonly ForecastTransaction[];
  commitments: readonly ForecastCommitment[];
};

export const SCENARIOS = ['conservative', 'likely', 'favorable'] as const;
export type ScenarioName = (typeof SCENARIOS)[number];

export type Runway = { months: string | null; status: 'finite' | 'not_burning' };

export type ScenarioResult = {
  endBalance: string;
  firstNegativeDate: string | null;
  runway: Runway;
  monthlyRevenue: string;
  monthlyExpense: string;
};

export type Forecast = {
  status: 'ok';
  asOf: string;
  horizonWeeks: number;
  scenarios: Record<ScenarioName, ScenarioResult>;
  safeWithdrawal: string;
  explanation: string[];
  rulesVersion: string;
};

export type InsufficientHistory = {
  status: 'insufficient_history';
  monthsAvailable: number;
  monthsRequired: number;
};

const CENTS_PER_MONTH_DAYS = 30;

function sortedAscending(values: readonly number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

// Quartil por interpolação linear, em aritmética inteira (quarter: 1, 2 ou 3).
function quartile(values: readonly number[], quarter: 1 | 2 | 3): number {
  const sorted = sortedAscending(values);
  if (sorted.length === 0) {
    return 0;
  }
  const position = (sorted.length - 1) * quarter;
  const index = Math.floor(position / 4);
  const remainder = position % 4;
  const low = sorted[index] ?? 0;
  const high = sorted[index + 1] ?? low;
  return low + divRound((high - low) * remainder, 4);
}

function median(values: readonly number[]): number {
  return quartile(values, 2);
}

function windowMonths(asOf: string, transactions: readonly ForecastTransaction[]): string[] {
  const lastComplete = addMonths(monthOf(asOf), -1);
  const first = transactions.reduce<string | null>((earliest, t) => {
    const month = monthOf(t.date);
    return earliest === null || month < earliest ? month : earliest;
  }, null);
  if (first === null || first > lastComplete) {
    return [];
  }
  const months: string[] = [];
  for (
    let month = lastComplete;
    month >= first && months.length < FORECAST_PARAMS.windowMonths;
    month = addMonths(month, -1)
  ) {
    months.push(month);
  }
  return months.reverse();
}

function monthlyRevenues(txs: readonly ForecastTransaction[], months: readonly string[]): number[] {
  return months.map((month) =>
    txs
      .filter((t) => monthOf(t.date) === month)
      .map((t) => toCents(t.amount))
      .filter((cents) => cents > 0)
      .reduce((sum, cents) => sum + cents, 0),
  );
}

function expensePattern(
  txs: readonly ForecastTransaction[],
  months: readonly string[],
  withoutExtraordinary: boolean,
): number {
  const outflows = txs
    .map((t) => ({ ...t, cents: toCents(t.amount) }))
    .filter((t) => t.cents < 0)
    .map((t) => ({ category: t.category, month: monthOf(t.date), value: -t.cents }));

  let total = 0;
  for (const category of new Set(outflows.map((t) => t.category))) {
    let items = outflows.filter((t) => t.category === category);
    if (withoutExtraordinary && items.length >= FORECAST_PARAMS.extraordinaryMinTransactions) {
      const limit = median(items.map((t) => t.value)) * FORECAST_PARAMS.extraordinaryMultiplier;
      items = items.filter((t) => t.value <= limit);
    }
    total += median(
      months.map((month) =>
        items.filter((t) => t.month === month).reduce((sum, t) => sum + t.value, 0),
      ),
    );
  }
  return total;
}

type DatedAmount = { date: string; cents: number };

function occurrencesInHorizon(
  commitments: readonly ForecastCommitment[],
  type: ForecastCommitment['type'],
  asOf: string,
  horizonDays: number,
): DatedAmount[] {
  const end = addDays(asOf, horizonDays);
  const result: DatedAmount[] = [];
  for (const commitment of commitments.filter((c) => c.type === type)) {
    const cents = toCents(commitment.amount);
    if (commitment.recurrence === 'NONE') {
      if (commitment.dueDate > asOf && commitment.dueDate <= end) {
        result.push({ date: commitment.dueDate, cents });
      }
      continue;
    }
    const day = Number(commitment.dueDate.slice(8, 10));
    for (let month = monthOf(asOf); month <= monthOf(end); month = addMonths(month, 1)) {
      const date = dateInMonth(month, day);
      if (date >= commitment.dueDate && date > asOf && date <= end) {
        result.push({ date, cents });
      }
    }
  }
  return result;
}

function sumCents(items: readonly DatedAmount[]): number {
  return items.reduce((sum, item) => sum + item.cents, 0);
}

function runwayFor(cash: number, monthlyExpense: number, monthlyRevenue: number): Runway {
  const burn = monthlyExpense - monthlyRevenue;
  if (burn <= 0) {
    return { months: null, status: 'not_burning' };
  }
  if (cash <= 0) {
    return { months: '0.0', status: 'finite' };
  }
  const tenths = divRound(cash * 10, burn);
  return { months: `${Math.floor(tenths / 10)}.${tenths % 10}`, status: 'finite' };
}

type ScenarioPremises = {
  monthlyRevenue: number;
  monthlyPattern: number;
  useReceivables: boolean;
};

function projectScenario(
  input: ForecastInput,
  premises: ScenarioPremises,
  horizonDays: number,
  fixed: readonly DatedAmount[],
  receivables: readonly DatedAmount[],
) {
  const cash = toCents(input.cashBalance);
  const dated = premises.useReceivables ? receivables : [];
  const fixedTotal = sumCents(fixed);
  const receivableTotal = sumCents(dated);

  const horizonExpense = Math.max(
    divRound(premises.monthlyPattern * horizonDays, CENTS_PER_MONTH_DAYS),
    fixedTotal,
  );
  const horizonRevenue = Math.max(
    divRound(premises.monthlyRevenue * horizonDays, CENTS_PER_MONTH_DAYS),
    receivableTotal,
  );
  const variableExpense = horizonExpense - fixedTotal;
  const variableRevenue = horizonRevenue - receivableTotal;

  let balance = cash;
  let lowest = cash;
  let firstNegativeDate: string | null = cash < 0 ? input.asOf : null;
  for (let day = 1; day <= horizonDays; day += 1) {
    const date = addDays(input.asOf, day);
    const share = (total: number) =>
      Math.floor((total * day) / horizonDays) - Math.floor((total * (day - 1)) / horizonDays);
    balance += share(variableRevenue) - share(variableExpense);
    balance += sumCents(dated.filter((item) => item.date === date));
    balance -= sumCents(fixed.filter((item) => item.date === date));
    lowest = Math.min(lowest, balance);
    if (balance < 0 && firstNegativeDate === null) {
      firstNegativeDate = date;
    }
  }

  const monthlyExpense = divRound(horizonExpense * CENTS_PER_MONTH_DAYS, horizonDays);
  const monthlyRevenue = divRound(horizonRevenue * CENTS_PER_MONTH_DAYS, horizonDays);
  const result: ScenarioResult = {
    endBalance: fromCents(balance),
    firstNegativeDate,
    runway: runwayFor(cash, monthlyExpense, monthlyRevenue),
    monthlyRevenue: fromCents(monthlyRevenue),
    monthlyExpense: fromCents(monthlyExpense),
  };
  return { result, lowest };
}

export function computeForecast(input: ForecastInput): Forecast | InsufficientHistory {
  const months = windowMonths(input.asOf, input.transactions);
  if (months.length < FORECAST_PARAMS.minHistoryMonths) {
    return {
      status: 'insufficient_history',
      monthsAvailable: months.length,
      monthsRequired: FORECAST_PARAMS.minHistoryMonths,
    };
  }

  // Dinheiro pessoal altera o caixa, mas não é padrão do negócio.
  const business = input.transactions.filter((t) => originOf(t.label) === 'BUSINESS');
  const revenues = monthlyRevenues(business, months);
  const pattern = expensePattern(business, months, false);
  const patternWithoutExtraordinary = expensePattern(business, months, true);

  const horizonDays = FORECAST_PARAMS.horizonWeeks * 7;
  const fixed = occurrencesInHorizon(input.commitments, 'FIXED_EXPENSE', input.asOf, horizonDays);
  const receivables = occurrencesInHorizon(
    input.commitments,
    'RECEIVABLE',
    input.asOf,
    horizonDays,
  );

  const project = (premises: ScenarioPremises) =>
    projectScenario(input, premises, horizonDays, fixed, receivables);

  const conservative = project({
    monthlyRevenue: quartile(revenues, 1),
    monthlyPattern: pattern,
    useReceivables: false,
  });
  const likely = project({
    monthlyRevenue: quartile(revenues, 2),
    monthlyPattern: pattern,
    useReceivables: true,
  });
  const favorable = project({
    monthlyRevenue: quartile(revenues, 3),
    monthlyPattern: patternWithoutExtraordinary,
    useReceivables: true,
  });

  return {
    status: 'ok',
    asOf: input.asOf,
    horizonWeeks: FORECAST_PARAMS.horizonWeeks,
    scenarios: {
      conservative: conservative.result,
      likely: likely.result,
      favorable: favorable.result,
    },
    safeWithdrawal: fromCents(Math.max(0, conservative.lowest)),
    explanation: [
      `Receita provável = mediana dos últimos ${months.length} meses completos`,
      'Receita conservadora e favorável = primeiro e terceiro quartis dos mesmos meses',
      `${fixed.length} vencimento(s) e ${receivables.length} recebível(is) previstos no horizonte`,
      'Retirada segura = menor saldo projetado no cenário conservador',
    ],
    rulesVersion: RULES_VERSION,
  };
}
