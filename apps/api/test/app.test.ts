import { Writable } from 'node:stream';
import { Router } from 'express';
import { pino } from 'pino';
import request from 'supertest';
import { createApp } from '../src/app';

function setup() {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(String(chunk));
      callback();
    },
  });
  const routes = Router();
  routes.get('/falha', async () => {
    throw new Error('segredo-interno');
  });
  routes.post('/eco', (_req, res) => {
    res.status(204).end();
  });
  const app = createApp({ logger: pino({ level: 'info' }, destination), routers: [routes] });
  return { app, lines };
}

describe('API', () => {
  it('responde ao healthcheck', async () => {
    const res = await request(setup().app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('aplica cabeçalhos de segurança', async () => {
    const res = await request(setup().app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('responde 404 no formato padrão', async () => {
    const res = await request(setup().app).get('/inexistente');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('responde 500 sem vazar a mensagem original, nem na resposta nem no log', async () => {
    const { app, lines } = setup();
    const res = await request(app).get('/falha');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('internal_error');
    expect(JSON.stringify(res.body)).not.toContain('segredo-interno');
    expect(lines.join('')).toContain('erro interno');
    expect(lines.join('')).not.toContain('segredo-interno');
  });

  it('responde 400 para JSON malformado', async () => {
    const res = await request(setup().app)
      .post('/eco')
      .set('Content-Type', 'application/json')
      .send('{"quebrado":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_json');
  });

  it('não registra corpo, cookies, autorização nem query string', async () => {
    const { app, lines } = setup();
    await request(app)
      .post('/eco?cpf=QUERY-SENSIVEL')
      .set('Cookie', 'sessao=COOKIE-SENSIVEL')
      .set('Authorization', 'Bearer TOKEN-SENSIVEL')
      .send({ descricao: 'CORPO-SENSIVEL' });

    const log = lines.join('');
    expect(log).toContain('"path":"/eco"');
    for (const sensitive of ['QUERY', 'COOKIE', 'TOKEN', 'CORPO']) {
      expect(log).not.toContain(`${sensitive}-SENSIVEL`);
    }
  });
});
