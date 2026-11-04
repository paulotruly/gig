# Contrato da API

Fonte: [09] §06 e [decisão 0003](decisoes/0003-padroes-para-as-lacunas-do-mvp.md). Status geral: `definido` para o MVP.

## Endpoints

| Método e rota | Função | Quem acessa |
|---|---|---|
| `GET /health` | Verificar se a API está no ar | Infraestrutura |
| `POST /auth/register` | Criar usuário | Público |
| `POST /auth/login` | Abrir sessão | Empreendedor e parceiro |
| `POST /auth/refresh` | Renovar sessão | Empreendedor e parceiro |
| `POST /auth/logout` | Encerrar sessão | Empreendedor e parceiro |
| `POST /businesses`, `GET /businesses` | Criar e listar negócios | Empreendedor |
| `PUT /businesses/:id/cash-balance` | Informar o saldo atual | Dono |
| `POST /businesses/:id/members`, `DELETE /businesses/:id/members/:userId` | Autorizar e remover contador | Dono |
| `GET /businesses/:id/consents` | Listar consentimentos | Dono |
| `POST /businesses/:id/statements` | Enviar extrato em CSV ou OFX | Dono e contador autorizado |
| `GET`, `POST /businesses/:id/commitments`, `DELETE /businesses/:id/commitments/:commitmentId` | Gerir despesas fixas e recebíveis | Dono |
| `POST /consents` | Conceder consentimento | Empreendedor |
| `DELETE /consents/:id` | Revogar consentimento (insere nova linha, sem apagar) | Empreendedor |
| `GET /businesses/:id/transactions` | Listar transações classificadas | Empreendedor |
| `PATCH /transactions/:id` | Corrigir a classificação | Empreendedor |
| `GET /businesses/:id/forecast` | Três cenários, runway e retirada segura | Empreendedor |
| `GET /businesses/:id/alerts` | Alertas e a explicação de cada um | Empreendedor |
| `GET /tracks` | Listar trilhas | Empreendedor |
| `POST /tracks/:id/progress` | Registrar progresso | Empreendedor |
| `GET /partners/:id/metrics` | Indicadores agregados | Parceiro |
| `GET /webhooks/whatsapp` | Verificar o webhook | WhatsApp Business |
| `POST /webhooks/whatsapp` | Receber mensagens do canal | WhatsApp Business |

## Formato de erro

Status: `definido` na funcionalidade 001. Todo erro responde com o status HTTP adequado e este corpo:

```json
{ "error": { "code": "not_found", "message": "Recurso não encontrado." } }
```

## Contrato da previsão

Exemplo com valores fictícios. Valores monetários trafegam como texto decimal.

```json
{
  "businessId": 42,
  "generatedAt": "2026-10-28",
  "horizonWeeks": 4,
  "scenarios": {
    "conservative": {
      "endBalance": "1800.00",
      "firstNegativeDate": "2026-11-12",
      "runway": { "months": "8.5", "status": "finite" }
    },
    "likely": {
      "endBalance": "4300.00",
      "firstNegativeDate": null,
      "runway": { "months": "20.0", "status": "finite" }
    },
    "favorable": {
      "endBalance": "7600.00",
      "firstNegativeDate": null,
      "runway": { "months": null, "status": "not_burning" }
    }
  },
  "safeWithdrawal": "1200.00",
  "explanation": [
    "Receita provável = mediana dos últimos 6 meses",
    "Compromissos fixos já provisionados"
  ],
  "rulesVersion": "1.0.0"
}
```

Quando a queima é zero ou negativa, `runway.months` vem nulo e `runway.status` vale `not_burning`. Sem previsão gerada, inclusive por histórico insuficiente, o endpoint responde `404` com o código `forecast_not_ready`.

## Regras gerais

- Toda entrada é validada na borda, e os esquemas podem ser compartilhados com o front-end.
- Respostas de previsão e webhooks têm testes de contrato.
- Toda rota com `:id` de negócio confere se o negócio pertence à sessão.
- WhatsApp recebe respostas curtas, com link para o detalhe no app, geradas pela mesma API.
- Quem não pertence ao negócio recebe `404`, para não revelar que ele existe.
- O contador só acessa o envio de extrato; os demais recursos do negócio são do dono.
