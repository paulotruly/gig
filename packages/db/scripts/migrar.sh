#!/bin/sh
# Serviço migrate do Compose: aplica as migrações e depois as permissões que dependem das tabelas.
# O GRANT é idempotente, então roda a cada implantação e corrige servidores já existentes.
set -eu

npx prisma migrate deploy

if [ -n "${GIG_METRICS_USER:-}" ]; then
  : "${MYSQL_DATABASE:?}"
  case "$GIG_METRICS_USER$MYSQL_DATABASE" in
    *[!A-Za-z0-9_]*)
      echo "GIG_METRICS_USER e MYSQL_DATABASE aceitam só letras, números e _." >&2
      exit 1
      ;;
  esac
  printf "GRANT SELECT ON \`%s\`.\`partner_metrics\` TO '%s'@'%%';\n" \
    "$MYSQL_DATABASE" "$GIG_METRICS_USER" | npx prisma db execute --stdin
  echo "Leitura de partner_metrics garantida para $GIG_METRICS_USER."
fi
