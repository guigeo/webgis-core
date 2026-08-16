import os

import pytest
from sqlalchemy import create_engine, text

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

pytestmark = pytest.mark.skipif(
    not TEST_DATABASE_URL,
    reason="TEST_DATABASE_URL is required for the PostGIS integration test",
)


def test_runtime_user_has_only_catalog_read_access() -> None:
    engine = create_engine(TEST_DATABASE_URL)

    with engine.connect() as connection:
        permissions = (
            connection.execute(
                text(
                    """
                    SELECT current_user AS role,
                           has_schema_privilege(current_user, 'core', 'USAGE') AS core_usage,
                           has_schema_privilege(current_user, 'core', 'CREATE') AS core_create,
                           has_table_privilege(current_user, 'core.layers', 'SELECT')
                               AS catalog_select,
                           has_table_privilege(current_user, 'core.layers', 'INSERT,UPDATE,DELETE')
                               AS catalog_write
                    """
                )
            )
            .mappings()
            .one()
        )
        source_permissions = connection.execute(
            text(
                """
                SELECT bool_and(
                    has_table_privilege(
                        current_user,
                        format('%I.%I', source_schema, source_table),
                        'SELECT'
                    )
                )
                FROM core.layers
                """
            )
        ).scalar_one()

    assert permissions == {
        "role": "geo_core_app",
        "core_usage": True,
        "core_create": False,
        "catalog_select": True,
        "catalog_write": False,
    }
    assert source_permissions is True
