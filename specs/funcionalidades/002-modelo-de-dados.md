# 002: modelo de dados e migrações

**Situação:** `a fazer`
**Depende de:** 001
**Referências:** `specs/modelo-de-dados.md`, regras 2, 3, 5, 9 e 20

## Objetivo

Criar todas as tabelas do MVP em uma migração versionada, com dinheiro exato e histórico imutável onde a constituição exige.

## Requisitos

- R1: O esquema fica em `packages/db`, com Prisma e MySQL.
- R2: Valores monetários usam `DECIMAL(14,2)`.
- R3: Toda tabela de negócio tem `business_id`.
- R4: Gatilhos impedem `UPDATE` e `DELETE` em `consents` e `audit_log`.
- R5: `GET /health` passa a verificar o banco e responde `503` se ele estiver fora do ar.

## Critérios de aceite

- [ ] C1: Dado um banco vazio, quando aplico as migrações, então todas as tabelas existem.
- [ ] C2: Quando tento alterar ou apagar uma linha de `consents` ou `audit_log`, então o banco recusa.
- [ ] C3: Quando o banco está fora do ar, então `GET /health` responde `503`.

## Tarefas

- [ ] T1: implementar os requisitos.
- [ ] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
