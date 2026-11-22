import { InvalidConfigError, loadConfig } from '../src/config';

const DATABASE_URL = 'mysql://gig:senha@127.0.0.1:3306/gig';

describe('loadConfig', () => {
  it('aplica os valores padrão', () => {
    expect(loadConfig({ DATABASE_URL })).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
    });
  });

  it('rejeita valor inválido citando a variável, sem mostrar o valor', () => {
    expect.assertions(3);
    try {
      loadConfig({ DATABASE_URL, PORT: 'valor-secreto' });
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidConfigError);
      expect((err as Error).message).toContain('PORT');
      expect((err as Error).message).not.toContain('valor-secreto');
    }
  });

  it('trata os segredos do WhatsApp vazios como ausentes', () => {
    const config = loadConfig({ DATABASE_URL, WHATSAPP_APP_SECRET: '', WHATSAPP_VERIFY_TOKEN: '' });
    expect(config.WHATSAPP_APP_SECRET).toBeUndefined();
    expect(config.WHATSAPP_VERIFY_TOKEN).toBeUndefined();
  });

  it('só liga o ambiente simulado com o texto true', () => {
    expect(loadConfig({ DATABASE_URL }).SIMULATION_MODE).toBe(false);
    expect(loadConfig({ DATABASE_URL, SIMULATION_MODE: '' }).SIMULATION_MODE).toBe(false);
    expect(loadConfig({ DATABASE_URL, SIMULATION_MODE: 'false' }).SIMULATION_MODE).toBe(false);
    expect(loadConfig({ DATABASE_URL, SIMULATION_MODE: 'true' }).SIMULATION_MODE).toBe(true);
    expect(() => loadConfig({ DATABASE_URL, SIMULATION_MODE: 'sim' })).toThrow('SIMULATION_MODE');
  });

  it('exige o banco e, em produção, a conexão somente leitura do parceiro', () => {
    expect(() => loadConfig({})).toThrow('DATABASE_URL');
    expect(() => loadConfig({ DATABASE_URL, NODE_ENV: 'production' })).toThrow(
      'DATABASE_URL_PARTNER_METRICS',
    );
  });
});
