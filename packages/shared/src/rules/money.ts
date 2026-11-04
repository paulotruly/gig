const DECIMAL_PATTERN = /^-?\d{1,12}(\.\d{1,2})?$/;

export function isDecimalString(value: string): boolean {
  return DECIMAL_PATTERN.test(value);
}

// O dinheiro circula em centavos inteiros para nunca passar por ponto flutuante (regra 2).
export function toCents(value: string): number {
  if (!isDecimalString(value)) {
    throw new RangeError('Valor monetário inválido.');
  }
  const negative = value.startsWith('-');
  const [whole = '0', fraction = ''] = value.replace('-', '').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return negative ? -cents : cents;
}

export function fromCents(cents: number): string {
  const absolute = Math.abs(cents);
  const fraction = String(absolute % 100).padStart(2, '0');
  const sign = cents < 0 ? '-' : '';
  return `${sign}${Math.floor(absolute / 100)}.${fraction}`;
}

// Divisão inteira com arredondamento para o inteiro mais próximo, sem resultado fracionário.
export function divRound(numerator: number, denominator: number): number {
  const sign = Math.sign(numerator) * Math.sign(denominator);
  const n = Math.abs(numerator);
  const d = Math.abs(denominator);
  return sign * Math.floor((2 * n + d) / (2 * d));
}
