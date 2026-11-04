export interface WhatsAppSender {
  send(to: string, text: string): Promise<void>;
}

type MinimalLogger = { info(data: object, message: string): void };

// Até haver conta WhatsApp Business. Telefone e texto nunca vão para o log (regra 7).
export class SimulatedWhatsAppSender implements WhatsAppSender {
  constructor(private readonly logger: MinimalLogger) {}

  async send(_to: string, text: string): Promise<void> {
    this.logger.info({ characters: text.length }, 'envio simulado pelo WhatsApp');
  }
}
