from __future__ import annotations

import argparse
import re
from collections.abc import Sequence

import psycopg
from psycopg import sql
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url

_ROLE_PATTERN = re.compile(r"^[a-z_][a-z0-9_]{0,62}$")


class DatabaseAccessSettings(BaseSettings):
    database_url: str
    database_runtime_user: str = "geo_core_app"
    database_runtime_password: str = Field(min_length=12)

    model_config = SettingsConfigDict(extra="ignore")


def validate_runtime_role(role: str) -> str:
    if not _ROLE_PATTERN.fullmatch(role):
        raise ValueError(
            "DATABASE_RUNTIME_USER must contain only lowercase letters, numbers and underscores"
        )
    return role


def _connection_url(database_url: str) -> str:
    parsed_url = make_url(database_url)
    if not parsed_url.drivername.startswith("postgresql"):
        raise ValueError("DATABASE_URL must use PostgreSQL")
    return parsed_url.set(drivername="postgresql").render_as_string(hide_password=False)


def ensure_runtime_role(settings: DatabaseAccessSettings) -> None:
    role = validate_runtime_role(settings.database_runtime_user)

    with (
        psycopg.connect(_connection_url(settings.database_url)) as connection,
        connection.cursor() as cursor,
    ):
        cursor.execute("SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = %s)", (role,))
        role_exists = cursor.fetchone()[0]
        statement = sql.SQL(
            "ALTER ROLE {} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE "
            "NOREPLICATION NOBYPASSRLS NOINHERIT PASSWORD {}"
            if role_exists
            else "CREATE ROLE {} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE "
            "NOREPLICATION NOBYPASSRLS NOINHERIT PASSWORD {}"
        ).format(sql.Identifier(role), sql.Literal(settings.database_runtime_password))
        cursor.execute(statement)


def grant_runtime_access(settings: DatabaseAccessSettings) -> None:
    role = validate_runtime_role(settings.database_runtime_user)

    with (
        psycopg.connect(_connection_url(settings.database_url)) as connection,
        connection.cursor() as cursor,
    ):
        cursor.execute("SELECT current_database()")
        database = cursor.fetchone()[0]
        cursor.execute(
            """
            SELECT DISTINCT source_schema, source_table
            FROM core.layers
            ORDER BY source_schema, source_table
            """
        )
        catalog_tables = {(row[0], row[1]) for row in cursor.fetchall()}

        schemas = {"core", *(schema for schema, _ in catalog_tables)}
        readable_tables = {("core", "layers"), *catalog_tables}

        cursor.execute(
            sql.SQL("GRANT CONNECT ON DATABASE {} TO {}").format(
                sql.Identifier(database),
                sql.Identifier(role),
            )
        )
        for schema in sorted(schemas):
            cursor.execute(
                sql.SQL("REVOKE ALL PRIVILEGES ON SCHEMA {} FROM {}").format(
                    sql.Identifier(schema),
                    sql.Identifier(role),
                )
            )
            cursor.execute(
                sql.SQL("REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA {} FROM {}").format(
                    sql.Identifier(schema),
                    sql.Identifier(role),
                )
            )
            cursor.execute(
                sql.SQL("REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA {} FROM {}").format(
                    sql.Identifier(schema),
                    sql.Identifier(role),
                )
            )
            cursor.execute(
                sql.SQL("GRANT USAGE ON SCHEMA {} TO {}").format(
                    sql.Identifier(schema),
                    sql.Identifier(role),
                )
            )

        for schema, table in sorted(readable_tables):
            cursor.execute(
                sql.SQL("GRANT SELECT ON TABLE {}.{} TO {}").format(
                    sql.Identifier(schema),
                    sql.Identifier(table),
                    sql.Identifier(role),
                )
            )


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Provision the runtime database role")
    parser.add_argument("action", choices=("ensure-role", "grant-access"))
    args = parser.parse_args(argv)
    settings = DatabaseAccessSettings()

    if args.action == "ensure-role":
        ensure_runtime_role(settings)
    else:
        grant_runtime_access(settings)


if __name__ == "__main__":
    main()
