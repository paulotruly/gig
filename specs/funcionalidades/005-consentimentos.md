# 005: consentimentos e auditoria

**Situação:** `concluída`
**Depende de:** 004
**Referências:** regras 5, 6 e 9

## Objetivo

Registrar cada consentimento com finalidade e permitir a revogação, com histórico imutável.

## Requisitos

- R1: `POST /consents` concede por finalidade, com expiração.
- R2: `DELETE /consents/:id` insere nova linha, sem apagar.
- R3: O consentimento é ativo se a linha mais recente é de concessão e não expirou.
- R4: Acessos e alterações sensíveis vão para `audit_log`.

## Critérios de aceite

- [x] C1: Quando revogo, então o histórico mantém a concessão e a revogação.
- [x] C2: Quando o consentimento expira, então ele deixa de valer.
- [x] C3: Quando altero um dado sensível, então `audit_log` registra o evento sem dados financeiros.

## Tarefas

- [x] T1: implementar os requisitos.
- [x] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
