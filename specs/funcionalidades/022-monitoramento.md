# 022: monitoramento

**Situação:** `concluída`
**Depende de:** 017
**Referências:** [decisão 0004](../decisoes/0004-implantacao-puxada-pelo-servidor.md), `specs/arquitetura.md` (observabilidade)

## Objetivo

Avisar a equipe por e-mail quando o site sai do ar ou o backup para. O aviso vem do Healthchecks.io, de fora do servidor: ele espera sinais periódicos e avisa quando eles atrasam ou chegam como falha, então também detecta o servidor fora do ar.

## Requisitos

- R1: o `gig-sinal.timer` do servidor acessa `https://gigreat.online/api/health` e a página inicial a cada 5 minutos, pelo caminho público (Cloudflare, túnel, Nginx e app), com até 3 tentativas. Se tudo responder, avisa sucesso no endereço `HEALTHCHECKS_SITE_URL`; se algo falhar, avisa falha.
- R2: o check do site no Healthchecks.io espera um sinal a cada 5 minutos, com 10 minutos de tolerância.
- R3: o serviço `backup` avisa o Healthchecks.io a cada backup: sucesso quando o dump e o envio ao R2 (se configurado) dão certo, e falha caso contrário. O endereço fica em `HEALTHCHECKS_URL`.
- R4: o check do backup espera um sinal por dia, com 2 horas de tolerância.
- R5: os endereços do Healthchecks.io ficam no `.env` do servidor, fora do repositório, e são opcionais: sem eles, nada muda. A falha ao avisar o Healthchecks.io não derruba o backup nem o timer.
- R6: o `deploy.sh` instala e liga o `gig-sinal.timer` a cada implantação.

## Fora do escopo

- Painel de métricas e alertas por WhatsApp ou outro canal.
- Monitorar o IGNAM, que divide o servidor.

## Critérios de aceite

- [x] C1: com o site no ar, o check do site recebe um sinal de sucesso a cada 5 minutos.
- [x] C2: quando um backup termina, então o check do backup registra o sinal de sucesso.
- [x] C3: quando o site ou o backup falham, então o Healthchecks.io registra uma falha e manda e-mail.

## Plano técnico

- `infra/deploy/gig-sinal.sh`, `gig-sinal.service` e `gig-sinal.timer`, instalados pelo `deploy.sh`.
- `infra/backup/agendar.sh` chama `HEALTHCHECKS_URL` ou `HEALTHCHECKS_URL/fail` com `curl`, e o `docker-compose.yml` repassa a variável ao serviço `backup`.

## Tarefas

- [x] T1: sinal de vida do site, instalado pelo `deploy.sh`.
- [x] T2: sinal do backup para o Healthchecks.io.
- [x] T3: checks `gig-site` e `gig-backup` criados no Healthchecks.io e endereços no `.env` do servidor.
- [x] T4: conferir sucesso e falha no painel do Healthchecks.io.

## Notas

A primeira versão usava um workflow agendado do GitHub Actions, mas a proteção contra robôs da Cloudflare responde 403 aos servidores do GitHub, e o agendamento do GitHub atrasa e é desativado depois de 60 dias sem atividade. O sinal de vida do servidor passa pela mesma Cloudflare sem bloqueio, e o teste com um endereço quebrado acusou a falha.

Em 20/11/2026, os dois checks receberam o primeiro sinal de sucesso, e uma queda simulada do site (sinal de falha seguido do sinal normal) gerou os dois e-mails esperados do Healthchecks.io: o de queda e o de volta.
