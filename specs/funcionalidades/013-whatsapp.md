# 013: canal WhatsApp

**Situação:** `a fazer`
**Depende de:** 011
**Referências:** regras 7 e 11, decisão 0003, P-12

## Objetivo

Receber mensagens e enviar alertas pelo WhatsApp, com adaptador simulado até haver conta real.

## Requisitos

- R1: O webhook valida a assinatura `X-Hub-Signature-256` e rejeita o que não for válido.
- R2: Sem segredo configurado, o webhook fica indisponível.
- R3: Mensagem repetida não gera outra resposta.
- R4: O texto das mensagens não é guardado nem registrado em log.
- R5: A resposta exige telefone cadastrado e consentimento ativo.
- R6: O envio passa por uma interface, com implementação simulada.

## Critérios de aceite

- [ ] C1: Quando a assinatura é inválida, então recebo `401`.
- [ ] C2: Quando a mesma mensagem chega duas vezes, então só há uma resposta.
- [ ] C3: Quando o remetente não tem consentimento ativo, então nenhum dado financeiro é enviado.

## Tarefas

- [ ] T1: implementar os requisitos.
- [ ] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
