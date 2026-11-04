# 006: entrada assistida

**Situação:** `concluída`
**Depende de:** 005
**Referências:** regras 5, 6 e 17, decisão 0003

## Objetivo

Permitir enviar extrato em CSV ou OFX para testar a previsão sem depender do Open Finance.

## Requisitos

- R1: O envio exige consentimento ativo da finalidade `assisted_ingestion`.
- R2: O corpo é o texto do arquivo, com limite de 5 MB e até 50 mil linhas.
- R3: Reenviar o mesmo extrato não duplica transações.
- R4: O arquivo não é guardado, só o hash e as contagens.
- R5: Datas e valores são interpretados sem ponto flutuante.

## Critérios de aceite

- [x] C1: Sem consentimento ativo, quando envio um extrato, então recebo `403`.
- [x] C2: Quando reenvio o mesmo arquivo, então nenhuma transação é duplicada.
- [x] C3: Quando envio um arquivo inválido, então recebo `400` e nada é gravado.
- [x] C4: Quando um contador autorizado envia um extrato, então ele é importado.

## Tarefas

- [x] T1: implementar os requisitos.
- [x] T2: cobrir os critérios de aceite com testes.

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.
