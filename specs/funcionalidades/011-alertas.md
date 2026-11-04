# 011: alertas e orientação explicável

**Situação:** `a fazer`
**Depende de:** 010
**Referências:** `specs/motor-de-previsao.md`, regras 13, 15 e 16

## Objetivo

Avisar o empreendedor a tempo, mostrando dados, regra e trilha relacionada.

## Requisitos

- R1: As regras de alerta são funções puras.
- R2: Cada alerta guarda regra, dados usados, canal e situação do envio.
- R3: O mesmo alerta não se repete para a mesma data de referência.
- R4: As mensagens não culpam quem empreende e não usam IA.
- R5: `GET /businesses/:id/alerts` lista os alertas com a explicação.

## Critérios de aceite

- [ ] C1: Quando o saldo conservador fica negativo em até 15 dias, então um alerta é criado com os dados usados.
- [ ] C2: Quando o worker reexecuta, então o alerta não se repete.

## Tarefas

- [ ] T1: implementar os requisitos.
- [ ] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
