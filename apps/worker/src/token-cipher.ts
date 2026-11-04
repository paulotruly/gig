import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

function keyFrom(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) {
    throw new RangeError('A chave de cifragem precisa ter 32 bytes em base64.');
  }
  return key;
}

// A chave fica fora do banco; a coluna guarda só IV, etiqueta e texto cifrado (regra 8).
export function encryptToken(token: string, base64Key: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, keyFrom(base64Key), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64')).join('.');
}

export function decryptToken(stored: string, base64Key: string): string {
  const [iv, tag, encrypted] = stored.split('.').map((part) => Buffer.from(part, 'base64'));
  if (!iv || !tag || !encrypted) {
    throw new RangeError('Token cifrado em formato inválido.');
  }
  const decipher = createDecipheriv(ALGORITHM, keyFrom(base64Key), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
