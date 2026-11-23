# 027: simulação dos negócios antigos

**Situação:** `concluída`
**Depende de:** 025
**Referências:** `specs/constituicao.md` (regras 7, 9 e 18), [decisão 0005](../decisoes/0005-producao-como-ambiente-simulado.md)

## Objetivo

A [025](025-ambiente-simulado.md) só preenche negócios criados depois de ligar o `SIMULATION_MODE`. Os negócios cadastrados antes disso continuam vazios, sem extrato, previsão nem alertas. Esta funcionalidade cria um comando de operação que aplica a mesma simulação a esses negócios, para que todas as contas de produção mostrem o produto completo.

## Requisitos

- R1: O comando `businesses:simulate` percorre os negócios e simula os vazios: sem transações e sem compromissos.
- R2: Um negócio com consentimento de entrada assistida revogado fica de fora, porque a pessoa recusou o tratamento. Se já houver um consentimento concedido, ele é reaproveitado, sem criar outro.
- R3: O saldo informado é substituído pelo saldo sorteado, para casar com as transações simuladas.
- R4: O progresso já registrado numa trilha é mantido; o sorteio só preenche as trilhas sem progresso.
- R5: Cada negócio é simulado na própria transação, com `business.simulate` no `audit_log` em nome do dono. Rodar o comando de novo não muda nada, porque os negócios simulados deixam de estar vazios (regra 18).
- R6: Com `--dry-run`, o comando só informa quantos negócios seriam simulados. A saída traz identificadores, cenários e sementes, nunca valores (regra 7).

## Fora do escopo

- Negócios com extrato ou compromissos cadastrados.
- Apagar dados simulados.

## Critérios de aceite

- [x] C1: Dado um negócio vazio, quando rodo o comando, então ele ganha saldo, transações, compromissos e um registro `business.simulate`.
- [x] C2: Dado um negócio com transações ou com consentimento revogado, quando rodo o comando, então ele não muda.
- [x] C3: Dado um negócio vazio com consentimento concedido e progresso numa trilha, quando rodo o comando, então continua com um só consentimento e o progresso daquela trilha não muda.
- [x] C4: Quando rodo o comando duas vezes, então a segunda não simula nada.

## Plano técnico

- `apps/api/src/modules/simulation.ts`: `populateSimulatedBusiness` reaproveita o consentimento concedido e pula trilhas com progresso; `simulateEmptyBusinesses` seleciona e simula os negócios vazios.
- `apps/api/src/cli/simulate-businesses.ts`: comando de operação, com `--dry-run`.
- Na produção: `docker compose exec api node apps/api/dist/cli/simulate-businesses.js`.

## Tarefas

- [x] T1: seleção e simulação dos negócios vazios.
- [x] T2: comando de operação.
- [x] T3: teste de integração.
- [x] T4: execução na produção.

## Notas

O teste de integração (`apps/api/test/integration/simulation.test.ts`) cobre C1 a C4 e passou contra o MySQL 8.0. Um consentimento revogado deixa o negócio de fora mesmo que exista outro concedido depois: na dúvida, o comando não trata dados de quem recusou.

Em 22/11/2026, o comando rodou em produção. O `--dry-run` listou os negócios 1 e 2, criados antes do modo; o 3 já tinha sido simulado na criação. O negócio 1 (startup) recebeu `aporte-de-investidor`, e o 2 (MEI), `crescimento`. O worker calculou a previsão dos dois, e o 1 ganhou o alerta de fôlego curto.
