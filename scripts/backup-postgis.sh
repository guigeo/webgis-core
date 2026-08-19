#!/bin/sh
set -eu

script_directory="$(CDPATH= cd "$(dirname "$0")" && pwd)"
repository_root="$(CDPATH= cd "$script_directory/.." && pwd)"
environment_file="${1:-$repository_root/.env.production}"

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

database_name="$(read_value POSTGRES_DB)"
admin_user="$(read_value POSTGRES_USER)"

if ! compose ps --status running --services | grep -qx database; then
    echo "O serviço database da stack de produção não está em execução." >&2
    exit 1
fi

backup_directory="${BACKUP_DIR:-$repository_root/backups}"
case "$backup_directory" in
    /*) ;;
    *) backup_directory="$repository_root/$backup_directory" ;;
esac

umask 077
mkdir -p "$backup_directory"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$backup_directory/geo-core-$timestamp.dump"
temporary_file="$(mktemp "$backup_directory/.geo-core-backup.XXXXXX")"

cleanup_temporary_file() {
    rm -f "$temporary_file"
}
trap cleanup_temporary_file EXIT HUP INT TERM

if [ -e "$backup_file" ] || [ -e "$backup_file.sha256" ]; then
    echo "Já existe um backup com o timestamp $timestamp." >&2
    exit 1
fi

compose exec -T database \
    pg_dump \
    --username "$admin_user" \
    --dbname "$database_name" \
    --format custom \
    --compress 9 \
    --no-owner \
    --no-acl \
    >"$temporary_file"

if [ ! -s "$temporary_file" ]; then
    echo "O pg_dump produziu um arquivo vazio." >&2
    exit 1
fi

compose exec -T database pg_restore --list <"$temporary_file" >/dev/null

mv "$temporary_file" "$backup_file"
checksum="$(calculate_checksum "$backup_file")"
printf '%s  %s\n' "$checksum" "$(basename "$backup_file")" >"$backup_file.sha256"
chmod 600 "$backup_file" "$backup_file.sha256"

trap - EXIT HUP INT TERM
printf '%s\n' "$backup_file"
