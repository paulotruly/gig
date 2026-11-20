#!/bin/sh
# Envia um backup para um bucket compatível com S3 (Cloudflare R2). Uso: enviar.sh <arquivo>
# Exige R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY.
# O arquivo já sai cifrado do backup.sh; a retenção fica numa regra de ciclo de vida do bucket.
#
# A assinatura AWS SigV4 é feita aqui com openssl: o --aws-sigv4 do curl desta imagem (7.76)
# calcula o hash do corpo como texto e erra em arquivo binário.
set -eu

file="${1:?Informe o arquivo de backup.}"
: "${R2_ENDPOINT:?}" "${R2_BUCKET:?}" "${R2_ACCESS_KEY_ID:?}" "${R2_SECRET_ACCESS_KEY:?}"

name="$(basename "$file")"
case "$name" in
  *[!A-Za-z0-9._-]*) echo "Nome de arquivo inválido para o bucket: $name" >&2; exit 1 ;;
esac
endpoint="${R2_ENDPOINT%/}"
host="${endpoint#*://}"
host="${host%%/*}"
path="/${R2_BUCKET}/${name}"
empty_sha=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

sha256_hex() { openssl dgst -sha256 -r | cut -d' ' -f1; }
hmac_hex() { printf '%s' "$2" | openssl dgst -sha256 -mac HMAC -macopt "hexkey:$1" -r | cut -d' ' -f1; }

# Requisição assinada. Uso: s3 <método> <hash do corpo> [opções do curl...]
s3() {
  method="$1"
  payload="$2"
  shift 2
  now="$(date -u +%Y%m%dT%H%M%SZ)"
  day="${now%%T*}"
  scope="$day/auto/s3/aws4_request"
  request_hash="$(printf '%s\n%s\n\nhost:%s\nx-amz-content-sha256:%s\nx-amz-date:%s\n\nhost;x-amz-content-sha256;x-amz-date\n%s' \
    "$method" "$path" "$host" "$payload" "$now" "$payload" | sha256_hex)"
  key="$(printf 'AWS4%s' "$R2_SECRET_ACCESS_KEY" | od -An -v -tx1 | tr -d ' \n')"
  for part in "$day" auto s3 aws4_request; do
    key="$(hmac_hex "$key" "$part")"
  done
  signature="$(hmac_hex "$key" "$(printf 'AWS4-HMAC-SHA256\n%s\n%s\n%s' "$now" "$scope" "$request_hash")")"
  curl -fsS --retry 3 -X "$method" \
    -H "x-amz-date: $now" \
    -H "x-amz-content-sha256: $payload" \
    -H "Authorization: AWS4-HMAC-SHA256 Credential=$R2_ACCESS_KEY_ID/$scope, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=$signature" \
    "$@" "$endpoint$path"
}

size="$(wc -c <"$file" | tr -d ' ')"
s3 PUT "$(sha256_hex <"$file")" -o /dev/null -T "$file"

# Confere que o objeto chegou inteiro.
remote="$(s3 HEAD "$empty_sha" -I | tr -d '\r' | awk 'tolower($1) == "content-length:" { print $2 }')"
if [ "$remote" != "$size" ]; then
  echo "Envio incompleto: $size bytes locais, ${remote:-0} no bucket." >&2
  exit 1
fi
echo "Backup enviado: $name ($size bytes)"
