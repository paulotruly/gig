import { BUSINESS_TYPES } from '../src/contracts';
import { evaluateAlerts } from '../src/rules/alerts';
import { classifyTransaction, originOf } from '../src/rules/classification';
import { computeForecast } from '../src/rules/forecast';
import { isDecimalString, toCents } from '../src/rules/money';
import {
  generateSimulatedBusiness,
  SIMULATION_SCENARIOS,
  type SimulatedBusiness,
} from '../src/simulation';

const AS_OF = '2026-11-22';
const SEEDS = Array.from({ length: 400 }, (_, i) => i * 7919 + 1);

function classified(business: SimulatedBusiness) {
  return business.transactions.map((t) => ({
    ...t,
    ...classifyTransaction(t.description, toCents(t.amount)),
  }));
}

function forecastOf(business: SimulatedBusiness) {
  return computeForecast({
    asOf: AS_OF,
    cashBalance: business.cashBalance,
    transactions: classified(business),
    commitments: business.commitments,
  });
}

describe('generateSimulatedBusiness', () => {
  it('devolve os mesmos dados para a mesma semente e a mesma data', () => {
    const input = { seed: 42, asOf: AS_OF, type: 'MEI' as const, trackCount: 4 };
    expect(generateSimulatedBusiness(input)).toEqual(generateSimulatedBusiness(input));
  });

  it('varia o cenário, o perfil e os valores entre sementes', () => {
    const results = SEEDS.slice(0, 60).map((seed) =>
      generateSimulatedBusiness({ seed, asOf: AS_OF, type: 'MEI' }),
    );
    expect(new Set(results.map((r) => r.scenario)).size).toBeGreaterThanOrEqual(8);
    expect(new Set(results.map((r) => r.profile)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(results.map((r) => r.cashBalance)).size).toBe(results.length);
  });

  it('gera dados válidos para todos os tipos de negócio', () => {
    for (const type of BUSINESS_TYPES) {
      for (const seed of SEEDS.slice(0, 50)) {
        const business = generateSimulatedBusiness({ seed, asOf: AS_OF, type, trackCount: 3 });
        expect(business.transactions.length).toBeGreaterThan(0);
        expect(isDecimalString(business.cashBalance)).toBe(true);
        expect(business.trackPercents).toHaveLength(3);
        for (const t of business.transactions) {
          expect(t.date < AS_OF).toBe(true);
          expect(isDecimalString(t.amount)).toBe(true);
          expect(toCents(t.amount)).not.toBe(0);
          expect(t.description.length).toBeLessThanOrEqual(255);
        }
        for (const c of business.commitments) {
          expect(c.dueDate > AS_OF).toBe(true);
          expect(toCents(c.amount)).toBeGreaterThan(0);
        }
      }
    }
  });

  it('só sorteia o aporte de investidor para startups', () => {
    for (const seed of SEEDS) {
      const business = generateSimulatedBusiness({ seed, asOf: AS_OF, type: 'ME' });
      expect(business.scenario).not.toBe('aporte-de-investidor');
    }
  });

  it('dá a cada cenário a forma esperada na previsão e nos alertas', () => {
    const byScenario = new Map<string, SimulatedBusiness[]>();
    for (const type of BUSINESS_TYPES) {
      for (const seed of SEEDS) {
        const business = generateSimulatedBusiness({ seed, asOf: AS_OF, type });
        byScenario.set(business.scenario, [...(byScenario.get(business.scenario) ?? []), business]);
      }
    }
    expect([...byScenario.keys()].sort()).toEqual([...SIMULATION_SCENARIOS].sort());

    const share = (items: SimulatedBusiness[], test: (b: SimulatedBusiness) => boolean) =>
      items.filter(test).length / items.length;
    const alertsOf = (business: SimulatedBusiness, type: (typeof BUSINESS_TYPES)[number]) => {
      const forecast = forecastOf(business);
      if (forecast.status !== 'ok') return [];
      return evaluateAlerts({
        forecast,
        businessType: type,
        transactions: classified(business),
      }).map((a) => a.ruleId);
    };

    for (const business of byScenario.get('recem-aberto') ?? []) {
      expect(forecastOf(business).status).toBe('insufficient_history');
    }
    const established = [...byScenario.entries()].filter(([id]) => id !== 'recem-aberto');
    for (const [, items] of established) {
      expect(share(items, (b) => forecastOf(b).status === 'ok')).toBe(1);
    }

    const mixed = byScenario.get('contas-misturadas') ?? [];
    expect(share(mixed, (b) => alertsOf(b, 'MEI').includes('mixed_accounts'))).toBeGreaterThan(0.9);
    const healthy = byScenario.get('saudavel') ?? [];
    expect(share(healthy, (b) => alertsOf(b, 'MEI').length === 0)).toBeGreaterThan(0.8);
    const imminent = byScenario.get('caixa-negativo-iminente') ?? [];
    expect(
      share(imminent, (b) => alertsOf(b, 'MEI').includes('conservative_negative_soon')),
    ).toBeGreaterThan(0.8);
  });

  it('mantém as saídas pessoais abaixo do limite do alerta fora das contas misturadas', () => {
    for (const seed of SEEDS) {
      const business = generateSimulatedBusiness({ seed, asOf: AS_OF, type: 'MEI' });
      if (business.scenario === 'contas-misturadas' || business.scenario === 'recem-aberto') {
        continue;
      }
      const outflows = classified(business).filter((t) => toCents(t.amount) < 0);
      const personal = outflows.filter((t) => originOf(t.label) === 'PERSONAL').length;
      // A retirada também conta como saída pessoal na regra do alerta.
      expect(personal / outflows.length).toBeLessThan(0.3);
    }
  });
});
