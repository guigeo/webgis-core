import pytest

from app.core.database_access import _connection_url, validate_runtime_role


@pytest.mark.parametrize("role", ["geo_core_app", "runtime1", "app_reader"])
def test_runtime_role_accepts_restricted_identifiers(role: str) -> None:
    assert validate_runtime_role(role) == role


@pytest.mark.parametrize(
    "role",
    ["GeoCore", "role-with-dash", "role;drop database", "1runtime", "a" * 64],
)
def test_runtime_role_rejects_unsafe_identifiers(role: str) -> None:
    with pytest.raises(ValueError):
        validate_runtime_role(role)


def test_connection_url_removes_sqlalchemy_driver() -> None:
    result = _connection_url("postgresql+psycopg://admin:secret@database:5432/geo_core")

    assert result == "postgresql://admin:secret@database:5432/geo_core"


def test_connection_url_rejects_other_databases() -> None:
    with pytest.raises(ValueError):
        _connection_url("sqlite:///geo-core.db")
