# 012: trilhas e progresso

**Situação:** `concluída`
**Depende de:** 004
**Referências:** `specs/contrato-api.md`, P-16

## Objetivo

Oferecer trilhas de educação e registrar o progresso por negócio.

## Requisitos

- R1: `GET /tracks` lista as trilhas.
- R2: `POST /tracks/:id/progress` registra o progresso do negócio informado, de 0 a 100.
- R3: O progresso nunca regride.
- R4: Concluir uma trilha gera o evento `track_completed` uma só vez.

## Critérios de aceite

- [x] C1: Quando envio progresso para negócio alheio, então recebo `404`.
- [x] C2: Quando envio um progresso menor que o atual, então o valor maior é mantido.

## Tarefas

- [x] T1: implementar os requisitos.
- [x] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.

As quatro trilhas têm só título e resumo provisórios (P-16).
