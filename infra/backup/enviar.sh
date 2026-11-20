#!/bin/sh
# Envia um backup para um bucket compatível com S3 (Cloudflare R2). Uso: enviar.sh <arquivo>
# Exige R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY.
# O arquivo já sai cifrado do backup.sh. A regra de ciclo de vida do bucket apaga o que
# passa de 30 dias, e este script garante um teto de espaço (R2_MAX_BYTES, padrão 5 GB,
# metade da cota gratuita): apaga os backups mais antigos até o novo caber e, se nem
# assim couber, não envia.
#
# A assinatura AWS SigV4 é feita aqui com openssl: o --aws-sigv4 do curl desta imagem (7.76)
# calcula o hash do corpo como texto e erra em arquivo binário.
set -eu

file="${1:?Informe o arquivo de backup.}"
: "${R2_ENDPOINT:?}" "${R2_BUCKET:?}" "${R2_ACCESS_KEY_ID:?}" "${R2_SECRET_ACCESS_KEY:?}"
max_bytes="${R2_MAX_BYTES:-5368709120}"
case "$max_bytes" in
  '' | *[!0-9]*) echo "R2_MAX_BYTES precisa ser um número de bytes." >&2; exit 1 ;;
esac

name="$(basename "$file")"
case "$name" in
  *[!A-Za-z0-9._-]*) echo "Nome de arquivo inválido para o bucket: $name" >&2; exit 1 ;;
esac
endpoint="${R2_ENDPOINT%/}"
host="${endpoint#*://}"
host="${host%%/*}"
empty_sha=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

sha256_hex() { openssl dgst -sha256 -r | cut -d' ' -f1; }
hmac_hex() { printf '%s' "$2" | openssl dgst -sha256 -mac HMAC -macopt "hexkey:$1" -r | cut -d' ' -f1; }

# Requisição assinada. Uso: s3 <método> <caminho> <query ordenada> <hash do corpo> [opções do curl...]
s3() {
  method="$1"
  path="$2"
  query="$3"
  payload="$4"
  shift 4
  now="$(date -u +%Y%m%dT%H%M%SZ)"
  day="${now%%T*}"
  scope="$day/auto/s3/aws4_request"
  request_hash="$(printf '%s\n%s\n%s\nhost:%s\nx-amz-content-sha256:%s\nx-amz-date:%s\n\nhost;x-amz-content-sha256;x-amz-date\n%s' \
    "$method" "$path" "$query" "$host" "$payload" "$now" "$payload" | sha256_hex)"
  key="$(printf 'AWS4%s' "$R2_SECRET_ACCESS_KEY" | od -An -v -tx1 | tr -d ' \n')"
  for part in "$day" auto s3 aws4_request; do
    key="$(hmac_hex "$key" "$part")"
  done
  signature="$(hmac_hex "$key" "$(printf 'AWS4-HMAC-SHA256\n%s\n%s\n%s' "$now" "$scope" "$request_hash")")"
  curl -fsS --retry 3 -X "$method" \
    -H "x-amz-date: $now" \
    -H "x-amz-content-sha256: $payload" \
    -H "Authorization: AWS4-HMAC-SHA256 Credential=$R2_ACCESS_KEY_ID/$scope, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=$signature" \
    "$@" "$endpoint$path${query:+?$query}"
}

size="$(wc -c <"$file" | tr -d ' ')"
if [ "$size" -gt "$max_bytes" ]; then
  echo "Backup de $size bytes passa do limite do bucket ($max_bytes); não foi enviado." >&2
  exit 1
fi

# Objetos atuais, do mais antigo para o mais novo (o nome traz a data em UTC).
listing="$(s3 GET "/$R2_BUCKET" 'list-type=2&max-keys=1000' "$empty_sha")"
case "$listing" in
  *'<IsTruncated>true</IsTruncated>'*)
    echo "O bucket tem mais de 1000 objetos; envio suspenso para não passar do limite." >&2
    exit 1
    ;;
esac
objects="$(printf '%s' "$listing" | awk 'BEGIN { RS = "<Contents>" } NR > 1 {
  key = $0; sub(/.*<Key>/, "", key); sub(/<\/Key>.*/, "", key)
  bytes = $0; sub(/.*<Size>/, "", bytes); sub(/<\/Size>.*/, "", bytes)
  print key, bytes
}' | awk -v self="$name" '$1 != self' | sort)"
# Um objeto com o mesmo nome é substituído pelo envio, então não entra na conta.

total=0
if [ -n "$objects" ]; then
  total="$(printf '%s\n' "$objects" | awk '{ sum += $2 } END { printf "%.0f", sum }')"
fi

# Libera espaço apagando só backups do GiG, dos mais antigos para os mais novos.
for old in $(printf '%s\n' "$objects" | awk '$1 ~ /^gig-[0-9TZ]+\.sql\.gz\.enc$/ { print $1 ":" $2 }'); do
  [ $((total + size)) -le "$max_bytes" ] && break
  old_name="${old%:*}"
  s3 DELETE "/$R2_BUCKET/$old_name" '' "$empty_sha" -o /dev/null
  total=$((total - ${old##*:}))
  echo "Backup antigo apagado do bucket para respeitar o limite: $old_name"
done
if [ $((total + size)) -gt "$max_bytes" ]; then
  echo "O bucket não tem espaço dentro do limite ($total + $size > $max_bytes bytes); não foi enviado." >&2
  exit 1
fi

s3 PUT "/$R2_BUCKET/$name" '' "$(sha256_hex <"$file")" -o /dev/null -T "$file"

# Confere que o objeto chegou inteiro.
remote="$(s3 HEAD "/$R2_BUCKET/$name" '' "$empty_sha" -I | tr -d '\r' | awk 'tolower($1) == "content-length:" { print $2 }')"
if [ "$remote" != "$size" ]; then
  echo "Envio incompleto: $size bytes locais, ${remote:-0} no bucket." >&2
  exit 1
fi
echo "Backup enviado: $name ($size bytes; bucket com $((total + size)) de $max_bytes bytes)"
