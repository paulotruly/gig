import { randomBytes } from 'node:crypto';
import { decryptToken, encryptToken } from '../src/token-cipher';

const key = randomBytes(32).toString('base64');

describe('token-cipher', () => {
  it('cifra e decifra, com resultado diferente a cada vez', () => {
    const first = encryptToken('token-de-acesso', key);
    expect(first).not.toContain('token-de-acesso');
    expect(first).not.toBe(encryptToken('token-de-acesso', key));
    expect(decryptToken(first, key)).toBe('token-de-acesso');
  });

  it('recusa token adulterado e chave errada', () => {
    const stored = encryptToken('token-de-acesso', key);
    const [iv, tag, data = ''] = stored.split('.');
    const flipped = Buffer.from(data, 'base64');
    flipped[0] = (flipped[0] ?? 0) ^ 1;
    const tampered = [iv, tag, flipped.toString('base64')].join('.');
    expect(() => decryptToken(tampered, key)).toThrow();
    expect(() => decryptToken(stored, randomBytes(32).toString('base64'))).toThrow();
  });

  it('recusa chave de tamanho errado', () => {
    expect(() => encryptToken('x', randomBytes(16).toString('base64'))).toThrow(RangeError);
  });
});
