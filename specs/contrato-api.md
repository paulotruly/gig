# Contrato da API

Fonte: [09] §06. Status geral: `proposto`.

## Endpoints

| Método e rota | Função | Quem acessa |
|---|---|---|
| `POST /auth/login` | Abrir sessão | Empreendedor e parceiro |
| `POST /auth/refresh` | Renovar sessão | Empreendedor e parceiro |
| `POST /consents` | Conceder consentimento | Empreendedor |
| `DELETE /consents/:id` | Revogar consentimento (insere nova linha, sem apagar) | Empreendedor |
| `GET /businesses/:id/transactions` | Listar transações classificadas | Empreendedor |
| `PATCH /transactions/:id` | Corrigir a classificação | Empreendedor |
| `GET /businesses/:id/forecast` | Três cenários, runway e retirada segura | Empreendedor |
| `GET /businesses/:id/alerts` | Alertas e a explicação de cada um | Empreendedor |
| `GET /tracks` | Listar trilhas | Empreendedor |
| `POST /tracks/:id/progress` | Registrar progresso | Empreendedor |
| `GET /partners/:id/metrics` | Indicadores agregados | Parceiro |
| `POST /webhooks/whatsapp` | Receber mensagens do canal | WhatsApp Business |

## Faltam no contrato

- Cadastro de usuário e criação de negócio (P-01).
- Envio de extrato pela entrada assistida (P-07 e P-09).
- Gestão de compromissos fixos e recebíveis (P-02).

## Contrato da previsão

Exemplo com valores fictícios. Valores monetários trafegam como texto decimal.

```json
{
  "businessId": 42,
  "generatedAt": "2026-10-28",
  "horizonWeeks": 4,
  "scenarios": {
    "conservative": { "endBalance": "1800.00", "firstNegativeDate": "2026-11-12" },
    "likely": { "endBalance": "4300.00", "firstNegativeDate": null },
    "favorable": { "endBalance": "7600.00", "firstNegativeDate": null }
  },
  "safeWithdrawal": "1200.00",
  "explanation": [
    "Receita provável = mediana dos últimos 6 meses",
    "Compromissos fixos já provisionados"
  ],
  "rulesVersion": "1.0.0"
}
```

O exemplo não traz o runway prometido pelo endpoint (P-03).

## Regras gerais

- Toda entrada é validada na borda, e os esquemas podem ser compartilhados com o front-end.
- Respostas de previsão e webhooks têm testes de contrato.
- Toda rota com `:id` de negócio confere se o negócio pertence à sessão.
- WhatsApp recebe respostas curtas, com link para o detalhe no app, geradas pela mesma API.
