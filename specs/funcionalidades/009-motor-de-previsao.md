# 009: motor de previsão

**Situação:** `a fazer`
**Depende de:** Funções puras: 001. Integração: 007 e 008
**Referências:** `specs/motor-de-previsao.md`, regras 2, 12, 13 e 14

## Objetivo

Responder quanto sobra, por quanto tempo o caixa aguenta e quanto é seguro retirar.

## Requisitos

- R1: O motor é uma função pura, sem acesso ao banco nem ao relógio.
- R2: O cálculo usa centavos inteiros, sem ponto flutuante.
- R3: A previsão sai em três cenários, com runway e retirada segura.
- R4: `GET /businesses/:id/forecast` devolve a previsão mais recente.

## Critérios de aceite

- [ ] C1: A mesma entrada e a mesma versão das regras geram o mesmo resultado.
- [ ] C2: Com menos de 3 meses completos, não há previsão.
- [ ] C3: Com queima zero ou negativa, o runway vem nulo com `not_burning`.
- [ ] C4: O saldo conservador nunca supera o provável, e o provável nunca supera o favorável.
- [ ] C5: A retirada segura nunca deixa o saldo conservador negativo.

## Tarefas

- [ ] T1: implementar os requisitos.
- [ ] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
