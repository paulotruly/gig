# 023: atualização do Nginx

**Situação:** `em andamento`
**Depende de:** 017
**Referências:** [017](017-provisionamento.md), `specs/arquitetura.md` (provisionamento), [CVE-2026-123007](https://nvd.nist.gov/vuln/detail/CVE-2026-123007), [CVE-2026-123633](https://nvd.nist.gov/vuln/detail/CVE-2026-123633)

## Objetivo

Tirar o proxy da faixa afetada por duas falhas críticas do módulo HTTP/2 do Nginx, publicadas em 18/11/2026. A imagem `nginx:1.27` está sem suporte da F5 e dentro das versões afetadas. Hoje o risco é baixo, porque nenhuma configuração liga o HTTP/2, mas basta ligá-lo no futuro para a falha valer.

## Requisitos

- R1: o serviço `nginx` do `docker-compose.yml` usa uma versão com as correções (1.30.7 ou posterior na linha estável), fixada até o patch.
- R2: as duas configurações, `infra/nginx/gig.conf` e `infra/nginx/gig-proxy.conf.template`, continuam válidas na nova versão, sem alteração.

## Fora do escopo

- Ligar o HTTP/2 no Nginx.
- Atualizar automaticamente a imagem a cada nova versão.

## Critérios de aceite

- [x] C1: dado o Compose da `dev`, quando o Nginx sobe, então `nginx -v` mostra 1.30.7 ou posterior.
- [x] C2: quando rodo `nginx -t` com cada configuração na nova imagem, então as duas passam.
- [ ] C3: quando a mudança chega ao servidor, então `/api/health` e a página inicial respondem pelo caminho público.

## Plano técnico

Trocar `nginx:1.27` por `nginx:1.30.7` no `docker-compose.yml`. O `compose.servidor.yml` só sobrepõe portas, ambiente e volumes, então herda a imagem.

## Tarefas

- [x] T1: trocar a imagem no `docker-compose.yml`.
- [x] T2: validar as duas configurações com `nginx -t` na nova imagem.
- [ ] T3: conferir o servidor depois da implantação.

## Notas

As duas CVEs exigem HTTP/2 ativo (`listen ... http2` ou `http2 on;`). Em 22/11/2026, nenhuma configuração do repositório o ligava, e no servidor o TLS termina antes do Nginx (Cloudflare Tunnel e `tailscale serve`), que recebe HTTP/1.1 em `127.0.0.1:8081`.

Em 22/11/2026, a imagem `nginx:1.30.7` mostrou `nginx/1.30.7` em `nginx -V`, e `nginx -t` passou com o `gig.conf` (com certificado descartável) e com o template do servidor, processado pelo entrypoint oficial com `NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1`. Falta conferir o servidor depois da implantação (C3).
