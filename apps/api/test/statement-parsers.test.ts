import { HttpError } from '../src/errors';
import { parseCsv, parseOfx } from '../src/modules/statement-parsers';

describe('parseCsv', () => {
  it('lê o formato brasileiro, com ponto e vírgula e valor com vírgula', () => {
    const [row] = parseCsv('\uFEFFData;Histórico;Valor\n05/10/2026;"Pix; recebido";"1.234,56"\n');
    expect(row).toMatchObject({
      date: '2026-10-05',
      description: 'Pix; recebido',
      amount: '1234.56',
    });
  });

  it('lê o formato internacional e valores negativos', () => {
    const rows = parseCsv('date,description,amount\n2026-10-05,Aluguel,-1500.5\n');
    expect(rows[0]).toMatchObject({ date: '2026-10-05', amount: '-1500.50' });
  });

  it('mantém lançamentos idênticos com chaves diferentes e estáveis', () => {
    const csv = 'data;descricao;valor\n05/10/2026;Taxa;-1,00\n05/10/2026;Taxa;-1,00\n';
    const [first, second] = parseCsv(csv);
    expect(first?.dedupKey).not.toBe(second?.dedupKey);
    expect(parseCsv(csv)[0]?.dedupKey).toBe(first?.dedupKey);
  });

  it('recusa valor ambíguo e data inexistente, citando só a linha', () => {
    const ambiguous = 'data;descricao;valor\n05/10/2026;DADO-SENSIVEL;1.234\n';
    expect(() => parseCsv(ambiguous)).toThrow(HttpError);
    expect(() => parseCsv(ambiguous)).toThrow(/linha 2/);
    expect(() => parseCsv(ambiguous)).not.toThrow(/SENSIVEL/);
    expect(() => parseCsv('data;descricao;valor\n31/02/2026;x;1,00\n')).toThrow(/linha 2/);
  });

  it('recusa cabeçalho sem as colunas e arquivo vazio', () => {
    expect(() => parseCsv('a;b;c\n1;2;3\n')).toThrow(/cabeçalho/);
    expect(() => parseCsv('\n')).toThrow(/vazio/);
  });
});

describe('parseOfx', () => {
  const ofx = `<OFX><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261005120000[-3:BRT]<TRNAMT>-75.60<FITID>A1<MEMO>PGTO DAS</STMTTRN>
<STMTTRN>
<DTPOSTED>20261006
<TRNAMT>1000,00
<FITID>A2
<NAME>Venda
</STMTTRN></BANKTRANLIST></OFX>`;

  it('lê SGML com e sem quebra de linha', () => {
    const rows = parseOfx(ofx);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      date: '2026-10-05',
      amount: '-75.60',
      description: 'PGTO DAS',
    });
    expect(rows[1]).toMatchObject({ date: '2026-10-06', amount: '1000.00', description: 'Venda' });
  });

  it('usa o identificador do banco na chave', () => {
    const again = parseOfx(ofx.replace('PGTO DAS', 'OUTRA DESCRICAO'));
    expect(again[0]?.dedupKey).toBe(parseOfx(ofx)[0]?.dedupKey);
  });

  it('recusa arquivo sem transações ou sem identificador', () => {
    expect(() => parseOfx('<OFX></OFX>')).toThrow(/nenhuma transação/);
    expect(() => parseOfx('<STMTTRN><DTPOSTED>20261005<TRNAMT>1.00<MEMO>x</STMTTRN>')).toThrow(
      /transação 1/,
    );
  });
});
