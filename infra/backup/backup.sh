#!/bin/sh
# Gera um dump cifrado do banco. Uso: backup.sh <pasta de destino>
# Exige MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PWD, MYSQL_DATABASE e BACKUP_PASSPHRASE.
set -eu

destination="${1:?Informe a pasta de destino.}"
: "${MYSQL_HOST:?}" "${MYSQL_USER:?}" "${MYSQL_DATABASE:?}" "${BACKUP_PASSPHRASE:?}"
export MYSQL_PWD="${MYSQL_PWD:-}"

mkdir -p "$destination"
target="$destination/gig-$(date -u +%Y%m%dT%H%M%SZ).sql.gz.enc"
partial="$target.parcial"

# O arquivo só recebe o nome final depois de o dump inteiro dar certo.
trap 'rm -f "$partial" "$partial.falhou"' EXIT
{
  mysqldump --host="$MYSQL_HOST" --port="${MYSQL_PORT:-3306}" --user="$MYSQL_USER" \
    --single-transaction --triggers --routines --no-tablespaces --set-gtid-purged=OFF \
    "$MYSQL_DATABASE" || : >"$partial.falhou"
} | gzip -c | openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE -out "$partial"

if [ -e "$partial.falhou" ]; then
  echo "Falha no dump: o backup não foi criado." >&2
  exit 1
fi
mv "$partial" "$target"
echo "Backup criado: $target"
