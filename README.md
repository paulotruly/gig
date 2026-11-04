# GiG (Greed is Great)

Plataforma de gestão financeira e educação empreendedora para MEIs, startups e pequenos negócios. As regras do produto ficam em `specs/`.

## Estrutura

| Pasta | Conteúdo |
|---|---|
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

Ajuste o `.env` e aplique as migrações com um usuário que possa criar tabelas e gatilhos:

```sh
DATABASE_URL="mysql://usuario:senha@127.0.0.1:3306/gig" npm run migrate
npm run dev
npm run dev:worker
```

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

O `docker-compose.yml` sobe Nginx, API, worker, MySQL e backup. Defina as variáveis usadas nele e coloque os certificados em `infra/nginx/certs`.

```sh
docker compose up -d
```

Para restaurar um backup em um banco vazio, use `infra/backup/restore.sh`.
