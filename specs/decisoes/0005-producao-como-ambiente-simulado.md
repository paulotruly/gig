# 0005: produção como ambiente simulado

**Data:** 22/11/2026
**Situação:** aceita

## Contexto

A [025](../funcionalidades/025-ambiente-simulado.md) criou o `SIMULATION_MODE`, que preenche cada negócio novo com dados fictícios sorteados. Não há servidor de testes separado: o único servidor público é o de `https://gigreat.online`, implantado a partir da `main` ([decisão 0004](0004-implantacao-puxada-pelo-servidor.md)).

## Decisão

O `SIMULATION_MODE=true` fica ligado no `.env` do servidor de produção. Todo negócio cadastrado em `gigreat.online` nasce com perfil, cenário, transações, compromissos e progresso nas trilhas fictícios.

## Consequências

- Qualquer pessoa que crie uma conta vê o produto completo, com previsão e alertas, sem enviar extrato.
- Os dados de produção deixam de representar negócios reais. Indicadores de parceiro e métricas de uso calculados sobre eles também passam a ser simulados.
- Um extrato real enviado depois se mistura às transações fictícias do mesmo negócio.
- Para voltar a receber dados reais, é preciso tirar a variável do `.env` e recriar a API. Os negócios já simulados continuam como estão, porque `consents` e `audit_log` são só de inserção.
