#!/bin/sh
set -eu

environment_file="${1:-.env.production}"

if [ ! -f "$environment_file" ]; then
    echo "Arquivo de ambiente não encontrado: $environment_file" >&2
    exit 1
fi

read_value() {
    sed -n "s/^$1=//p" "$environment_file" | tail -n 1
}

app_origin="$(read_value APP_ORIGIN)"
database_name="$(read_value POSTGRES_DB)"
admin_user="$(read_value POSTGRES_USER)"
runtime_user="$(read_value POSTGRES_APP_USER)"
admin_password="$(read_value POSTGRES_PASSWORD)"
runtime_password="$(read_value POSTGRES_APP_PASSWORD)"

if [ "$app_origin" = "https://gis.example.com" ] || [ -z "$app_origin" ]; then
    echo "Defina APP_ORIGIN com o domínio HTTPS real." >&2
    exit 1
fi

case "$app_origin" in
    https://*) ;;
    *)
        echo "APP_ORIGIN deve usar HTTPS em produção." >&2
        exit 1
        ;;
esac

for identifier_entry in \
    "POSTGRES_DB:$database_name" \
    "POSTGRES_USER:$admin_user" \
    "POSTGRES_APP_USER:$runtime_user"
do
    identifier_name="${identifier_entry%%:*}"
    identifier_value="${identifier_entry#*:}"

    if ! printf '%s' "$identifier_value" | grep -Eq '^[a-z_][a-z0-9_]{0,62}$'; then
        echo "$identifier_name deve ser um identificador PostgreSQL simples e minúsculo." >&2
        exit 1
    fi
done

for password_entry in \
    "POSTGRES_PASSWORD:$admin_password" \
    "POSTGRES_APP_PASSWORD:$runtime_password"
do
    password_name="${password_entry%%:*}"
    password_value="${password_entry#*:}"

    if [ "${password_value#change-me}" != "$password_value" ]; then
        echo "Substitua o valor de exemplo de $password_name." >&2
        exit 1
    fi

    if ! printf '%s' "$password_value" | grep -Eq '^[A-Za-z0-9._~-]{24,}$'; then
        echo "$password_name deve ter ao menos 24 caracteres URL-safe." >&2
        exit 1
    fi
done

docker compose --env-file "$environment_file" -f docker-compose.prod.yml config --quiet
echo "Ambiente de produção válido: $environment_file"
