#!/bin/sh
# Roda um backup por dia. Uma falha fica no log e não derruba o serviço; o healthcheck da
# imagem marca o container como unhealthy quando o backup mais recente fica velho.
# Com R2_BUCKET definido, cada backup também vai para fora do servidor (enviar.sh).
set -u

local_days="${BACKUP_LOCAL_DAYS:-7}"

while true; do
  if output="$(backup.sh /backups)"; then
    echo "$output"
    file="${output##*Backup criado: }"
    if [ -n "${R2_BUCKET:-}" ]; then
      enviar.sh "$file" || echo "Falha no envio do backup para o R2." >&2
    fi
  else
    echo "Falha no backup." >&2
  fi
  # Mantém só os últimos dias no disco; o histórico longo fica no bucket.
  find /backups -maxdepth 1 -name 'gig-*.sql.gz.enc' -mtime +"$local_days" -delete
  sleep 86400
done
