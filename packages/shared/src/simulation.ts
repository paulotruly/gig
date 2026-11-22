// Gerador de negócios fictícios para o ambiente simulado (funcionalidade 025).
// Função pura: a mesma semente e a mesma data devolvem sempre os mesmos dados (regra 12).
import type { BUSINESS_TYPES } from './contracts';
import { addDays, addMonths, dateInMonth, monthOf } from './rules/dates';
import { fromCents } from './rules/money';

type BusinessType = (typeof BUSINESS_TYPES)[number];
export type Random = () => number;

// Gerador pseudoaleatório pequeno e determinístico; não serve para criptografia.
export function mulberry32(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const between = (random: Random, min: number, max: number) => min + random() * (max - min);
const intBetween = (random: Random, min: number, max: number) =>
  Math.floor(between(random, min, max + 1));
const pick = <T>(random: Random, items: readonly T[]): T =>
  items[Math.floor(random() * items.length)] as T;
const chance = (random: Random, probability: number) => random() < probability;

function sample<T>(random: Random, items: readonly T[], count: number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j] as T, pool[i] as T];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

type FixedExpense = {
  description: string;
  // Nome do compromisso mensal; sem ele, a despesa só aparece no extrato.
  commitment?: string;
  cents: number;
  day: number;
  varies?: boolean;
};
type VariableExpense = { descriptions: readonly string[]; cents: number; perMonth: number };

type Profile = {
  id: string;
  types: readonly BusinessType[];
  clients: readonly string[];
  incomePrefixes: readonly string[];
  paymentsPerClient: [number, number];
  fixed: readonly FixedExpense[];
  variable: readonly VariableExpense[];
  withdrawalCents: number;
  receivableNames: readonly string[];
};

const MEI_TAX: FixedExpense = {
  description: 'PGTO DAS MEI',
  commitment: 'DAS MEI',
  cents: 7_590,
  day: 20,
};
const ACCOUNTANT: FixedExpense = {
  description: 'HONORARIOS CONTABEIS',
  commitment: 'Honorários do contador',
  cents: 35_000,
  day: 10,
};

const PROFILES: readonly Profile[] = [
  {
    id: 'estudio-de-design',
    types: ['MEI', 'SERVICE_PROVIDER'],
    clients: [
      'ACME TECNOLOGIA',
      'PADARIA BOM GOSTO',
      'STUDIO NORTE',
      'CLINICA VIDA',
      'COLEGIO ALVORADA',
      'PET SHOP AMIGO FIEL',
      'IMOBILIARIA HORIZONTE',
      'CERVEJARIA SERRA AZUL',
    ],
    incomePrefixes: ['PIX RECEBIDO', 'TED RECEBIDA'],
    paymentsPerClient: [1, 2],
    fixed: [
      MEI_TAX,
      {
        description: 'ALUGUEL COWORKING CENTRO',
        commitment: 'Aluguel do coworking',
        cents: 90_000,
        day: 5,
      },
      { description: 'ASSINATURA ADOBE CREATIVE CLOUD', cents: 12_490, day: 8 },
      { description: 'INTERNET FIBRA', cents: 11_990, day: 22 },
    ],
    variable: [{ descriptions: ['FORNECEDOR GRAFICA RAPIDA'], cents: 42_000, perMonth: 1 }],
    withdrawalCents: 180_000,
    receivableNames: ['Projeto de identidade visual', 'Pacote de posts', 'Site institucional'],
  },
  {
    id: 'confeitaria',
    types: ['MEI', 'ME'],
    clients: [
      'CAFE DA PRACA',
      'BUFFET ALEGRIA',
      'MERCEARIA SAO JORGE',
      'EVENTOS PRIMAVERA',
      'HOTEL MIRANTE',
    ],
    incomePrefixes: ['PIX RECEBIDO', 'VENDA CARTAO DEBITO', 'VENDA CARTAO CREDITO'],
    paymentsPerClient: [2, 6],
    fixed: [
      MEI_TAX,
      { description: 'ENERGIA ELETRICA COELBA', cents: 38_000, day: 12, varies: true },
      { description: 'GAS GLP ENTREGA', cents: 14_000, day: 3, varies: true },
      {
        description: 'TAXA MAQUININHA CARTAO',
        commitment: 'Aluguel da maquininha',
        cents: 8_990,
        day: 1,
      },
    ],
    variable: [
      { descriptions: ['ATACADAO INSUMOS', 'DISTRIBUIDORA DOCE MEL'], cents: 65_000, perMonth: 3 },
      { descriptions: ['EMBALAGENS FORNECEDOR KIT FESTA'], cents: 22_000, perMonth: 1 },
    ],
    withdrawalCents: 150_000,
    receivableNames: ['Encomenda de casamento', 'Bolo de aniversário corporativo'],
  },
  {
    id: 'salao-de-beleza',
    types: ['MEI', 'SERVICE_PROVIDER'],
    clients: ['CLIENTES BALCAO', 'AGENDA ONLINE', 'PACOTE NOIVAS', 'CLUBE DE ASSINATURA'],
    incomePrefixes: ['PIX RECEBIDO', 'VENDA CARTAO DEBITO', 'VENDA CARTAO CREDITO'],
    paymentsPerClient: [3, 8],
    fixed: [
      MEI_TAX,
      {
        description: 'ALUGUEL SALA COMERCIAL',
        commitment: 'Aluguel da sala',
        cents: 120_000,
        day: 5,
      },
      { description: 'ENERGIA ELETRICA', cents: 25_000, day: 15, varies: true },
      { description: 'SISTEMA DE AGENDAMENTO', cents: 8_900, day: 9 },
    ],
    variable: [
      {
        descriptions: ['DISTRIBUIDORA BELEZA PURA', 'INSUMOS COSMETICOS'],
        cents: 38_000,
        perMonth: 2,
      },
    ],
    withdrawalCents: 160_000,
    receivableNames: ['Pacote de noiva', 'Evento de formatura'],
  },
  {
    id: 'fotografia',
    types: ['MEI', 'SERVICE_PROVIDER'],
    clients: [
      'CASAMENTO FERREIRA',
      'AGENCIA LUZ',
      'REVISTA BAIRRO',
      'FORMATURA UNIVERSO',
      'CONSTRUTORA PILAR',
    ],
    incomePrefixes: ['PIX RECEBIDO', 'TED RECEBIDA'],
    paymentsPerClient: [1, 1],
    fixed: [
      MEI_TAX,
      { description: 'ARMAZENAMENTO NUVEM', cents: 4_990, day: 7 },
      {
        description: 'SEGURO EQUIPAMENTO',
        commitment: 'Seguro do equipamento',
        cents: 18_000,
        day: 18,
      },
    ],
    variable: [{ descriptions: ['FORNECEDOR LABORATORIO FOTO'], cents: 30_000, perMonth: 1 }],
    withdrawalCents: 200_000,
    receivableNames: ['Ensaio de casamento', 'Cobertura de evento'],
  },
  {
    id: 'loja-de-roupas',
    types: ['ME'],
    clients: ['VENDAS LOJA FISICA', 'VENDAS MARKETPLACE', 'VENDAS INSTAGRAM'],
    incomePrefixes: ['VENDA CARTAO CREDITO', 'VENDA CARTAO DEBITO', 'PIX RECEBIDO'],
    paymentsPerClient: [6, 14],
    fixed: [
      {
        description: 'DAS SIMPLES NACIONAL',
        commitment: 'DAS Simples Nacional',
        cents: 95_000,
        day: 20,
        varies: true,
      },
      {
        description: 'ALUGUEL LOJA SHOPPING',
        commitment: 'Aluguel da loja',
        cents: 450_000,
        day: 5,
      },
      { description: 'FOLHA DE PAGAMENTO', commitment: 'Salários', cents: 520_000, day: 5 },
      { description: 'GPS INSS FUNCIONARIOS', cents: 110_000, day: 20 },
      ACCOUNTANT,
      { description: 'ENERGIA ELETRICA', cents: 60_000, day: 14, varies: true },
    ],
    variable: [
      {
        descriptions: ['CONFECCOES ATACADO BRAS', 'FORNECEDOR MALHARIA SUL'],
        cents: 380_000,
        perMonth: 2,
      },
    ],
    withdrawalCents: 400_000,
    receivableNames: ['Repasse do marketplace', 'Venda para uniforme escolar'],
  },
  {
    id: 'oficina-mecanica',
    types: ['ME', 'SERVICE_PROVIDER'],
    clients: [
      'FROTA LOGISTICA RAPIDA',
      'CLIENTES BALCAO',
      'TAXI COOPERATIVA',
      'LOCADORA MOVE',
      'SEGURADORA PROTEGE',
    ],
    incomePrefixes: ['PIX RECEBIDO', 'VENDA CARTAO DEBITO', 'BOLETO RECEBIDO'],
    paymentsPerClient: [1, 5],
    fixed: [
      {
        description: 'DAS SIMPLES NACIONAL',
        commitment: 'DAS Simples Nacional',
        cents: 70_000,
        day: 20,
        varies: true,
      },
      { description: 'ALUGUEL GALPAO', commitment: 'Aluguel do galpão', cents: 280_000, day: 5 },
      { description: 'FOLHA DE PAGAMENTO', commitment: 'Salários', cents: 420_000, day: 5 },
      ACCOUNTANT,
    ],
    variable: [
      {
        descriptions: ['DISTRIBUIDORA AUTOPECAS', 'ATACADO LUBRIFICANTES'],
        cents: 210_000,
        perMonth: 3,
      },
    ],
    withdrawalCents: 350_000,
    receivableNames: ['Revisão da frota', 'Sinistro da seguradora'],
  },
  {
    id: 'restaurante',
    types: ['ME'],
    clients: ['VENDAS SALAO', 'APP DE DELIVERY', 'EVENTOS EMPRESARIAIS'],
    incomePrefixes: ['VENDA CARTAO CREDITO', 'VENDA CARTAO DEBITO', 'PIX RECEBIDO'],
    paymentsPerClient: [8, 16],
    fixed: [
      {
        description: 'DAS SIMPLES NACIONAL',
        commitment: 'DAS Simples Nacional',
        cents: 120_000,
        day: 20,
        varies: true,
      },
      {
        description: 'ALUGUEL PONTO COMERCIAL',
        commitment: 'Aluguel do ponto',
        cents: 550_000,
        day: 5,
      },
      { description: 'FOLHA DE PAGAMENTO', commitment: 'Salários', cents: 900_000, day: 5 },
      { description: 'FGTS FUNCIONARIOS', cents: 72_000, day: 7 },
      ACCOUNTANT,
      { description: 'ENERGIA ELETRICA', cents: 140_000, day: 14, varies: true },
    ],
    variable: [
      {
        descriptions: ['ATACADISTA HORTIFRUTI', 'DISTRIBUIDORA BEBIDAS', 'FORNECEDOR CARNES'],
        cents: 320_000,
        perMonth: 4,
      },
    ],
    withdrawalCents: 500_000,
    receivableNames: ['Evento corporativo', 'Repasse do app de delivery'],
  },
  {
    id: 'saas',
    types: ['STARTUP'],
    clients: [
      'ASSINATURAS CARTAO STRIPE',
      'CONTRATO REDE VAREJO',
      'CONTRATO ESCRITORIO ALFA',
      'CONTRATO CLINICAS UNIDAS',
    ],
    incomePrefixes: ['TED RECEBIDA', 'PIX RECEBIDO', 'BOLETO RECEBIDO'],
    paymentsPerClient: [1, 2],
    fixed: [
      { description: 'FOLHA DE PAGAMENTO', commitment: 'Salários', cents: 1_800_000, day: 5 },
      { description: 'SERVIDORES NUVEM AWS', cents: 320_000, day: 3, varies: true },
      { description: 'GPS INSS FUNCIONARIOS', cents: 390_000, day: 20 },
      { description: 'DAS SIMPLES NACIONAL', cents: 60_000, day: 20, varies: true },
      ACCOUNTANT,
      {
        description: 'ALUGUEL ESCRITORIO HUB',
        commitment: 'Aluguel do hub',
        cents: 250_000,
        day: 5,
      },
    ],
    variable: [{ descriptions: ['MARKETING ANUNCIOS ONLINE'], cents: 300_000, perMonth: 2 }],
    withdrawalCents: 0,
    receivableNames: ['Contrato anual', 'Implantação para cliente'],
  },
  {
    id: 'app-de-entregas',
    types: ['STARTUP'],
    clients: ['REPASSE PEDIDOS APP', 'PARCERIA MERCADO BAIRRO', 'TAXA LOJISTAS'],
    incomePrefixes: ['TED RECEBIDA', 'PIX RECEBIDO'],
    paymentsPerClient: [2, 4],
    fixed: [
      { description: 'FOLHA DE PAGAMENTO', commitment: 'Salários', cents: 1_200_000, day: 5 },
      { description: 'SERVIDORES NUVEM', cents: 180_000, day: 3, varies: true },
      { description: 'GPS INSS FUNCIONARIOS', cents: 260_000, day: 20 },
      ACCOUNTANT,
    ],
    variable: [
      { descriptions: ['REPASSE ENTREGADORES'], cents: 250_000, perMonth: 4 },
      { descriptions: ['MARKETING ANUNCIOS ONLINE'], cents: 200_000, perMonth: 1 },
    ],
    withdrawalCents: 0,
    receivableNames: ['Repasse semanal do app', 'Patrocínio de lançamento'],
  },
  {
    id: 'reformas-eletricas',
    types: ['SERVICE_PROVIDER', 'MEI'],
    clients: [
      'CONDOMINIO JARDINS',
      'CONSTRUTORA PILAR',
      'RESIDENCIAL AURORA',
      'CLIENTES PARTICULARES',
      'ESCOLA PEQUENO PRINCIPE',
    ],
    incomePrefixes: ['PIX RECEBIDO', 'TED RECEBIDA'],
    paymentsPerClient: [1, 3],
    fixed: [
      { description: 'PGTO DAS MEI', commitment: 'DAS MEI', cents: 8_090, day: 20 },
      { description: 'COMBUSTIVEL POSTO AVENIDA', cents: 45_000, day: 11, varies: true },
      { description: 'PLANO CELULAR EMPRESA', cents: 7_990, day: 16 },
    ],
    variable: [
      {
        descriptions: ['DISTRIBUIDORA MATERIAL ELETRICO', 'ATACADO FIOS E CABOS'],
        cents: 70_000,
        perMonth: 2,
      },
    ],
    withdrawalCents: 220_000,
    receivableNames: ['Reforma do quadro elétrico', 'Instalação de iluminação'],
  },
  {
    id: 'consultoria',
    types: ['SERVICE_PROVIDER', 'ME'],
    clients: [
      'GRUPO ALIMENTOS SERRA',
      'COOPERATIVA AGRO VALE',
      'REDE FARMA BEM',
      'METALURGICA ESTRELA',
    ],
    incomePrefixes: ['TED RECEBIDA', 'BOLETO RECEBIDO'],
    paymentsPerClient: [1, 1],
    fixed: [
      { description: 'ISS PREFEITURA', commitment: 'ISS', cents: 45_000, day: 15, varies: true },
      ACCOUNTANT,
      {
        description: 'SALA COMERCIAL ALUGUEL',
        commitment: 'Aluguel da sala',
        cents: 150_000,
        day: 5,
      },
      { description: 'SOFTWARE GESTAO ASSINATURA', cents: 19_900, day: 8 },
    ],
    variable: [{ descriptions: ['PASSAGENS VIAGEM CLIENTE'], cents: 90_000, perMonth: 1 }],
    withdrawalCents: 600_000,
    receivableNames: ['Diagnóstico financeiro', 'Mensalidade de consultoria'],
  },
  {
    id: 'suporte-de-ti',
    types: ['SERVICE_PROVIDER', 'MEI'],
    clients: [
      'ESCRITORIO ADVOCACIA LEAL',
      'CLINICA SORRISO',
      'CONTABILIDADE EXATA',
      'LOJA CENTRO INFORMATICA',
      'ONG CRESCER',
    ],
    incomePrefixes: ['PIX RECEBIDO', 'BOLETO RECEBIDO'],
    paymentsPerClient: [1, 1],
    fixed: [
      MEI_TAX,
      { description: 'LICENCAS SOFTWARE REMOTO', cents: 15_900, day: 6 },
      { description: 'INTERNET FIBRA', cents: 12_990, day: 22 },
    ],
    variable: [{ descriptions: ['FORNECEDOR PECAS INFORMATICA'], cents: 40_000, perMonth: 1 }],
    withdrawalCents: 250_000,
    receivableNames: ['Contrato de manutenção', 'Migração de servidor'],
  },
];

// Saídas miúdas do dia a dia que todo negócio tem, além das do perfil.
const SMALL_BUSINESS_EXPENSES: readonly string[] = [
  'TARIFA BANCARIA PACOTE SERVICOS',
  'ANUNCIOS REDES SOCIAIS',
  'MATERIAL DE ESCRITORIO PAPELARIA',
  'FRETE TRANSPORTADORA',
  'APLICATIVO TRANSPORTE CORPORATIVO',
  'TAXA BOLETO EMITIDO',
  'CORREIOS ENVIO',
];

const PERSONAL_EXPENSES: readonly { description: string; cents: number }[] = [
  { description: 'SUPERMERCADO EXTRA', cents: 22_000 },
  { description: 'SUPERMERCADO BOM PRECO', cents: 18_000 },
  { description: 'FARMACIA SAO PAULO', cents: 8_500 },
  { description: 'DROGARIA POPULAR', cents: 6_000 },
  { description: 'RESTAURANTE SABOR CASEIRO', cents: 6_500 },
  { description: 'LANCHONETE DA ESQUINA', cents: 3_200 },
  { description: 'NETFLIX', cents: 4_490 },
  { description: 'SPOTIFY', cents: 2_190 },
  { description: 'ACADEMIA CORPO EM FORMA', cents: 11_990 },
  { description: 'PLANO DE SAUDE FAMILIA', cents: 48_000 },
  { description: 'ESCOLA DAS CRIANCAS', cents: 65_000 },
];

export const SIMULATION_SCENARIOS = [
  'saudavel',
  'apertado',
  'queimando-caixa',
  'caixa-negativo-iminente',
  'sazonal',
  'crescimento',
  'queda',
  'contas-misturadas',
  'cliente-concentrado',
  'recem-aberto',
  'aporte-de-investidor',
] as const;
export type SimulationScenario = (typeof SIMULATION_SCENARIOS)[number];

type ScenarioShape = {
  // Receita do mês atual em relação às despesas mensais do negócio.
  revenueFactor: [number, number];
  trendPerMonth: [number, number];
  seasonality: [number, number];
  personalPerMonth: [number, number];
  topClientShare?: number;
  missChance: number;
  balanceMonths: [number, number];
  historyMonths: [number, number];
  urgentExpense?: boolean;
  investment?: boolean;
  types?: readonly BusinessType[];
};

const SCENARIOS: Record<SimulationScenario, ScenarioShape> = {
  saudavel: {
    revenueFactor: [1.3, 1.6],
    trendPerMonth: [0, 0.02],
    seasonality: [0, 0.1],
    personalPerMonth: [0, 1],
    missChance: 0.05,
    balanceMonths: [3, 8],
    historyMonths: [6, 12],
  },
  apertado: {
    revenueFactor: [0.98, 1.06],
    trendPerMonth: [-0.01, 0.01],
    seasonality: [0, 0.15],
    personalPerMonth: [0, 1],
    missChance: 0.1,
    balanceMonths: [0.3, 0.8],
    historyMonths: [4, 10],
  },
  'queimando-caixa': {
    revenueFactor: [0.6, 0.85],
    trendPerMonth: [-0.02, 0],
    seasonality: [0, 0.1],
    personalPerMonth: [0, 1],
    missChance: 0.15,
    balanceMonths: [0.15, 0.6],
    historyMonths: [5, 12],
  },
  'caixa-negativo-iminente': {
    revenueFactor: [0.8, 0.95],
    trendPerMonth: [-0.03, 0],
    seasonality: [0, 0.1],
    personalPerMonth: [0, 1],
    missChance: 0.2,
    balanceMonths: [0.05, 0.25],
    historyMonths: [4, 9],
    urgentExpense: true,
  },
  sazonal: {
    revenueFactor: [1, 1.25],
    trendPerMonth: [0, 0],
    seasonality: [0.4, 0.7],
    personalPerMonth: [0, 1],
    missChance: 0.1,
    balanceMonths: [0.8, 2.5],
    historyMonths: [9, 12],
  },
  crescimento: {
    revenueFactor: [1.1, 1.4],
    trendPerMonth: [0.06, 0.12],
    seasonality: [0, 0.1],
    personalPerMonth: [0, 1],
    missChance: 0.05,
    balanceMonths: [0.8, 2],
    historyMonths: [6, 12],
  },
  queda: {
    revenueFactor: [0.75, 0.95],
    trendPerMonth: [-0.1, -0.05],
    seasonality: [0, 0.1],
    personalPerMonth: [0, 1],
    missChance: 0.15,
    balanceMonths: [1, 2.5],
    historyMonths: [6, 12],
  },
  'contas-misturadas': {
    revenueFactor: [1, 1.3],
    trendPerMonth: [-0.01, 0.02],
    seasonality: [0, 0.15],
    personalPerMonth: [7, 12],
    missChance: 0.1,
    balanceMonths: [0.5, 2],
    historyMonths: [4, 10],
  },
  'cliente-concentrado': {
    revenueFactor: [1, 1.3],
    trendPerMonth: [0, 0.01],
    seasonality: [0, 0.1],
    personalPerMonth: [0, 1],
    topClientShare: 0.75,
    missChance: 0.25,
    balanceMonths: [0.5, 2],
    historyMonths: [5, 12],
  },
  'recem-aberto': {
    revenueFactor: [0.7, 1.3],
    trendPerMonth: [0, 0.05],
    seasonality: [0, 0],
    personalPerMonth: [0, 3],
    missChance: 0.2,
    balanceMonths: [0.5, 3],
    historyMonths: [0, 0],
  },
  'aporte-de-investidor': {
    revenueFactor: [0.2, 0.5],
    trendPerMonth: [0.05, 0.12],
    seasonality: [0, 0],
    personalPerMonth: [0, 0],
    missChance: 0.05,
    balanceMonths: [5, 11],
    historyMonths: [6, 12],
    investment: true,
    types: ['STARTUP'],
  },
};

export type SimulatedTransaction = { date: string; amount: string; description: string };
export type SimulatedCommitment = {
  type: 'FIXED_EXPENSE' | 'RECEIVABLE';
  description: string;
  amount: string;
  dueDate: string;
  recurrence: 'NONE' | 'MONTHLY';
};
export type SimulatedBusiness = {
  seed: number;
  profile: string;
  scenario: SimulationScenario;
  historyMonths: number;
  cashBalance: string;
  transactions: SimulatedTransaction[];
  commitments: SimulatedCommitment[];
  trackPercents: number[];
};

export type SimulationInput = {
  seed: number;
  // Data de hoje (AAAA-MM-DD): as transações vão até ontem, e os compromissos vencem depois.
  asOf: string;
  type: BusinessType;
  trackCount?: number;
};

// Próxima data com o dia pedido, a partir de amanhã.
function nextOn(day: number, asOf: string): string {
  const thisMonth = dateInMonth(monthOf(asOf), day);
  return thisMonth > asOf ? thisMonth : dateInMonth(addMonths(monthOf(asOf), 1), day);
}

const round = (cents: number) => Math.max(1, Math.round(cents));

export function generateSimulatedBusiness(input: SimulationInput): SimulatedBusiness {
  const random = mulberry32(input.seed);
  const scenarioId = pick(
    random,
    SIMULATION_SCENARIOS.filter((id) => SCENARIOS[id].types?.includes(input.type) ?? true),
  );
  const shape = SCENARIOS[scenarioId];
  const profile = pick(
    random,
    PROFILES.filter((p) => p.types.includes(input.type)),
  );

  // Escala: o mesmo perfil varia de tamanho de um negócio para outro.
  const scale = between(random, 0.6, 1.6);
  const fixed = profile.fixed.map((f) => ({ ...f, cents: round(f.cents * scale) }));
  const variable = profile.variable.map((v) => ({ ...v, cents: round(v.cents * scale) }));
  const withdrawal = round(profile.withdrawalCents * scale * between(random, 0.7, 1.2));
  const monthlyExpense =
    fixed.reduce((sum, f) => sum + f.cents, 0) +
    variable.reduce((sum, v) => sum + v.cents * v.perMonth, 0) +
    (profile.withdrawalCents > 0 ? withdrawal : 0);

  const revenueNow = monthlyExpense * between(random, ...shape.revenueFactor);
  const trend = between(random, ...shape.trendPerMonth);
  const seasonality = between(random, ...shape.seasonality);
  const seasonPhase = intBetween(random, 0, 11);

  const clients = sample(random, profile.clients, intBetween(random, 2, profile.clients.length));
  const weights = clients.map(() => between(random, 0.5, 1.5));
  if (shape.topClientShare !== undefined && clients.length > 1) {
    const others = weights.slice(1).reduce((sum, w) => sum + w, 0);
    weights[0] = (shape.topClientShare / (1 - shape.topClientShare)) * others;
  }
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const prefixes = clients.map(() => pick(random, profile.incomePrefixes));

  const currentMonth = monthOf(input.asOf);
  // O recém-aberto começa no meio de um mês, poucas semanas atrás, e não no dia 1.
  const startDate =
    scenarioId === 'recem-aberto'
      ? addDays(input.asOf, -intBetween(random, 15, 75))
      : `${addMonths(currentMonth, -intBetween(random, ...shape.historyMonths))}-01`;
  const firstMonth = monthOf(startDate);
  let historyMonths = 0;
  while (addMonths(firstMonth, historyMonths) < currentMonth) historyMonths += 1;

  const raw: { date: string; cents: number; description: string }[] = [];
  const push = (date: string, cents: number, description: string) => {
    if (date >= startDate && date < input.asOf) raw.push({ date, cents, description });
  };

  for (let index = 0; index <= historyMonths; index += 1) {
    const month = addMonths(firstMonth, index);
    const monthNumber = Number(month.slice(5, 7));
    const level =
      (1 + trend) ** (index - historyMonths) *
      (1 + seasonality * Math.sin((2 * Math.PI * (monthNumber + seasonPhase)) / 12));
    const revenue = revenueNow * level * between(random, 0.9, 1.1);
    // Fornecedores acompanham o movimento, com limites para não zerar nem explodir.
    const activity = Math.min(1.5, Math.max(0.5, level));

    clients.forEach((client, i) => {
      const missChance = i === 0 ? shape.missChance : shape.missChance / 2;
      if (chance(random, missChance)) return;
      const total = (revenue * (weights[i] as number)) / totalWeight;
      const payments = intBetween(random, ...profile.paymentsPerClient);
      for (let p = 0; p < payments; p += 1) {
        const cents = round((total / payments) * between(random, 0.8, 1.2));
        push(dateInMonth(month, intBetween(random, 1, 28)), cents, `${prefixes[i]} ${client}`);
      }
    });

    for (const f of fixed) {
      const cents = f.varies ? round(f.cents * between(random, 0.85, 1.15) * activity) : f.cents;
      push(dateInMonth(month, f.day), -cents, f.description);
    }
    for (const v of variable) {
      for (let p = 0; p < v.perMonth; p += 1) {
        const cents = round(v.cents * activity * between(random, 0.7, 1.3));
        push(dateInMonth(month, intBetween(random, 1, 28)), -cents, pick(random, v.descriptions));
      }
    }
    if (profile.withdrawalCents > 0 && !chance(random, 0.1)) {
      push(dateInMonth(month, intBetween(random, 14, 16)), -withdrawal, 'PRO LABORE');
    }
    const small = intBetween(random, 2, 4);
    for (let p = 0; p < small; p += 1) {
      const cents = round(4_000 * scale * between(random, 0.3, 2));
      push(
        dateInMonth(month, intBetween(random, 1, 28)),
        -cents,
        pick(random, SMALL_BUSINESS_EXPENSES),
      );
    }
    const personal = intBetween(random, ...shape.personalPerMonth);
    for (let p = 0; p < personal; p += 1) {
      const expense = pick(random, PERSONAL_EXPENSES);
      const cents = round(expense.cents * between(random, 0.6, 1.4));
      push(dateInMonth(month, intBetween(random, 1, 28)), -cents, expense.description);
    }
    if (shape.investment && index === 1) {
      const cents = round(monthlyExpense * between(random, 10, 18));
      push(
        dateInMonth(month, intBetween(random, 5, 20)),
        cents,
        'TED RECEBIDA APORTE INVESTIDOR ANJO',
      );
    }
  }

  const commitments: SimulatedCommitment[] = fixed
    .filter((f) => f.commitment)
    .map((f) => ({
      type: 'FIXED_EXPENSE' as const,
      description: f.commitment as string,
      amount: fromCents(f.cents),
      dueDate: nextOn(f.day, input.asOf),
      recurrence: 'MONTHLY' as const,
    }));
  const receivables = intBetween(random, 0, 3);
  for (let r = 0; r < receivables; r += 1) {
    const client = r === 0 ? (clients[0] as string) : pick(random, clients);
    commitments.push({
      type: 'RECEIVABLE',
      description: `${pick(random, profile.receivableNames)} (${client.toLowerCase()})`.slice(
        0,
        191,
      ),
      amount: fromCents(round(revenueNow * between(random, 0.1, 0.4))),
      dueDate: addDays(input.asOf, intBetween(random, 3, 40)),
      recurrence: 'NONE',
    });
  }
  if (shape.urgentExpense || chance(random, 0.3)) {
    commitments.push({
      type: 'FIXED_EXPENSE',
      description: pick(random, [
        'Parcela do equipamento',
        'Conserto emergencial',
        'Imposto atrasado parcelado',
        'Compra de estoque à vista',
      ]),
      amount: fromCents(
        round(
          monthlyExpense *
            (shape.urgentExpense ? between(random, 0.5, 0.9) : between(random, 0.1, 0.3)),
        ),
      ),
      dueDate: addDays(
        input.asOf,
        intBetween(random, shape.urgentExpense ? 2 : 5, shape.urgentExpense ? 10 : 30),
      ),
      recurrence: 'NONE',
    });
  }

  const trackPercents = Array.from({ length: input.trackCount ?? 0 }, () =>
    pick(random, [0, 0, 0, 20, 40, 50, 60, 80, 100]),
  );

  raw.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1));
  return {
    seed: input.seed,
    profile: profile.id,
    scenario: scenarioId,
    historyMonths,
    cashBalance: fromCents(Math.round(monthlyExpense * between(random, ...shape.balanceMonths))),
    transactions: raw.map((t) => ({
      date: t.date,
      amount: fromCents(t.cents),
      description: t.description,
    })),
    commitments,
    trackPercents,
  };
}
