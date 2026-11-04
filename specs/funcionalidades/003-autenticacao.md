# 003: cadastro, autenticação e sessão

**Situação:** `a fazer`
**Depende de:** 002
**Referências:** `specs/contrato-api.md`, `specs/arquitetura.md`, decisão 0003

## Objetivo

Permitir que a pessoa crie conta, entre, renove e encerre a sessão com segurança.

## Requisitos

- R1: Senhas guardam só o hash argon2.
- R2: O cookie de sessão é `httpOnly`, `SameSite=Lax` e `Secure` em produção, e o banco guarda só o hash do token.
- R3: A renovação troca o token e respeita um limite absoluto de 30 dias.
- R4: O login responde igual para e-mail inexistente e senha errada.
- R5: Há limite de requisições por IP e por usuário e CORS restrito ao front-end.

## Critérios de aceite

- [ ] C1: Quando me cadastro e entro, então recebo um cookie `httpOnly` e o banco não guarda o token puro.
- [ ] C2: Quando erro a senha ou uso um e-mail inexistente, então recebo a mesma resposta `401`.
- [ ] C3: Quando renovo a sessão, então o token anterior deixa de valer.
- [ ] C4: Quando encerro a sessão, então o token deixa de valer.
- [ ] C5: Quando excedo o limite de tentativas de login, então recebo `429`.

## Tarefas

- [ ] T1: implementar os requisitos.
- [ ] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
