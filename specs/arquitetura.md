# Arquitetura

Fonte: [09] e [decisão 0002](decisoes/0002-stack-do-back-end.md).

**Status usados:** `definido`, `proposto`, `a validar` e `em conflito`.

## Stack

| Camada | Tecnologia | Status |
|---|---|---|
| Runtime do back-end | Node.js | `definido` |
| Framework da API | Express | `definido` |
| Linguagem | TypeScript | `definido` |
| Banco de dados | MySQL (InnoDB) | `definido` |
| Acesso a dados e migrações | Prisma | `definido` |
| Tarefas em segundo plano | Worker em Node.js com node-cron | `proposto` |
| Validação de entrada | zod | `definido` |
| Testes | Jest e Supertest | `definido` |
| Testes ponta a ponta | Playwright | `proposto` |
| Qualidade | ESLint, Prettier e CI | `definido` |
| Front-end (outra frente de trabalho) | React e Next.js | `definido` |
| Hospedagem | Servidor local | `definido` |
| Provisionamento | Linux, Docker Compose e Nginx | `proposto` |

## Camadas lógicas

Status: `proposto`.

1. **Entrada:** Open Finance PJ ou entrada assistida.
2. **Núcleo:** classificação, previsão em cenários e orientação.
3. **Saída:** empreendedor (app web e WhatsApp) e parceiro (somente agregados).

A conformidade (consentimento, revogação e registro de finalidade) atravessa todas as etapas. A separação permite que uma mudança regulatória ou de canal afete uma camada sem refazer as outras.

- **Entrada assistida junto de Open Finance:** testa o valor da previsão sem depender da integração nem da base PJ, ainda pequena.
- **Agregação em camada própria:** parceiros nunca acessam dados individuais.
- **Canal desacoplado:** o núcleo expõe a orientação como mensagem curta e como dado estruturado.

## Módulos da API

Status: `proposto`.

| Módulo | Responsabilidade |
|---|---|
| `auth` | Sessão e autenticação |
| `consents` | Concessão e revogação de consentimento |
| `ingestion` | Open Finance e entrada assistida |
| `classification` | Etiquetas PF-PJ e correções |
| `forecasting` | Cenários, runway e retirada segura |
| `guidance` | Regras de decisão e mensagens |
| `tracks` | Trilhas e progresso |
| `partner-metrics` | Indicadores agregados |
| `notifications` | Envio por canal |

## Serviços

Status: `proposto`.

| Serviço | Tecnologia | Exposição | Persistência |
|---|---|---|---|
| `nginx` | Nginx | Portas 80 e 443 | Certificados TLS |
| `web` | Next.js | Só via Nginx | Nenhuma |
| `api` | Node.js | Só via Nginx (`/api` e `/webhooks`) | Nenhuma |
| `worker` | Node.js | Nenhuma | Nenhuma |
| `mysql` | MySQL | Sem porta publicada | Volume dedicado |
| `backup` | Script agendado | Nenhuma | Arquivos cifrados fora do volume do banco |

O worker é o único serviço que chama as APIs externas de dados. A API atende o front-end e os webhooks do WhatsApp. O Next.js chama a API por HTTP na rede interna.

## Estrutura do repositório

Status: `definido`. Monorepo com npm workspaces, com `apps/web`, `apps/api`, `apps/worker` e `packages/shared`. O `apps/web` fica neste repositório, mas é de outra frente de trabalho. Cada pasta é criada quando a primeira funcionalidade precisar dela.

## Operação

Status: `proposto`.

- **Ambientes:** desenvolvimento na máquina de cada pessoa; homologação e piloto no servidor, com bancos e segredos separados.
- **CI:** lint e formato → unidade → integração com MySQL em container → build das imagens → ponta a ponta em homologação → `docker compose up -d`.
- **Backup:** dump diário cifrado, com cópia fora do servidor e restauração testada antes do piloto.
- **Observabilidade:** logs estruturados por serviço, sem dados pessoais, e healthchecks nos containers.
- **Rede:** firewall liberando só 80 e 443, SSH por chave e TLS no Nginx e na conexão com o MySQL.

## Segurança

Status: `proposto`.

- **Sessão:** cookie `httpOnly`, `Secure` e `SameSite`, com expiração e renovação. [09] §6.3 também admite JWT de curta duração.
- **Senhas:** hash com argon2 ou bcrypt.
- **Criptografia:** tokens de acesso com, por exemplo, AES-256-GCM, e disco do servidor cifrado.
- **Abuso:** limite de requisições por IP e por usuário, CORS restrito ao front-end e cabeçalhos de segurança, como helmet.
- **Banco:** usuário de privilégio mínimo para a API e usuário somente leitura de `partner_metrics` para o painel do parceiro.
- **Dependências:** `npm audit` no CI e atualização periódica das imagens.

## Riscos do servidor local

Status: `a validar`.

| Risco | Mitigação proposta |
|---|---|
| Queda de energia ou internet | No-break, reenvio de mensagens pendentes e plano de migração para nuvem |
| Webhook precisa de endereço público | Domínio, DNS e TLS, com IP fixo ou túnel |
| Dados financeiros em disco local | Disco cifrado, acesso restrito e backup cifrado |
| Ponto único de falha | Provisionamento documentado para recriar o ambiente |
