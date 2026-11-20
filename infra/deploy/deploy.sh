#!/usr/bin/env bash
# Implanta a main no servidor quando o CI do commit passou no GitHub.
# Roda como root pelo gig-deploy.timer, a partir da cópia em /usr/local/sbin/gig-deploy.
# O servidor puxa do GitHub: o repositório não guarda nenhuma credencial do servidor.
set -euo pipefail

GIG_DIR=${GIG_DIR:-/opt/gig}
GIG_BRANCH=${GIG_BRANCH:-main}
GIG_REPO=${GIG_REPO:-paulotruly/gig}
GIG_STATE_DIR=${GIG_STATE_DIR:-/var/lib/gig-deploy}
GIG_HEALTH_URL=${GIG_HEALTH_URL:-http://127.0.0.1:8081/api/health}
# Jobs do .github/workflows/ci.yml que precisam passar.
GIG_REQUIRED_CHECKS=${GIG_REQUIRED_CHECKS:-verificar imagens}

compose() {
  docker compose -p gig -f docker-compose.yml -f infra/deploy/compose.servidor.yml "$@"
}

log() { echo "[gig-deploy] $*"; }

# Responde ok, pendente ou falhou para os checks do commit.
ci_status() {
  curl -fsS -H 'Accept: application/vnd.github+json' \
    "https://api.github.com/repos/${GIG_REPO}/commits/$1/check-runs?per_page=100" |
    python3 -c '
import json, sys
required = sys.argv[1].split()
runs = {r["name"]: r for r in json.load(sys.stdin)["check_runs"]}
if any(name not in runs or runs[name]["status"] != "completed" for name in required):
    print("pendente")
elif all(runs[name]["conclusion"] in ("success", "skipped", "neutral") for name in required):
    print("ok")
else:
    print("falhou")
' "$GIG_REQUIRED_CHECKS"
}

wait_healthy() {
  for _ in $(seq 1 60); do
    if curl -fsS -o /dev/null "$GIG_HEALTH_URL" && curl -fsS -o /dev/null "${GIG_HEALTH_URL%/api/health}/"; then
      return 0
    fi
    sleep 5
  done
  return 1
}

up() {
  compose up -d --build --remove-orphans && wait_healthy
}

mkdir -p "$GIG_STATE_DIR"
exec 9>"$GIG_STATE_DIR/lock"
flock -n 9 || exit 0

cd "$GIG_DIR"
git fetch -q origin "$GIG_BRANCH"
target=$(git rev-parse "origin/$GIG_BRANCH")
current=$(cat "$GIG_STATE_DIR/implantado" 2>/dev/null || true)
rejected=$(cat "$GIG_STATE_DIR/rejeitado" 2>/dev/null || true)

if [ "${1:-}" != "--forcar" ]; then
  [ "$target" = "$current" ] && exit 0
  [ "$target" = "$rejected" ] && exit 0
  status=$(ci_status "$target")
  case "$status" in
    pendente) log "CI de ${target:0:7} ainda não terminou."; exit 0 ;;
    falhou)
      log "CI de ${target:0:7} falhou; o commit não será implantado."
      echo "$target" >"$GIG_STATE_DIR/rejeitado"
      exit 0
      ;;
  esac
fi

log "Implantando ${target:0:7} (anterior: ${current:0:7})."
git checkout -q --detach "$target"
# Atualiza a cópia que o timer executa; esta execução segue com a versão já carregada.
install -m 0755 infra/deploy/deploy.sh /usr/local/sbin/gig-deploy
# Sinal de vida do site (022), mantido junto com cada versão.
if [ -f infra/deploy/gig-sinal.sh ]; then
  install -m 0755 infra/deploy/gig-sinal.sh /usr/local/sbin/gig-sinal
  install -m 0644 infra/deploy/gig-sinal.service infra/deploy/gig-sinal.timer /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable -q --now gig-sinal.timer || log "Não foi possível ligar o gig-sinal.timer."
fi

if up; then
  echo "$target" >"$GIG_STATE_DIR/implantado"
  rm -f "$GIG_STATE_DIR/rejeitado"
  docker image prune -f >/dev/null || true
  log "${target:0:7} no ar."
  exit 0
fi

log "Falha ao subir ${target:0:7}."
compose ps || true
compose logs --tail=50 || true
echo "$target" >"$GIG_STATE_DIR/rejeitado"
if [ -n "$current" ]; then
  # As migrações não voltam: se a nova versão já migrou o banco, a anterior pode não servir.
  log "Voltando para ${current:0:7}."
  git checkout -q --detach "$current"
  up || log "A versão anterior também não subiu."
fi
exit 1
