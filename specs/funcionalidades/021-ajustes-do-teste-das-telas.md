# 021: ajustes do teste das telas

**Situação:** `concluída`
**Depende de:** 018
**Referências:** [018](018-integracao-do-front-end.md) (teste de ponta a ponta de 20/11/2026), P-17, `specs/contrato-api.md`

## Objetivo

Corrigir o que o teste de ponta a ponta da 018 encontrou nas telas: navegação que se perde ao recarregar, lupa sem busca, modais que não fecham pelo teclado, progresso de trilha que some e textos que prometem mais do que o produto faz.

## Requisitos

- R1: cada tela tem um endereço próprio no fragmento da URL: `#inicio`, `#cenarios`, `#transacoes`, `#compromissos`, `#trilhas` e `#whatsapp`. Recarregar mantém a tela, e o "voltar" e o "avançar" do navegador trocam de tela. Fragmento ausente ou desconhecido leva ao Início. A query string (por exemplo, `?erro=google`) é preservada.
- R2: `GET /businesses/:businessId/transactions` aceita `q` (1 a 100 caracteres, sem espaços nas pontas), que filtra as transações cuja descrição contém o texto, sem diferenciar maiúsculas e minúsculas. `total` e a paginação consideram o filtro.
- R3: a tela de transações tem um campo de busca que usa `q`, com espera de 300 ms depois da digitação e botão para limpar. A lupa do cabeçalho do celular abre as transações com o foco nesse campo.
- R4: a barra inferior do celular destaca a aba da tela atual e nenhuma aba na tela do WhatsApp.
- R5: os modais de notificações e de importação de extrato fecham com Esc e com clique no fundo escurecido, e têm `role="dialog"`, `aria-modal="true"` e título ligado por `aria-labelledby`.
- R6: `GET /tracks?businessId=N` devolve, em cada trilha, o `percent` do negócio (0 quando não há progresso), depois de conferir que o usuário participa do negócio. Sem `businessId`, a resposta segue como antes. A tela de trilhas usa o negócio atual e mostra "Concluída" depois de recarregar.
- R7: a tela de cenários diz que o GiG recalcula a previsão alguns minutos depois de cada dado novo, e não "sempre que entram dados novos".
- R8: a tela do WhatsApp não cita estatística sem fonte nem trata o Open Finance como disponível.

## Fora do escopo

- Reserva mínima na retirada segura (P-18).
- Os demais itens da P-17 (totais do mês, metas e fluxo de caixa por período).
- Busca por valor ou por data.

## Critérios de aceite

- [x] C1: dado que estou em `#cenarios`, quando recarrego, então continuo nos cenários; quando uso o "voltar", então volto à tela anterior.
- [x] C2: quando busco `restaurante`, então vejo só as transações com essa palavra na descrição, e o total da lista acompanha o filtro.
- [x] C3: no celular, quando toco na lupa, então abro as transações com o campo de busca em foco e a aba Extrato destacada.
- [x] C4: com um modal aberto, quando aperto Esc ou clico fora dele, então ele fecha.
- [x] C5: quando concluo uma trilha e recarrego a página, então ela continua concluída.
- [x] C6: `GET /tracks?businessId=N` de um negócio de outra pessoa responde 403 ou 404, como as demais rotas de negócio.

## Plano técnico

- API: `q` em `listTransactionsQuery` (`packages/shared`) e `contains` no `where` de `apps/api/src/modules/transactions.ts`; `businessId` opcional em `GET /tracks` (`apps/api/src/modules/tracks.ts`), com `requireBusinessRole`. Testes de integração para os dois.
- Web: hash da URL em `apps/web/src/app/page.tsx`; campo de busca em `TransactionsScreen`; destaque em `BottomNav`; Esc, clique no fundo e atributos de diálogo em `NotificationsModal` e `ImportStatementModal`; progresso em `TracksScreen`; textos em `ForecastScreen` e `WhatsAppScreen`.
- `specs/contrato-api.md` com os parâmetros novos.

## Tarefas

- [x] T1: busca `q` nas transações, com testes.
- [x] T2: progresso por negócio em `GET /tracks`, com testes.
- [x] T3: endereço por tela no fragmento da URL.
- [x] T4: campo de busca, lupa e destaque da barra inferior.
- [x] T5: modais com Esc, clique no fundo e atributos de diálogo.
- [x] T6: trilhas com o progresso salvo e textos de cenários e WhatsApp.
- [x] T7: conferir no navegador numa cópia descartável do servidor.

## Notas

A busca usa um sinal numérico para pôr o foco no campo quando a lupa é tocada, e as trilhas de outro negócio seguem o padrão das demais rotas de negócio (404 para quem não participa). Em 20/11/2026, a T7 foi feita numa cópia descartável do servidor, montada a partir da `task_021` com a seed: o login abriu direto em `#cenarios`; recarregar manteve a tela e o "voltar" trocou de tela; a busca por `restaurante` trouxe as 6 transações; os modais fecharam com Esc e com clique fora; a trilha concluída continuou concluída depois de recarregar; no celular, a lupa abriu as transações com o foco na busca e a aba Extrato destacada, e o WhatsApp não destacou nenhuma aba. O C6 é coberto pelos testes de integração, que passaram no CI.
