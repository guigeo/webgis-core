#!/bin/sh
set -eu

script_directory="$(CDPATH= cd "$(dirname "$0")" && pwd)"
repository_root="$(CDPATH= cd "$script_directory/.." && pwd)"
temporary_root="${TMPDIR:-/tmp}"
temporary_root="${temporary_root%/}"
test_directory="$(mktemp -d "$temporary_root/geo-core-recovery.XXXXXX")"
environment_file="$test_directory/test.env"
backup_directory="$test_directory/backups"
test_project="geo-core-recovery-test-$$"
test_port="${RECOVERY_TEST_PORT:-18081}"

export COMPOSE_PROJECT_NAME="$test_project"
export BACKUP_DIR="$backup_directory"

compose() {
    docker compose --env-file "$environment_file" -f "$repository_root/docker-compose.prod.yml" "$@"
}

cleanup() {
    status="$?"
    trap - EXIT HUP INT TERM
    if [ "$status" -ne 0 ] && [ -f "$environment_file" ]; then
        compose logs --no-color >&2 || true
    fi
    case "$test_project" in
        geo-core-recovery-test-*) compose down -v --remove-orphans >/dev/null 2>&1 || true ;;
    esac
    case "$test_directory" in
        "$temporary_root"/geo-core-recovery.*) rm -rf "$test_directory" ;;
    esac
    exit "$status"
}
trap cleanup EXIT
trap 'exit 130' HUP INT TERM

sed \
    -e "s#APP_PORT=8080#APP_PORT=$test_port#" \
    -e 's#https://gis.example.com#https://recovery.test#' \
    -e 's/change-me-admin-password/0123456789abcdef0123456789abcdef/' \
    -e 's/change-me-runtime-password/fedcba9876543210fedcba9876543210/' \
    "$repository_root/.env.production.example" \
    >"$environment_file"

sh "$script_directory/validate-production-env.sh" "$environment_file" >/dev/null

compose up -d --build

compose exec -T database psql \
    --username geo_core \
    --dbname geo_core \
    --set ON_ERROR_STOP=1 \
    --command "CREATE TABLE core.recovery_probe (value text PRIMARY KEY); INSERT INTO core.recovery_probe VALUES ('restored-from-backup');"

backup_file="$(sh "$script_directory/backup-postgis.sh" "$environment_file")"
sh "$script_directory/restore-postgis.sh" "$backup_file" "$environment_file" >/dev/null

tampered_backup="$test_directory/tampered.dump"
cp "$backup_file" "$tampered_backup"
cp "$backup_file.sha256" "$tampered_backup.sha256"
printf 'tampered' >>"$tampered_backup"
if sh "$script_directory/restore-postgis.sh" "$tampered_backup" "$environment_file" \
    >/dev/null 2>&1; then
    echo "Um backup com checksum inválido foi aceito." >&2
    exit 1
fi

if RESTORE_CONFIRMATION=replace:wrong_database \
    sh "$script_directory/restore-postgis.sh" --replace "$backup_file" "$environment_file" \
    >/dev/null 2>&1; then
    echo "Uma confirmação de restauração incorreta foi aceita." >&2
    exit 1
fi

compose down -v

if docker volume inspect "${test_project}_postgis_data" >/dev/null 2>&1; then
    echo "O volume de origem não foi removido." >&2
    exit 1
fi

compose up -d

RESTORE_CONFIRMATION=replace:geo_core \
    sh "$script_directory/restore-postgis.sh" --replace "$backup_file" "$environment_file"

integrity_result="$(
    compose exec -T database psql \
        --username geo_core \
        --dbname geo_core \
        --tuples-only \
        --no-align \
        --command "
            SELECT
                (SELECT count(*) FROM core.layers),
                (SELECT count(*) FROM reference.rmsp_municipalities),
                (SELECT count(*) FROM reference.rmsp_municipality_points),
                (SELECT min(ST_SRID(geometry)) FROM reference.rmsp_municipalities),
                (SELECT value FROM core.recovery_probe);
        "
)"

if [ "$integrity_result" != "2|39|39|4326|restored-from-backup" ]; then
    echo "Integridade inesperada após restauração: $integrity_result" >&2
    exit 1
fi

if compose exec -T \
    --env PGPASSWORD=fedcba9876543210fedcba9876543210 \
    database psql \
    --host 127.0.0.1 \
    --username geo_core_app \
    --dbname geo_core \
    --command "CREATE TABLE core.runtime_must_not_write (id integer)"; then
    compose exec -T database psql \
        --username geo_core \
        --dbname geo_core \
        --command "DROP TABLE IF EXISTS core.runtime_must_not_write" >/dev/null
    echo "O usuário runtime conseguiu escrever após a restauração." >&2
    exit 1
fi

GATEWAY_URL="http://127.0.0.1:$test_port" sh "$script_directory/test-gateway.sh"

echo "Backup e restauração em volume novo aprovados"
