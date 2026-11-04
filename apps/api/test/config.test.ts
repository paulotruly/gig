import { InvalidConfigError, loadConfig } from '../src/config';

describe('loadConfig', () => {
  it('aplica os valores padrão', () => {
    expect(loadConfig({})).toEqual({ NODE_ENV: 'development', PORT: 3000, LOG_LEVEL: 'info' });
  });

  it('rejeita valor inválido citando a variável, sem mostrar o valor', () => {
    expect.assertions(3);
    try {
      loadConfig({ PORT: 'valor-secreto' });
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidConfigError);
      expect((err as Error).message).toContain('PORT');
      expect((err as Error).message).not.toContain('valor-secreto');
    }
  });
});
