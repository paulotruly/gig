# 022: monitoramento

**Situação:** `em andamento`
**Depende de:** 017
**Referências:** [decisão 0004](../decisoes/0004-implantacao-puxada-pelo-servidor.md), `specs/arquitetura.md` (observabilidade)

## Objetivo

Avisar a equipe por e-mail quando o site sai do ar ou o backup para, sem depender do próprio servidor, que cairia junto com o que vigia.

## Requisitos

- R1: um workflow agendado do GitHub Actions confere `https://gigreat.online/api/health` e a página inicial a cada 15 minutos, com até 3 tentativas espaçadas. Se falhar, o GitHub manda e-mail para quem configurou o agendamento.
- R2: o workflow também pode ser disparado à mão.
- R3: o serviço `backup` avisa o Healthchecks.io a cada backup: sucesso quando o dump e o envio ao R2 (se configurado) dão certo, e falha caso contrário. O endereço fica em `HEALTHCHECKS_URL`, opcional e fora do repositório. Sem ele, nada muda.
- R4: o check do Healthchecks.io espera um sinal por dia, com 2 horas de tolerância, e manda e-mail quando o sinal atrasa ou chega como falha.
- R5: a falha ao avisar o Healthchecks.io não derruba o backup.

## Fora do escopo

- Painel de métricas e alertas por WhatsApp ou outro canal.
- Monitorar o IGNAM, que divide o servidor.

## Critérios de aceite

- [ ] C1: quando disparo o workflow à mão com o site no ar, então ele passa.
- [ ] C2: quando um backup termina, então o check do Healthchecks.io registra o sinal de sucesso.
- [ ] C3: quando o backup falha, então o Healthchecks.io registra uma falha e manda e-mail.

## Plano técnico

- `.github/workflows/monitor.yml` com `schedule` e `workflow_dispatch`.
- `infra/backup/agendar.sh` chama `HEALTHCHECKS_URL` ou `HEALTHCHECKS_URL/fail` com `curl`, e o `docker-compose.yml` repassa a variável ao serviço `backup`.

## Tarefas

- [x] T1: workflow que vigia o site.
- [x] T2: sinal do backup para o Healthchecks.io.
- [ ] T3: check criado no Healthchecks.io e endereço no `.env` do servidor.
- [ ] T4: conferir sucesso e falha no painel do Healthchecks.io.

## Notas

O GitHub desativa workflows agendados de repositório público depois de 60 dias sem atividade no repositório e manda e-mail antes; basta reativar na aba Actions. O agendamento do GitHub pode atrasar alguns minutos nos horários de pico.
