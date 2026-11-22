# 025: ambiente simulado

**Situação:** `em andamento`
**Depende de:** 004, 007, 008, 009, 011, 012, 019
**Referências:** `specs/motor-de-previsao.md`, `specs/constituicao.md` (regras 7, 9, 11, 12 e 18)

## Objetivo

Num ambiente de simulação, todo negócio criado já nasce com histórico, saldo, compromissos e progresso nas trilhas. Cada negócio recebe um perfil e um cenário sorteados, para que contas novas mostrem situações diferentes: caixa saudável, apertado, queimando reservas, sazonal, em crescimento, em queda, com contas misturadas, dependente de um cliente, recém-aberto ou com aporte de investidor. Dessa forma, dá para testar e demonstrar todas as telas, a previsão e os alertas sem montar extratos à mão.

## Requisitos

- R1: A variável `SIMULATION_MODE` liga o modo de simulação. Vale `false` quando ausente ou vazia, e só `true` o liga.
- R2: Com o modo ligado, `POST /businesses` cria o negócio e, na mesma transação, saldo atual, consentimento de entrada assistida, transações, compromissos futuros e progresso nas trilhas. A resposta da API não muda.
- R3: Cada negócio sorteia uma semente aleatória. A semente define o perfil (compatível com o tipo do negócio), o cenário, a quantidade de meses de histórico, os clientes, os valores e as datas. Com a mesma semente e a mesma data, o resultado é idêntico.
- R4: O gerador é uma função pura em `packages/shared` (regra 12). As transações são classificadas por `classifyTransaction`, e a previsão e os alertas saem do worker, que encontra o negócio marcado em `forecastDirtyAt` (regras 11 e 18). Nenhum valor calculado é gravado à mão.
- R5: O `audit_log` recebe `business.simulate`, com o cenário e a semente em `target_id`, para reproduzir o caso. Os logs não citam valores nem descrições (regra 7).
- R6: As transações vão até ontem, como num extrato baixado hoje. Os compromissos vencem a partir de amanhã.
- R7: Os dados são fictícios: nomes de clientes e fornecedores saem de listas inventadas, sem dados reais.

## Fora do escopo

- Dados de parceiro e indicadores agregados.
- Simular contas criadas antes de ligar o modo.
- Mudar o `npm run seed` da 019, que continua determinístico.

## Critérios de aceite

- [x] C1: Com `SIMULATION_MODE=true`, quando crio um negócio, então ele tem saldo, transações classificadas, compromissos futuros, consentimento e um registro `business.simulate` no `audit_log`.
- [x] C2: Quando crio vários negócios, então os cenários e os valores variam entre eles.
- [x] C3: Sem `SIMULATION_MODE`, o negócio é criado vazio, como antes.
- [x] C4: Com a mesma semente e a mesma data, o gerador devolve os mesmos dados; cada cenário respeita a sua forma (por exemplo, o recém-aberto tem menos de três meses de histórico, e o de contas misturadas tem mais de 20% de saídas pessoais).

## Plano técnico

- `packages/shared/src/simulation.ts`: gerador `generateSimulatedBusiness({ seed, asOf, type, trackCount })` com perfis por tipo de negócio e cenários. Usa o gerador pseudoaleatório `mulberry32`, centavos inteiros e as funções de data da `shared`.
- `apps/api/src/modules/simulation.ts`: grava o resultado do gerador dentro da transação da criação do negócio.
- `apps/api/src/config.ts`, `.env.example` e `docker-compose.yml`: variável `SIMULATION_MODE`.

## Tarefas

- [x] T1: gerador, perfis e cenários, com testes unitários.
- [x] T2: gravação na criação do negócio e variável de ambiente.
- [x] T3: teste de integração da criação com e sem o modo.

## Notas

O teste de integração (`apps/api/test/integration/simulation.test.ts`) cobre C1 e C3 e passou contra o MySQL 8.0. C2 e C4 estão cobertos pelos testes unitários do gerador, que passam cada cenário pela previsão e pelos alertas reais. Numa conferência manual, oito negócios simulados passaram pelo `recalculateBusiness` do worker: o recém-aberto ficou com histórico insuficiente, e os demais ganharam previsão; o de caixa negativo iminente gerou os alertas de saldo negativo.

Perfis: MEI (estúdio de design, confeitaria, salão de beleza, fotografia), ME (loja de roupas, oficina mecânica, restaurante), startup (SaaS, aplicativo de entregas) e prestador de serviços (reformas elétricas, consultoria, suporte de TI).
