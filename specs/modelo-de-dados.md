# Modelo de dados

Fonte: [09] §05 e [decisão 0003](decisoes/0003-padroes-para-as-lacunas-do-mvp.md). Status geral: `definido` para o MVP. O esquema executável está em `packages/db/prisma/schema.prisma`.

## Convenções

- Tabelas InnoDB, com chaves estrangeiras.
- Valores monetários em `DECIMAL`, nunca `FLOAT`.
- `business_id` em toda tabela de negócio, filtrado em toda consulta.
- Migrações versionadas no repositório.
- API com usuário de banco de privilégio mínimo; painel do parceiro com usuário somente leitura de `partner_metrics`.

## Tabelas

| Tabela | Conteúdo | Observação |
|---|---|---|
| `users` | Nome, e-mail, hash da senha, telefone opcional | Dono, contador e parceiro; o papel vem dos vínculos |
| `sessions` | Hash do token, expiração, revogação | O token puro só existe no cookie |
| `business_members` | Vínculo entre usuário e negócio, com papel de dono ou contador | |
| `partner_members` | Vínculo entre usuário e parceiro | |
| `businesses` | Nome, tipo (MEI, ME, startup, prestador), parceiro, saldo informado e data dele | O dono vem de `business_members` |
| `partners` | Organização patrocinadora: nome, tipo e código de adesão | Sete tipos ([decisão 0003](decisoes/0003-padroes-para-as-lacunas-do-mvp.md)) |
| `consents` | Finalidade, escopo, status, datas de concessão, expiração e revogação | Só de inserção: cada mudança é uma nova linha |
| `accounts` | Contas conectadas: instituição, tipo, referência externa | Tokens de acesso cifrados na aplicação |
| `transactions` | Data, valor com sinal, descrição, categoria, etiqueta, fonte da etiqueta, flag de correção, chave de deduplicação | Índice por `business_id` e data; a origem é derivada da etiqueta |
| `classification_rules` | Regras aprendidas com as correções, por negócio | |
| `statement_imports` | Formato, hash e contagens de cada importação | O arquivo não é guardado |
| `commitments` | Despesas fixas e recebíveis, com vencimento e recorrência | |
| `forecasts` | Data-base, horizonte, retirada segura e explicação | Guarda a versão das regras e o hash da entrada |
| `forecast_scenarios` | Um registro por cenário | |
| `alerts` | Regra disparada, dados usados, canal, status de envio | Base da explicabilidade |
| `tracks` | Trilhas de educação | |
| `track_progress` | Progresso por negócio | Alimenta a métrica de aprendizado |
| `partner_metrics` | Indicadores agregados por parceiro e período | Única tabela que o parceiro consulta; mínimo de 5 negócios por indicador |
| `audit_log` | Quem acessou ou alterou dados sensíveis, e quando | Só de inserção |
| `usage_events` | Eventos de uso | Sem dados financeiros |
| `whatsapp_messages` | Identificador externo das mensagens recebidas | Garante idempotência; o texto não é guardado |

## Migrações iniciais sugeridas

`users`, `businesses`, `consents`, `transactions` e `forecasts`. `partners` precisa existir antes, ou a referência em `businesses` entra em migração posterior.
