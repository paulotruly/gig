# 0004: implantação puxada pelo servidor

**Data:** 20/11/2026
**Situação:** aceita

## Contexto

O GiG passa a rodar no servidor `ignam`, que já hospeda outra aplicação. As portas 80 e 443 têm dono (o `tailscale serve` usa a 443 na tailnet), os containers rodam em Podman com SELinux, e quem configura o deploy não tem permissão para cadastrar secrets no repositório público.

## Decisão

- O servidor puxa a `main`: o `gig-deploy.timer` roda `infra/deploy/deploy.sh` a cada 2 minutos. O script só implanta um commit quando os jobs `verificar` e `imagens` do CI passaram nele, e volta para a versão anterior se a nova não responder ao healthcheck.
- No servidor, o Compose recebe `infra/deploy/compose.servidor.yml`: o Nginx publica só em `127.0.0.1:8081`, sem TLS, com `infra/nginx/gig-proxy.conf.template`.
- O público acessa `https://gigreat.online` pelo Cloudflare Tunnel (`infra/deploy/cloudflared-gig.service`), sem abrir portas no servidor. O DNS é um CNAME com proxy para o túnel, e a zona usa SSL Full (strict), Always Use HTTPS e TLS mínimo 1.2.
- A equipe também acessa pela tailnet, com TLS do `tailscale serve` em `https://<host>.ts.net:8443`.

## Consequências

- O repositório não guarda credencial do servidor, e o servidor não precisa aceitar conexão do GitHub nem da internet.
- Uma atualização da `main` leva até 2 minutos depois do fim do CI, mais o build no servidor.
- As migrações não voltam: a volta automática só é segura quando a versão nova não alterou o banco.
- O IP do visitante chega ao Nginx em `CF-Connecting-IP`. Pela tailnet, esse cabeçalho pode ser forjado, o que só afeta o limite por IP de quem já está na tailnet.
- O token da API da Cloudflare (`/etc/gig/cloudflare.env`) e o do conector (`/etc/gig/cloudflared-token`) ficam só no servidor, legíveis apenas pelo root.
