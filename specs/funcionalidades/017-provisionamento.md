# 017: provisionamento

**Situação:** `em andamento`
**Depende de:** 010
**Referências:** [09] §07 e §10.2, `specs/arquitetura.md`, P-12

## Objetivo

Permitir subir o back-end no servidor com um só comando.

## Requisitos

- R1: Há imagens de `api` e `worker`, que rodam sem privilégio de root.
- R2: O Compose sobe `nginx`, `api`, `worker`, `mysql` e `backup`, e só o Nginx publica portas.
- R3: O serviço `web` entra quando `apps/web` existir.
- R4: O CI valida o Compose e constrói as imagens.

## Critérios de aceite

- [x] C1: Quando o CI roda, então `docker compose config` e o build das imagens passam.
- [x] C2: Quando subo em um servidor, então `/health` responde pelo Nginx.

## Tarefas

- [x] T1: escrever Dockerfile, Compose, Nginx e o job de imagens no CI.
- [x] T2: validar no CI, o que exige um push.
- [ ] T3: subir em um servidor Linux, com certificados e conferência de `SIGTERM`.
- [x] T4: implantar a `main` sozinha no servidor `ignam`, com domínio pelo Cloudflare Tunnel ([decisão 0004](../decisoes/0004-implantacao-puxada-pelo-servidor.md)).

## Notas

Decisões de escopo em `specs/decisoes/0003-padroes-para-as-lacunas-do-mvp.md`.

Em 20/11/2026, o backup do servidor falhava desde a criação: o `01-usuarios.sh` parava no `GRANT` em `partner_metrics`, tabela que só existe depois das migrações, e o `gig_backup` não era criado. A permissão passou para `packages/db/scripts/migrar.sh`, que o serviço `migrate` roda depois das migrações. Um backup foi restaurado em banco descartável e conferido contra a produção (tabelas, triggers e contagens).

Cada backup também vai para o bucket `gig-backups` do Cloudflare R2, que apaga os objetos depois de 30 dias. O `enviar.sh` assina as requisições com openssl, porque o `--aws-sigv4` do curl 7.76 da imagem erra o hash de arquivo binário. O arquivo baixado do bucket teve o mesmo SHA-256 do local.
