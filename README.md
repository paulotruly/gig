# GiG (Greed is Great)

Plataforma de gestão financeira e educação empreendedora para MEIs, startups e pequenos negócios. As regras do produto ficam em `specs/`.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `apps/web` | Front-end em Next.js |
| `apps/api` | API em Express |
| `apps/worker` | Recálculo de previsões, envio de alertas, indicadores e sincronização |
| `packages/shared` | Contratos e regras puras de classificação, previsão e alertas |
| `packages/db` | Esquema, migrações e cliente Prisma |
| `infra` | Nginx, usuários do MySQL e backup |

## Como rodar

É preciso ter Node 22 e MySQL 8.

```sh
npm ci
cp .env.example .env
```

Ajuste o `.env` e aplique as migrações com um usuário que possa criar tabelas e gatilhos (por exemplo, o `root` do MySQL local):

```sh
DATABASE_URL="mysql://usuario:senha@127.0.0.1:3306/gig" npm run migrate
```

No PowerShell, defina a variável antes do comando: `$env:DATABASE_URL="mysql://..."; npm run migrate`.

### Dados de demonstração

Para ver o app com um negócio completo, rode a seed depois das migrações. Ela lê o `DATABASE_URL` do `.env` e cria um MEI fictício com seis meses de transações, compromissos, previsão e alertas:

```sh
npm run seed
```

Entre com `demo@gig.local` e a senha `demonstracao-gig`. A seed não roda com `NODE_ENV=production` e não duplica nada se o usuário já existir. Para recomeçar, recrie o banco local e aplique as migrações de novo.

### Back-end e front-end

Cada comando roda em um terminal:

```sh
npm run dev          # API em http://localhost:3000
npm run dev:worker   # recálculo de previsões e alertas
npm run dev:web      # front-end em http://localhost:3001
```

Abra `http://localhost:3001`. O front-end chama `/api` na mesma origem, e o Next encaminha para a API em `http://localhost:3000`; para outro endereço, defina `API_INTERNAL_URL` em `apps/web/.env.local`. Detalhes em `apps/web/README.md`.

O WhatsApp usa um envio simulado, e o Open Finance ainda não tem provedor configurado.

## Testes

```sh
npm test
DATABASE_URL_TEST="mysql://usuario:senha@127.0.0.1:3306/gig_test" npm run test:integration
```

Os testes de integração apagam e recriam o banco de `DATABASE_URL_TEST`, cujo nome precisa terminar em `_test`.

## Parceiros

Parceiros são criados por comando, depois de o usuário responsável se cadastrar. O comando mostra o código de adesão, que o negócio informa ao ser criado.

```sh
npm run build
DATABASE_URL="..." npm run partner:create --workspace @gig/api -- "Nome" ACCELERATOR pessoa@exemplo.com
```

## Implantação

O `docker-compose.yml` sobe Nginx, front-end, API, worker, MySQL e backup. Defina as variáveis usadas nele e coloque os certificados em `infra/nginx/certs`.

```sh
docker compose up -d
```

O serviço `backup` gera um dump cifrado por dia em `backups/`, mantém 7 dias no disco (`BACKUP_LOCAL_DAYS`) e fica `unhealthy` se o último backup tiver mais de 26 horas. Com `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY` no `.env`, cada backup também vai para um bucket do Cloudflare R2, cuja regra de ciclo de vida define a retenção. Para restaurar em um banco vazio, use `infra/backup/restore.sh`. Guarde o `BACKUP_PASSPHRASE` e o `TOKEN_ENCRYPTION_KEY` fora do servidor: sem eles, o backup não serve.

### Servidor atual

No servidor `ignam`, o GiG fica em `/opt/gig` e se atualiza sozinho: o `gig-deploy.timer` confere a `main` a cada 2 minutos e implanta o commit novo quando o CI dele passou ([decisão 0004](specs/decisoes/0004-implantacao-puxada-pelo-servidor.md)). O Nginx publica só em `127.0.0.1:8081`. O público acessa `https://gigreat.online` pelo Cloudflare Tunnel (`cloudflared-gig.service`), e a equipe também pode usar a porta 8443 da tailnet, pelo `tailscale serve`.

```sh
sudo systemctl start gig-deploy        # confere a main agora
sudo journalctl -u gig-deploy -n 50    # últimas implantações
sudo gig-deploy --forcar               # reimplanta a main sem esperar o CI
```

Para preparar outro servidor, clone o repositório em `/opt/gig`, crie o `.env` com as variáveis do Compose e instale `infra/deploy/deploy.sh` como `/usr/local/sbin/gig-deploy`, junto com `gig-deploy.service` e `gig-deploy.timer` em `/etc/systemd/system`. Para o domínio, crie um túnel na Cloudflare apontando para `http://127.0.0.1:8081`, grave o token do conector em `/etc/gig/cloudflared-token` (modo 600) e instale `infra/deploy/cloudflared-gig.service`.
