#!/bin/sh
# Roda um backup por dia. Uma falha fica no log e não derruba o serviço; o healthcheck do
# Compose marca o container como unhealthy quando o backup mais recente fica velho.
# Com R2_BUCKET definido, cada backup também vai para fora do servidor (enviar.sh).
# Com HEALTHCHECKS_URL definido, cada rodada avisa o Healthchecks.io, que manda e-mail
# quando o aviso atrasa ou chega como falha (022).
set -u

local_days="${BACKUP_LOCAL_DAYS:-7}"

# Como processo principal do container, o shell ignora SIGTERM por padrão e seria morto à
# força depois do prazo. Com o trap, ele sai na hora durante a espera; durante um backup,
# sai assim que o backup em curso termina.
trap 'echo "Encerrando o agendador de backup."; exit 0' TERM INT

# Avisa o Healthchecks.io. Uso: avisar [/fail] [mensagem]. Uma falha aqui não derruba nada.
avisar() {
  [ -n "${HEALTHCHECKS_URL:-}" ] || return 0
  curl -fsS -m 10 --retry 3 -o /dev/null --data-raw "${2:-}" "${HEALTHCHECKS_URL%/}${1:-}" ||
    echo "Falha ao avisar o Healthchecks.io." >&2
}

while true; do
  # Restos de um backup interrompido (o arquivo só ganha o nome final quando termina).
  find /backups -maxdepth 1 -name 'gig-*.parcial*' -delete
  status=0
  if output="$(backup.sh /backups)"; then
    echo "$output"
    file="${output##*Backup criado: }"
    if [ -n "${R2_BUCKET:-}" ] && ! enviar.sh "$file"; then
      echo "Falha no envio do backup para o R2." >&2
      status=1
    fi
  else
    echo "Falha no backup." >&2
    status=1
  fi
  if [ "$status" -eq 0 ]; then
    avisar '' "$(basename "$file")"
  else
    avisar /fail 'Falha no backup ou no envio ao R2; veja o log do container gig-backup-1.'
  fi
  # Mantém só os últimos dias no disco; o histórico longo fica no bucket.
  find /backups -maxdepth 1 -name 'gig-*.sql.gz.enc' -mtime +"$local_days" -delete
  # Em segundo plano, para o trap valer durante a espera.
  sleep 86400 &
  wait $!
done
