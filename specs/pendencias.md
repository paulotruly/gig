# Pendências

Lacunas e conflitos encontrados nos documentos. Ao resolver um item, remova-o daqui e registre a decisão em `decisoes/` quando for relevante.

## Lacunas

| ID | Pendência | Afeta |
|---|---|---|
| P-15 | O [09] não define a exclusão de dados a pedido do titular (LGPD), e `consents` e `audit_log` são só de inserção | 005, 016 |
| P-16 | Falta conteúdo real para as trilhas: as quatro atuais só têm título e resumo provisórios | 012 |
| P-17 | As telas do `apps/web` mostram dados que a API não fornece: totais de receitas e despesas do mês, metas com percentual e fluxo de caixa por período (o progresso das trilhas foi resolvido na 021). Falta definir as regras no back-end antes de exibi-los | 018 |
| P-08 | Não está definido como acessar o Open Finance (participação regulada ou intermediário), e o limite jurídico da automação continua em aberto desde [01] | 015 |


## Decisões a tomar

| ID | Decisão | Afeta |
|---|---|---|
| P-11 | Prioridade comercial entre os tipos de parceiro. Todos os tipos citados foram aceitos no sistema, mas [07] diverge de [03], [04] e [09] sobre quem paga | 014 |
| P-12 | Servidor local só no piloto ou também na operação; canal inicial (WhatsApp, app web ou ambos) | 013 |
| P-18 | A retirada segura é o menor saldo diário do cenário conservador, sem reserva mínima. Quando as entradas previstas cobrem os vencimentos, ela sugere retirar o caixa inteiro de hoje (na seed, R$ 4.220 de R$ 4.220). Decidir se deve haver uma reserva, por exemplo um percentual do saldo ou um mês de despesas fixas | 009, 018 |
