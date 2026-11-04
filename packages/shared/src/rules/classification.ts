export const LABELS = ['PERSONAL', 'BUSINESS', 'TAX', 'SUPPLIER', 'WITHDRAWAL'] as const;
export type Label = (typeof LABELS)[number];
export type LabelSource = 'RULE' | 'LEARNED' | 'USER';

export type LearnedRule = { pattern: string; label: Label };

export type Classification = {
  label: Label;
  category: string;
  source: Exclude<LabelSource, 'USER'>;
};

const CATEGORY_BY_LABEL: Record<Label, string> = {
  PERSONAL: 'pessoal',
  BUSINESS: 'operacao',
  TAX: 'impostos',
  SUPPLIER: 'fornecedores',
  WITHDRAWAL: 'retirada',
};

const KEYWORD_RULES: { label: Label; pattern: RegExp }[] = [
  { label: 'TAX', pattern: /\b(DAS|DARF|GPS|SIMPLES NACIONAL|INSS|IRPJ|IRPF|ISS|ICMS|FGTS)\b/ },
  { label: 'WITHDRAWAL', pattern: /\b(PRO ?LABORE|RETIRADA|DISTRIBUICAO DE LUCROS?)\b/ },
  { label: 'SUPPLIER', pattern: /\b(FORNECEDOR|DISTRIBUIDORA|ATACADO|ATACADISTA|INSUMOS?)\b/ },
  {
    label: 'PERSONAL',
    pattern:
      /\b(SUPERMERCADO|MERCADO|FARMACIA|DROGARIA|RESTAURANTE|LANCHONETE|PADARIA|ESCOLA|NETFLIX|SPOTIFY|ACADEMIA|PLANO DE SAUDE)\b/,
  },
];

// Números somem do padrão para "PIX 123 JOAO" e "PIX 456 JOAO" serem a mesma regra aprendida.
export function normalizeDescription(description: string): string {
  return description
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 191);
}

export function categoryFor(label: Label, amountCents: number): string {
  if (label === 'BUSINESS' && amountCents > 0) {
    return 'receitas';
  }
  return CATEGORY_BY_LABEL[label];
}

export function originOf(label: Label): 'PERSONAL' | 'BUSINESS' {
  return label === 'PERSONAL' || label === 'WITHDRAWAL' ? 'PERSONAL' : 'BUSINESS';
}

export function classifyTransaction(
  description: string,
  amountCents: number,
  learnedRules: readonly LearnedRule[] = [],
): Classification {
  const normalized = normalizeDescription(description);
  const learned = learnedRules.find((rule) => rule.pattern === normalized);
  if (learned) {
    return {
      label: learned.label,
      category: categoryFor(learned.label, amountCents),
      source: 'LEARNED',
    };
  }
  // Entradas não viram imposto, fornecedor ou gasto pessoal só por citar uma palavra-chave.
  const keyword =
    amountCents < 0 ? KEYWORD_RULES.find((rule) => rule.pattern.test(normalized)) : undefined;
  const label = keyword?.label ?? 'BUSINESS';
  return { label, category: categoryFor(label, amountCents), source: 'RULE' };
}
