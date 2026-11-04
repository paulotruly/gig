import { forecastResponse, createCommitmentBody } from '../src/contracts';
import { evaluateAlerts } from '../src/rules/alerts';
import { classifyTransaction, normalizeDescription, originOf } from '../src/rules/classification';
import { dateInMonth, isIsoDate } from '../src/rules/dates';
import type { Forecast } from '../src/rules/forecast';
import { divRound, fromCents, toCents } from '../src/rules/money';

describe('money', () => {
  it('converte sem perder precisão', () => {
    expect(toCents('0.07')).toBe(7);
    expect(toCents('1234.5')).toBe(123450);
    expect(toCents('-0.29')).toBe(-29);
    expect(fromCents(-29)).toBe('-0.29');
    expect(fromCents(toCents('1999999999.99'))).toBe('1999999999.99');
  });

  it('rejeita formatos ambíguos', () => {
    for (const value of ['1,50', '1.234', 'abc', '', '1e3']) {
      expect(() => toCents(value)).toThrow(RangeError);
    }
  });

  it('arredonda a divisão para o inteiro mais próximo', () => {
    expect(divRound(10, 4)).toBe(3);
    expect(divRound(-10, 4)).toBe(-3);
    expect(divRound(9, 4)).toBe(2);
  });
});

describe('dates', () => {
  it('valida datas reais', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
  });

  it('ajusta o dia ao fim do mês', () => {
    expect(dateInMonth('2027-02', 31)).toBe('2027-02-28');
  });
});

describe('classifyTransaction', () => {
  it('reconhece imposto, retirada, fornecedor e pessoal nas saídas', () => {
    expect(classifyTransaction('PGTO DAS MEI 10/2026', -7500).label).toBe('TAX');
    expect(classifyTransaction('Pró-labore outubro', -300000).label).toBe('WITHDRAWAL');
    expect(classifyTransaction('Distribuidora Boa Vista', -100000).label).toBe('SUPPLIER');
    expect(classifyTransaction('Farmácia São João', -4000).label).toBe('PERSONAL');
    expect(classifyTransaction('Serviço sem pista', -4000).label).toBe('BUSINESS');
  });

  it('não confunde parte de palavra com imposto', () => {
    expect(classifyTransaction('Dasein Consultoria', -4000).label).toBe('BUSINESS');
  });

  it('trata entrada como receita mesmo citando palavra-chave', () => {
    const result = classifyTransaction('Venda para Mercado Central', 50000);
    expect(result).toEqual({ label: 'BUSINESS', category: 'receitas', source: 'RULE' });
  });

  it('prioriza a regra aprendida e ignora números da descrição', () => {
    const pattern = normalizeDescription('PIX 123 João');
    expect(pattern).toBe('PIX JOAO');
    const result = classifyTransaction('PIX 456 JOÃO', -1000, [{ pattern, label: 'PERSONAL' }]);
    expect(result).toEqual({ label: 'PERSONAL', category: 'pessoal', source: 'LEARNED' });
  });

  it('deriva a origem da etiqueta', () => {
    expect(originOf('WITHDRAWAL')).toBe('PERSONAL');
    expect(originOf('TAX')).toBe('BUSINESS');
  });
});

function forecast(overrides: Partial<Forecast['scenarios']['likely']> = {}): Forecast {
  const scenario = {
    endBalance: '100.00',
    firstNegativeDate: null,
    runway: { months: null, status: 'not_burning' as const },
    monthlyRevenue: '1.00',
    monthlyExpense: '1.00',
  };
  return {
    status: 'ok',
    asOf: '2026-11-04',
    horizonWeeks: 4,
    scenarios: {
      conservative: { ...scenario, ...overrides },
      likely: scenario,
      favorable: scenario,
    },
    safeWithdrawal: '0.00',
    explanation: [],
    rulesVersion: '1.0.0',
  };
}

describe('evaluateAlerts', () => {
  const base = { businessType: 'MEI' as const, transactions: [] };

  it('dispara quando o saldo conservador fica negativo em até 15 dias, com os dados', () => {
    const [alert] = evaluateAlerts({
      ...base,
      forecast: forecast({ firstNegativeDate: '2026-11-19' }),
    });
    expect(alert?.ruleId).toBe('conservative_negative_soon');
    expect(alert?.data.daysUntilNegative).toBe(15);
    expect(alert?.explanation).toContain('15 dias');
    expect(alert?.message).toContain('19/11/2026');
  });

  it('não dispara depois de 15 dias', () => {
    const alerts = evaluateAlerts({
      ...base,
      forecast: forecast({ firstNegativeDate: '2026-11-20' }),
    });
    expect(alerts).toEqual([]);
  });

  it('só avalia runway de startup', () => {
    const f = forecast();
    f.scenarios.likely = { ...f.scenarios.likely, runway: { months: '8.5', status: 'finite' } };
    expect(evaluateAlerts({ ...base, forecast: f })).toEqual([]);
    const [alert] = evaluateAlerts({ ...base, businessType: 'STARTUP', forecast: f });
    expect(alert?.ruleId).toBe('low_runway');
    expect(alert?.message).toContain('8,5 meses');
  });

  it('detecta mistura de contas sem linguagem de culpa', () => {
    const transactions = [
      { date: '2026-10-01', amount: '-10.00', label: 'PERSONAL' as const },
      { date: '2026-10-02', amount: '-10.00', label: 'BUSINESS' as const },
    ];
    const [alert] = evaluateAlerts({ ...base, transactions, forecast: forecast() });
    expect(alert?.ruleId).toBe('mixed_accounts');
    expect(alert?.message).not.toMatch(/erro|culpa|falha|deveria/i);
  });
});

describe('contratos', () => {
  it('rejeita compromisso com valor zero, negativo ou numérico', () => {
    const body = { type: 'RECEIVABLE', description: 'x', dueDate: '2026-12-01' };
    for (const amount of ['0.00', '-1.00', 10]) {
      expect(createCommitmentBody.safeParse({ ...body, amount }).success).toBe(false);
    }
    expect(createCommitmentBody.safeParse({ ...body, amount: '1.00' }).success).toBe(true);
  });

  it('o contrato da previsão aceita o exemplo da especificação', () => {
    const likely = {
      endBalance: '4300.00',
      firstNegativeDate: null,
      runway: { months: '20.0', status: 'finite' },
    };
    const result = forecastResponse.safeParse({
      businessId: 42,
      generatedAt: '2026-10-28',
      horizonWeeks: 4,
      scenarios: { conservative: likely, likely, favorable: likely },
      safeWithdrawal: '1200.00',
      explanation: ['Receita provável = mediana dos últimos 6 meses'],
      rulesVersion: '1.0.0',
    });
    expect(result.success).toBe(true);
  });
});
