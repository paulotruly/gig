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

  it('exige o banco e, em produção, a conexão somente leitura do parceiro', () => {
    expect(() => loadConfig({})).toThrow('DATABASE_URL');
    expect(() => loadConfig({ DATABASE_URL, NODE_ENV: 'production' })).toThrow(
      'DATABASE_URL_PARTNER_METRICS',
    );
  });
});
