#!/bin/sh
# Envia um backup para um bucket compatível com S3 (Cloudflare R2). Uso: enviar.sh <arquivo>
# Exige R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY.
# O arquivo já sai cifrado do backup.sh; a retenção fica numa regra de ciclo de vida do bucket.
set -eu

file="${1:?Informe o arquivo de backup.}"
: "${R2_ENDPOINT:?}" "${R2_BUCKET:?}" "${R2_ACCESS_KEY_ID:?}" "${R2_SECRET_ACCESS_KEY:?}"

url="${R2_ENDPOINT%/}/${R2_BUCKET}/$(basename "$file")"
size="$(wc -c <"$file" | tr -d ' ')"
sha="$(sha256sum "$file" | cut -d' ' -f1)"

s3() {
  # As credenciais vão por arquivo de configuração do curl, fora da lista de processos.
  printf 'user = "%s:%s"\n' "$R2_ACCESS_KEY_ID" "$R2_SECRET_ACCESS_KEY" |
    curl -fsS --retry 3 --config - --aws-sigv4 'aws:amz:auto:s3' "$@"
}

s3 -o /dev/null -T "$file" -H "x-amz-content-sha256: $sha" "$url"

# Confere que o objeto chegou inteiro.
remote="$(s3 -I -H 'x-amz-content-sha256: UNSIGNED-PAYLOAD' "$url" |
  tr -d '\r' | awk 'tolower($1) == "content-length:" { print $2 }')"
if [ "$remote" != "$size" ]; then
  echo "Envio incompleto: $size bytes locais, ${remote:-0} no bucket." >&2
  exit 1
fi
echo "Backup enviado: $(basename "$file") ($size bytes)"
