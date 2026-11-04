# 015: Open Finance PJ (interface)

**Situação:** `em andamento`
**Depende de:** 005
**Referências:** regras 1, 5 e 8, P-08

## Objetivo

Preparar a sincronização somente leitura, sem depender ainda de um provedor real.

## Requisitos

- R1: A interface do provedor só tem operações de leitura.
- R2: Tokens são cifrados com AES-256-GCM, com a chave fora do banco.
- R3: O worker confere o consentimento antes de cada sincronização.
- R4: Sem provedor configurado, a sincronização não faz nada.

## Critérios de aceite

- [x] C1: Quando o consentimento foi revogado, então o provedor não é chamado.
- [x] C2: Quando sincronizo duas vezes, então as transações não duplicam.
- [x] C3: Um token adulterado não é decifrado.

## Tarefas

- [x] T1: implementar a interface, a cifragem e a sincronização.
- [ ] T3: implementar um provedor real e o endpoint de conexão de conta, que dependem da P-08.
- [x] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
