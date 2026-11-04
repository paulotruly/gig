import { computeForecast, type Forecast, type ForecastInput } from '../src/rules/forecast';
import { toCents } from '../src/rules/money';

function history(revenues: string[], expense = '-1000.00') {
  const start = 7;
  return revenues.flatMap((amount, index) => {
    const month = String(start + index).padStart(2, '0');
    return [
      { date: `2026-${month}-05`, amount, label: 'BUSINESS' as const, category: 'receitas' },
      {
        date: `2026-${month}-10`,
        amount: expense,
        label: 'BUSINESS' as const,
        category: 'operacao',
      },
    ];
  });
}

function input(overrides: Partial<ForecastInput> = {}): ForecastInput {
  return {
    asOf: '2026-11-04',
    cashBalance: '5000.00',
    transactions: history(['3000.00', '4000.00', '5000.00', '6000.00']),
    commitments: [],
    ...overrides,
  };
}

function ok(result: ReturnType<typeof computeForecast>): Forecast {
  if (result.status !== 'ok') {
    throw new Error('previsão esperada');
  }
  return result;
}

describe('computeForecast', () => {
  it('gera o mesmo resultado para a mesma entrada', () => {
    expect(computeForecast(input())).toEqual(computeForecast(input()));
  });

  it('calcula os três cenários a partir dos quartis, proporcionais a 28 dias', () => {
    const result = ok(computeForecast(input()));
    // Quartis de 3000, 4000, 5000 e 6000: 3750, 4500 e 5250. Despesa mensal: 1000.
    expect(result.scenarios.conservative.endBalance).toBe('7566.67');
    expect(result.scenarios.likely.endBalance).toBe('8266.67');
    expect(result.scenarios.favorable.endBalance).toBe('8966.67');
    expect(result.rulesVersion).toBe('1.0.0');
  });

  it('não prevê com menos de 3 meses completos', () => {
    const result = computeForecast(
      input({ asOf: '2026-09-04', transactions: history(['3000.00', '4000.00']) }),
    );
    expect(result).toEqual({
      status: 'insufficient_history',
      monthsAvailable: 2,
      monthsRequired: 3,
    });
  });

  it('não conta o mês corrente como mês completo', () => {
    const result = computeForecast(
      input({
        asOf: '2026-09-20',
        transactions: history(['3000.00', '4000.00', '5000.00']),
      }),
    );
    expect(result.status).toBe('insufficient_history');
  });

  it('conta mês sem receita como zero', () => {
    const transactions = [
      { date: '2026-08-05', amount: '3000.00', label: 'BUSINESS' as const, category: 'receitas' },
      { date: '2026-10-05', amount: '3000.00', label: 'BUSINESS' as const, category: 'receitas' },
    ];
    const result = ok(computeForecast(input({ transactions })));
    // Agosto, setembro (zero) e outubro: a mediana é 3000 e o primeiro quartil é 1500.
    expect(result.scenarios.likely.monthlyRevenue).toBe('3000.00');
    expect(result.scenarios.conservative.monthlyRevenue).toBe('1500.00');
  });

  it('usa só os 6 últimos meses completos', () => {
    const old = [
      { date: '2025-01-05', amount: '999999.00', label: 'BUSINESS' as const, category: 'receitas' },
    ];
    const transactions = [...old, ...history(['3000.00', '3000.00', '3000.00', '3000.00'])];
    const result = ok(computeForecast(input({ transactions })));
    expect(toCents(result.scenarios.favorable.monthlyRevenue)).toBeLessThan(400_000);
  });

  it('mantém a ordem entre os cenários e a retirada segura não negativa', () => {
    const result = ok(
      computeForecast(
        input({
          cashBalance: '100.00',
          commitments: [
            { type: 'FIXED_EXPENSE', amount: '9000.00', dueDate: '2026-11-10', recurrence: 'NONE' },
          ],
        }),
      ),
    );
    const { conservative, likely, favorable } = result.scenarios;
    expect(toCents(conservative.endBalance)).toBeLessThanOrEqual(toCents(likely.endBalance));
    expect(toCents(likely.endBalance)).toBeLessThanOrEqual(toCents(favorable.endBalance));
    expect(conservative.firstNegativeDate).toBe('2026-11-10');
    expect(result.safeWithdrawal).toBe('0.00');
  });

  it('a retirada segura é o menor saldo conservador, não o saldo final', () => {
    const result = ok(
      computeForecast(
        input({
          commitments: [
            { type: 'FIXED_EXPENSE', amount: '3000.00', dueDate: '2026-11-05', recurrence: 'NONE' },
          ],
        }),
      ),
    );
    const withdrawal = toCents(result.safeWithdrawal);
    expect(withdrawal).toBeGreaterThan(0);
    expect(withdrawal).toBeLessThan(toCents(result.scenarios.conservative.endBalance));
    expect(withdrawal).toBeLessThan(500_000);
  });

  it('runway fica nulo quando a queima é zero ou negativa', () => {
    const result = ok(computeForecast(input()));
    expect(result.scenarios.likely.runway).toEqual({ months: null, status: 'not_burning' });
  });

  it('calcula o runway quando há queima', () => {
    const result = ok(
      computeForecast(
        input({
          cashBalance: '12000.00',
          transactions: history(['1000.00', '1000.00', '1000.00'], '-2000.00'),
        }),
      ),
    );
    expect(result.scenarios.likely.runway).toEqual({ months: '12.0', status: 'finite' });
  });

  it('runway é zero com caixa negativo e queima positiva', () => {
    const result = ok(
      computeForecast(
        input({
          cashBalance: '-10.00',
          transactions: history(['1000.00', '1000.00', '1000.00'], '-2000.00'),
        }),
      ),
    );
    expect(result.scenarios.likely.runway).toEqual({ months: '0.0', status: 'finite' });
    expect(result.scenarios.likely.firstNegativeDate).toBe('2026-11-04');
  });

  it('ignora etiquetas pessoais no padrão do negócio', () => {
    const personal = { label: 'PERSONAL' as const, category: 'pessoal' };
    const base = ok(computeForecast(input()));
    const mixed = ok(
      computeForecast(
        input({
          transactions: [
            ...input().transactions,
            { date: '2026-09-10', amount: '-50000.00', ...personal },
            { date: '2026-09-11', amount: '50000.00', ...personal },
          ],
        }),
      ),
    );
    expect(mixed.scenarios).toEqual(base.scenarios);
  });

  it('o gasto extraordinário só sai do cenário favorável', () => {
    const transactions = [
      ...history(['5000.00', '5000.00', '5000.00', '5000.00']),
      { date: '2026-08-15', amount: '-90000.00', label: 'BUSINESS' as const, category: 'operacao' },
      { date: '2026-09-15', amount: '-90000.00', label: 'BUSINESS' as const, category: 'operacao' },
      { date: '2026-10-15', amount: '-90000.00', label: 'BUSINESS' as const, category: 'operacao' },
    ];
    const result = ok(computeForecast(input({ transactions })));
    expect(toCents(result.scenarios.favorable.monthlyExpense)).toBeLessThan(
      toCents(result.scenarios.likely.monthlyExpense),
    );
  });

  it('o recebível vira piso da receita, sem somar à mediana, e não entra no conservador', () => {
    const base = ok(computeForecast(input()));
    const small = ok(
      computeForecast(
        input({
          commitments: [
            { type: 'RECEIVABLE', amount: '100.00', dueDate: '2026-11-10', recurrence: 'NONE' },
          ],
        }),
      ),
    );
    expect(small.scenarios.likely.endBalance).toBe(base.scenarios.likely.endBalance);
    const large = ok(
      computeForecast(
        input({
          commitments: [
            { type: 'RECEIVABLE', amount: '20000.00', dueDate: '2026-11-10', recurrence: 'NONE' },
          ],
        }),
      ),
    );
    expect(toCents(large.scenarios.likely.endBalance)).toBeGreaterThan(
      toCents(base.scenarios.likely.endBalance),
    );
    expect(large.scenarios.conservative.endBalance).toBe(base.scenarios.conservative.endBalance);
  });

  it('expande compromisso mensal e ignora vencimentos fora do horizonte', () => {
    const withMonthly = ok(
      computeForecast(
        input({
          commitments: [
            {
              type: 'FIXED_EXPENSE',
              amount: '4000.00',
              dueDate: '2026-01-20',
              recurrence: 'MONTHLY',
            },
            { type: 'FIXED_EXPENSE', amount: '7777.00', dueDate: '2026-11-03', recurrence: 'NONE' },
            { type: 'FIXED_EXPENSE', amount: '7777.00', dueDate: '2027-02-01', recurrence: 'NONE' },
          ],
        }),
      ),
    );
    // O piso de despesa passa a ser os 4000 do mês, acima do padrão proporcional.
    expect(withMonthly.scenarios.likely.endBalance).toBe('5200.00');
  });

  it('o dinheiro continua exato, sem resíduo de ponto flutuante', () => {
    const result = ok(
      computeForecast(
        input({
          transactions: history(['0.10', '0.20', '0.30'], '-0.10'),
          cashBalance: '0.30',
        }),
      ),
    );
    for (const scenario of Object.values(result.scenarios)) {
      expect(scenario.endBalance).toMatch(/^-?\d+\.\d{2}$/);
    }
  });
});
