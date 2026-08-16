from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.api import health
from app.core.request_context import REQUEST_ID_HEADER
from app.main import app

client = TestClient(app)


def test_health_returns_ok_when_postgis_is_available(monkeypatch) -> None:
    monkeypatch.setattr(health, "check_database", lambda: None)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}
    assert UUID(response.headers[REQUEST_ID_HEADER])


def test_health_returns_503_without_exposing_internal_error(monkeypatch) -> None:
    def unavailable_database() -> None:
        raise OperationalError("SELECT 1", {}, Exception("connection details"))

    monkeypatch.setattr(health, "check_database", unavailable_database)

    response = client.get("/api/health")

    assert response.status_code == 503
    assert response.json() == {"detail": "Database unavailable"}
    assert "connection details" not in response.text
