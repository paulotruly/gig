import { createHash } from 'node:crypto';
import { isDecimalString, isIsoDate } from '@gig/shared';
import { HttpError } from '../errors';

export type ParsedTransaction = {
  date: string;
  amount: string;
  description: string;
  dedupKey: string;
};

const MAX_ROWS = 50_000;

// O erro cita a linha, nunca o conteúdo, que pode trazer dados pessoais (regra 7).
function invalidFile(detail: string): HttpError {
  return new HttpError(400, 'invalid_statement', `Extrato inválido: ${detail}.`);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((field) => field.trim());
}

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

const DATE_HEADERS = ['data', 'date', 'data lancamento', 'data do lancamento'];
const DESCRIPTION_HEADERS = ['descricao', 'description', 'historico', 'lancamento', 'memo'];
const AMOUNT_HEADERS = ['valor', 'amount', 'valor (r$)', 'valor r$'];

function parseDate(value: string): string | null {
  const brazilian = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const iso = brazilian ? `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}` : value;
  return isIsoDate(iso) ? iso : null;
}

// Aceita "1.234,56", "-1234,56" e "1234.56"; "1.234" sozinho é ambíguo e é recusado.
function parseAmount(value: string): string | null {
  const cleaned = value.replace(/R\$\s*/i, '').replace(/\s/g, '');
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
    : cleaned;
  if (!isDecimalString(normalized) || /^-?\d+\.\d{3}$/.test(cleaned)) {
    return null;
  }
  const [whole = '0', fraction = ''] = normalized.split('.');
  return `${whole}.${fraction.padEnd(2, '0')}`;
}

export function parseCsv(content: string): ParsedTransaction[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const headerLine = lines[0];
  if (!headerLine) {
    throw invalidFile('arquivo vazio');
  }
  if (lines.length - 1 > MAX_ROWS) {
    throw invalidFile(`mais de ${MAX_ROWS} linhas`);
  }
  const delimiter = headerLine.includes(';') ? ';' : ',';
  const headers = parseCsvLine(headerLine, delimiter).map(normalizeHeader);
  const dateIndex = headers.findIndex((h) => DATE_HEADERS.includes(h));
  const descriptionIndex = headers.findIndex((h) => DESCRIPTION_HEADERS.includes(h));
  const amountIndex = headers.findIndex((h) => AMOUNT_HEADERS.includes(h));
  if (dateIndex < 0 || descriptionIndex < 0 || amountIndex < 0) {
    throw invalidFile('o cabeçalho precisa ter data, descrição e valor');
  }

  // Lançamentos idênticos no mesmo arquivo são legítimos: a ordem entre eles entra na chave.
  const occurrences = new Map<string, number>();
  return lines.slice(1).map((line, index) => {
    const fields = parseCsvLine(line, delimiter);
    const date = parseDate(fields[dateIndex] ?? '');
    const amount = parseAmount(fields[amountIndex] ?? '');
    const description = (fields[descriptionIndex] ?? '').slice(0, 255);
    if (!date || !amount || description.length === 0) {
      throw invalidFile(`linha ${index + 2}`);
    }
    const base = `${date}|${amount}|${description.toUpperCase()}`;
    const occurrence = occurrences.get(base) ?? 0;
    occurrences.set(base, occurrence + 1);
    return { date, amount, description, dedupKey: sha256(`csv|${base}|${occurrence}`) };
  });
}

function ofxField(block: string, tag: string): string | null {
  const match = new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i').exec(block);
  return match?.[1]?.trim() || null;
}

export function parseOfx(content: string): ParsedTransaction[] {
  const blocks = content.match(/<STMTTRN>[\s\S]*?(?=<\/STMTTRN>|<STMTTRN>|$)/gi);
  if (!blocks) {
    throw invalidFile('nenhuma transação encontrada');
  }
  if (blocks.length > MAX_ROWS) {
    throw invalidFile(`mais de ${MAX_ROWS} transações`);
  }
  return blocks.map((block, index) => {
    const posted = ofxField(block, 'DTPOSTED') ?? '';
    const date = parseDate(`${posted.slice(0, 4)}-${posted.slice(4, 6)}-${posted.slice(6, 8)}`);
    const amount = parseAmount(ofxField(block, 'TRNAMT') ?? '');
    const id = ofxField(block, 'FITID');
    const description = (ofxField(block, 'MEMO') ?? ofxField(block, 'NAME') ?? '').slice(0, 255);
    if (!date || !amount || !id || description.length === 0) {
      throw invalidFile(`transação ${index + 1}`);
    }
    return { date, amount, description, dedupKey: sha256(`ofx|${id}`) };
  });
}
