# Modelo de dados

Fonte: [09] §05. Status geral: `proposto`.

## Convenções

- Tabelas InnoDB, com chaves estrangeiras.
- Valores monetários em `DECIMAL`, nunca `FLOAT`.
- `business_id` em toda tabela de negócio, filtrado em toda consulta.
- Migrações versionadas no repositório.
- API com usuário de banco de privilégio mínimo; painel do parceiro com usuário somente leitura de `partner_metrics`.

## Tabelas

| Tabela | Conteúdo | Observação |
|---|---|---|
| `users` | Dono do negócio: nome, e-mail, hash da senha | Acesso do parceiro não modelado (P-04) |
| `businesses` | Tipo (MEI, ME, startup, prestador), dono, parceiro | Liga o usuário ao patrocinador, quando houver |
| `partners` | Organização patrocinadora: nome e tipo | Tipos em conflito (P-11) |
| `consents` | Finalidade, escopo, status, datas de concessão, expiração e revogação | Só de inserção: cada mudança é uma nova linha |
| `accounts` | Contas conectadas: instituição, tipo, referência externa | Tokens de acesso cifrados na aplicação |
| `transactions` | Data, valor, descrição, categoria, origem (pessoal ou empresa), flag de correção | Índice por `business_id` e data; etiquetas em aberto (P-05) |
| `forecasts` | Horizonte e um registro por cenário | Guarda a versão das regras |
| `alerts` | Regra disparada, dados usados, canal, status de envio | Base da explicabilidade |
| `tracks` | Trilhas de educação | |
| `track_progress` | Progresso por negócio | Alimenta a métrica de aprendizado |
| `partner_metrics` | Indicadores agregados por parceiro e período | Única tabela que o parceiro consulta; limite mínimo por indicador (P-07) |
| `audit_log` | Quem acessou ou alterou dados sensíveis, e quando | Apoia LGPD e investigação de incidentes |

## Migrações iniciais sugeridas

`users`, `businesses`, `consents`, `transactions` e `forecasts`. `partners` precisa existir antes, ou a referência em `businesses` entra em migração posterior.

## Faltam no modelo

- Compromissos fixos e recebíveis a prazo (P-02).
- Eventos de uso, sessão ou renovação e importações de extrato (P-09).
