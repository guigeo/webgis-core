#!/bin/sh
set -eu

usage() {
    cat >&2 <<'EOF'
Uso:
  sh scripts/restore-postgis.sh ARQUIVO [ENV_FILE]
  RESTORE_CONFIRMATION=replace:NOME_DO_BANCO \
    sh scripts/restore-postgis.sh --replace ARQUIVO [ENV_FILE]

Sem --replace, o comando apenas valida checksum e conteúdo do arquivo.
EOF
    exit 2
}

replace_database=0
if [ "${1:-}" = "--replace" ]; then
    replace_database=1
    shift
fi

[ "$#" -ge 1 ] && [ "$#" -le 2 ] || usage

script_directory="$(CDPATH= cd "$(dirname "$0")" && pwd)"
repository_root="$(CDPATH= cd "$script_directory/.." && pwd)"
backup_file="$1"
environment_file="${2:-$repository_root/.env.production}"

case "$backup_file" in
    /*) ;;
    *) backup_file="$(CDPATH= cd "$(dirname "$backup_file")" 2>/dev/null && pwd)/$(basename "$backup_file")" ;;
esac
case "$environment_file" in
    /*) ;;
    *) environment_file="$repository_root/$environment_file" ;;
esac

read_value() {
    sed -n "s/^$1=//p" "$environment_file" | tail -n 1
}

calculate_checksum() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    else
        shasum -a 256 "$1" | awk '{print $1}'
    fi
}

compose() {
    docker compose --env-file "$environment_file" -f "$repository_root/docker-compose.prod.yml" "$@"
}

sh "$script_directory/validate-production-env.sh" "$environment_file" >/dev/null

if [ ! -s "$backup_file" ]; then
    echo "Backup inexistente ou vazio: $backup_file" >&2
    exit 1
fi

checksum_file="$backup_file.sha256"
if [ ! -s "$checksum_file" ]; then
    echo "Checksum inexistente ou vazio: $checksum_file" >&2
    exit 1
fi

expected_checksum="$(awk 'NR == 1 {print $1}' "$checksum_file")"
actual_checksum="$(calculate_checksum "$backup_file")"
if [ "$actual_checksum" != "$expected_checksum" ]; then
    echo "Checksum inválido para $backup_file." >&2
    exit 1
fi

if ! compose ps --status running --services | grep -qx database; then
    echo "O serviço database da stack de produção não está em execução." >&2
    exit 1
fi

compose exec -T database pg_restore --list <"$backup_file" >/dev/null

database_name="$(read_value POSTGRES_DB)"
admin_user="$(read_value POSTGRES_USER)"

if [ "$replace_database" -eq 0 ]; then
    echo "Backup válido: $backup_file"
    echo "Nenhum dado foi alterado. Use --replace com confirmação explícita para restaurar."
    exit 0
fi

expected_confirmation="replace:$database_name"
if [ "${RESTORE_CONFIRMATION:-}" != "$expected_confirmation" ]; then
    echo "Restauração recusada." >&2
    echo "Defina RESTORE_CONFIRMATION=$expected_confirmation para substituir o banco." >&2
    exit 1
fi

replacement_started=0
replacement_completed=0
on_exit() {
    status="$?"
    trap - EXIT HUP INT TERM
    if [ "$replacement_started" -eq 1 ] && [ "$replacement_completed" -eq 0 ]; then
        compose stop backend gateway >/dev/null 2>&1 || true
        echo "Restauração incompleta; backend e gateway permaneceram parados." >&2
    fi
    exit "$status"
}
trap on_exit EXIT
trap 'exit 130' HUP INT TERM

compose stop backend gateway
replacement_started=1

compose exec -T database dropdb \
    --username "$admin_user" \
    --force \
    --if-exists \
    "$database_name"
compose exec -T database createdb \
    --username "$admin_user" \
    --owner "$admin_user" \
    "$database_name"

compose exec -T database \
    pg_restore \
    --username "$admin_user" \
    --dbname "$database_name" \
    --exit-on-error \
    --no-owner \
    --no-acl \
    <"$backup_file"

compose run --rm --no-deps migrate
compose up -d --no-deps backend gateway

attempt=0
while [ "$attempt" -lt 30 ]; do
    if compose exec -T backend python -c \
        "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)" \
        >/dev/null 2>&1; then
        replacement_completed=1
        break
    fi
    attempt=$((attempt + 1))
    sleep 2
done

if [ "$replacement_completed" -ne 1 ]; then
    echo "A API não ficou saudável após a restauração." >&2
    exit 1
fi

trap - EXIT HUP INT TERM
echo "Restauração concluída e API saudável: $backup_file"
