#!/bin/sh
# Restaura um backup em um banco vazio. Uso: restore.sh <arquivo .sql.gz.enc>
# Exige MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PWD, MYSQL_DATABASE e BACKUP_PASSPHRASE.
set -eu

file="${1:?Informe o arquivo de backup.}"
: "${MYSQL_HOST:?}" "${MYSQL_USER:?}" "${MYSQL_DATABASE:?}" "${BACKUP_PASSPHRASE:?}"
export MYSQL_PWD="${MYSQL_PWD:-}"

connection="--host=$MYSQL_HOST --port=${MYSQL_PORT:-3306} --user=$MYSQL_USER"

# Recusa banco com tabelas para nunca sobrescrever dados em uso.
tables="$(mysql $connection -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$MYSQL_DATABASE'")"
if [ "$tables" != "0" ]; then
  echo "O banco de destino não está vazio." >&2
  exit 1
fi

decrypt() {
  openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_PASSPHRASE -in "$file"
}

# Confere senha e integridade antes de tocar no banco: com senha errada, o gzip recusa os dados.
if ! decrypt | gzip -t; then
  echo "Senha incorreta ou arquivo corrompido: nada foi restaurado." >&2
  exit 1
fi

decrypt | gzip -dc | mysql $connection "$MYSQL_DATABASE"
echo "Backup restaurado em $MYSQL_DATABASE."
