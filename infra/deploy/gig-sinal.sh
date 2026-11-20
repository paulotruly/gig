#!/usr/bin/env bash
# Sinal de vida do site (022). Roda pelo gig-sinal.timer a cada 5 minutos: acessa o GiG pelo
# caminho público (Cloudflare, túnel, Nginx e app) e avisa o Healthchecks.io. Se o servidor
# cair, os avisos param e o Healthchecks.io manda e-mail; se o site falhar, o aviso é de falha.
# Monitores de fora, como o GitHub Actions, recebem 403 da proteção contra robôs da Cloudflare.
set -uo pipefail

GIG_SITE_URL=${GIG_SITE_URL:-https://gigreat.online}

falhas=()
for caminho in /api/health /; do
  if ! curl -fsS -o /dev/null --max-time 20 --retry 2 --retry-delay 10 --retry-all-errors \
    "${GIG_SITE_URL%/}$caminho" 2>/dev/null; then
    falhas+=("$caminho")
  fi
done

if [ ${#falhas[@]} -eq 0 ]; then
  sufixo=''
  mensagem='ok'
else
  sufixo='/fail'
  mensagem="Falharam: ${falhas[*]} em $GIG_SITE_URL"
  echo "[gig-sinal] $mensagem" >&2
fi

if [ -z "${HEALTHCHECKS_SITE_URL:-}" ]; then
  [ ${#falhas[@]} -eq 0 ] || exit 1
  exit 0
fi
curl -fsS -m 10 --retry 3 -o /dev/null --data-raw "$mensagem" "${HEALTHCHECKS_SITE_URL%/}$sufixo" ||
  echo "[gig-sinal] Falha ao avisar o Healthchecks.io." >&2
[ ${#falhas[@]} -eq 0 ]
