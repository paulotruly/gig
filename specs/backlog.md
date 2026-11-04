# Backlog do back-end

Ordem baseada em [09] §11, restrita ao back-end e com os itens que faltavam nos documentos.

**Situações:** `a fazer`, `em andamento` e `concluída`.

| # | Funcionalidade | Depende de | Pendências | Situação |
|---|---|---|---|---|
| 001 | Fundação da API: projeto, lint, testes, CI, healthcheck e logs | | | `concluída` |
| 002 | Modelo de dados e migrações iniciais | 001 | | `concluída` |
| 003 | Cadastro, autenticação e sessão | 002 | | `concluída` |
| 004 | Negócios e isolamento por `business_id` | 003 | | `concluída` |
| 005 | Consentimentos e auditoria | 004 | P-15 | `concluída` |
| 006 | Entrada assistida (extrato em arquivo) | 005 | | `concluída` |
| 007 | Classificação PF-PJ e correção pelo usuário | 006 | | `concluída` |
| 008 | Compromissos fixos e recebíveis a prazo | 004 | | `concluída` |
| 009 | Motor de previsão: três cenários, runway e retirada segura | Funções puras: 001. Integração: 007 e 008 | | `concluída` |
| 010 | Worker: recálculo idempotente | 009 | | `concluída` |
| 011 | Alertas e orientação explicável | 010 | | `concluída` |
| 012 | Trilhas e progresso | 004 | P-16 | `concluída` |
| 013 | Canal WhatsApp: webhook e envio | 011 | P-12 | `concluída` |
| 014 | Indicadores agregados do parceiro | 010 | P-11 | `concluída` |
| 015 | Open Finance PJ (interface; o acesso real depende da P-08) | 005 | P-08 | `em andamento` |
| 016 | Eventos de uso, backup e restauração | 002 | P-15 | `concluída` |
| 017 | Provisionamento: Dockerfiles, Compose e Nginx | 010 | P-12 | `em andamento` |

## Recomendação de ordem

Depois da 001, comece as funções puras da 009 em paralelo com as 002 a 007. Elas são o coração do produto, são fáceis de testar e não dependem do banco.

As funcionalidades 012 e 014 não bloqueiam o fluxo principal, que vai do consentimento à primeira previsão. A 015 fica por último porque a entrada assistida permite testar o valor da previsão antes da integração.
