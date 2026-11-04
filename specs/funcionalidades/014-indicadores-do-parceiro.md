# 014: indicadores agregados do parceiro

**Situação:** `a fazer`
**Depende de:** 010
**Referências:** regras 4 e 10, P-11

## Objetivo

Mostrar ao parceiro só indicadores agregados, sem dados individuais.

## Requisitos

- R1: O worker calcula os indicadores por parceiro e período.
- R2: Só entram negócios com consentimento ativo de `partner_aggregates`.
- R3: Indicador com menos de 5 negócios não é publicado.
- R4: `GET /partners/:id/metrics` lê só `partner_metrics`, com usuário de banco somente leitura em produção.

## Critérios de aceite

- [ ] C1: Com 4 negócios no grupo, então o indicador não aparece.
- [ ] C2: Quando outra pessoa consulta o parceiro, então recebe `404`.
- [ ] C3: O usuário somente leitura não consegue ler `transactions`.

## Tarefas

- [ ] T1: implementar os requisitos.
- [ ] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
