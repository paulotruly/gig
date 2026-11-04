#!/bin/sh
# Roda um backup por dia. Uma falha fica no log e não derruba o serviço.
set -u

while true; do
  backup.sh /backups || echo "Falha no backup." >&2
  sleep 86400
done
