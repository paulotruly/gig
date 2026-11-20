// Só formatação para exibir: nenhum valor oficial é calculado no front (regra 11).

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const HIDDEN_VALUE = '••••••';

// A API envia dinheiro como texto decimal, como "1200.50".
export function formatMoney(decimal: string | null | undefined, hidden = false): string {
  if (hidden) return HIDDEN_VALUE;
  if (decimal === null || decimal === undefined) return '—';
  return currency.format(Number(decimal));
}

export function formatSignedMoney(decimal: string, hidden = false): string {
  if (hidden) return HIDDEN_VALUE;
  const formatted = currency.format(Math.abs(Number(decimal)));
  return decimal.startsWith('-') ? `- ${formatted}` : `+ ${formatted}`;
}

export function isNegative(decimal: string): boolean {
  return decimal.startsWith('-');
}

// Converte o que a pessoa digitou ("1.234,56") no texto decimal da API ("1234.56").
// A validação de verdade fica nos esquemas de @gig/shared/contracts e na API.
export function moneyInputToDecimal(input: string): string {
  const cleaned = input.replace(/[R$\s]/g, '');
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  return normalized;
}

// Datas ISO (AAAA-MM-DD) exibidas sem passar pelo fuso horário do navegador.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatRunway(runway: { months: string | null; status: string }): string {
  if (runway.status === 'not_burning' || runway.months === null) return 'Sem queima de caixa';
  return `${runway.months.replace('.', ',')} meses`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export const LABEL_NAMES = {
  BUSINESS: 'Empresa (PJ)',
  PERSONAL: 'Pessoal (PF)',
  TAX: 'Tributo',
  SUPPLIER: 'Fornecedor',
  WITHDRAWAL: 'Retirada',
} as const;

export const LABEL_SOURCE_NAMES = {
  RULE: 'Regra',
  LEARNED: 'Aprendido',
  USER: 'Você',
} as const;

export const BUSINESS_TYPE_NAMES = {
  MEI: 'MEI',
  ME: 'ME',
  STARTUP: 'Startup',
  SERVICE_PROVIDER: 'Prestador',
} as const;
