# Backlog do back-end

Ordem baseada em [09] §11, restrita ao back-end e com os itens que faltavam nos documentos.

**Situações:** `a fazer`, `em andamento` e `concluída`.

| # | Funcionalidade | Depende de | Pendências | Situação |
|---|---|---|---|---|
| 001 | Fundação da API: projeto, lint, testes, CI, healthcheck e logs | | | `concluída` |
| 002 | Modelo de dados e migrações iniciais | 001 | | `a fazer` |
| 003 | Cadastro, autenticação e sessão | 002 | | `a fazer` |
| 004 | Negócios e isolamento por `business_id` | 003 | | `a fazer` |
| 005 | Consentimentos e auditoria | 004 | P-15 | `a fazer` |
| 006 | Entrada assistida (extrato em arquivo) | 005 | | `a fazer` |
| 007 | Classificação PF-PJ e correção pelo usuário | 006 | | `a fazer` |
| 008 | Compromissos fixos e recebíveis a prazo | 004 | | `a fazer` |
| 009 | Motor de previsão: três cenários, runway e retirada segura | Funções puras: 001. Integração: 007 e 008 | | `a fazer` |
| 010 | Worker: recálculo idempotente | 009 | | `a fazer` |
| 011 | Alertas e orientação explicável | 010 | | `a fazer` |
| 012 | Trilhas e progresso | 004 | P-16 | `a fazer` |
| 013 | Canal WhatsApp: webhook e envio | 011 | P-12 | `a fazer` |
| 014 | Indicadores agregados do parceiro | 010 | P-11 | `a fazer` |
| 015 | Open Finance PJ (interface; o acesso real depende da P-08) | 005 | P-08 | `a fazer` |
| 016 | Eventos de uso, backup e restauração | 002 | P-15 | `a fazer` |
| 017 | Provisionamento: Dockerfiles, Compose e Nginx | 010 | P-12 | `a fazer` |

## Recomendação de ordem

Depois da 001, comece as funções puras da 009 em paralelo com as 002 a 007. Elas são o coração do produto, são fáceis de testar e não dependem do banco.

As funcionalidades 012 e 014 não bloqueiam o fluxo principal, que vai do consentimento à primeira previsão. A 015 fica por último porque a entrada assistida permite testar o valor da previsão antes da integração.
