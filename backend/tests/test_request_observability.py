import json
import logging
from uuid import UUID

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.logging import JsonFormatter
from app.core.request_context import REQUEST_ID_HEADER, RequestContextMiddleware


def build_test_client() -> TestClient:
    application = FastAPI()
    application.add_middleware(RequestContextMiddleware)

    @application.get("/ok")
    def ok() -> dict[str, bool]:
        return {"ok": True}

    @application.get("/error")
    def error() -> None:
        raise RuntimeError("sensitive database connection details")

    return TestClient(application)


def test_request_id_is_generated_and_logged(caplog) -> None:
    client = build_test_client()

    with caplog.at_level(logging.INFO, logger="app.http"):
        response = client.get("/ok")

    request_id = response.headers[REQUEST_ID_HEADER]
    assert response.status_code == 200
    assert UUID(request_id)

    completion = next(record for record in caplog.records if record.message == "Request completed")
    assert completion.request_id == request_id
    assert completion.http_method == "GET"
    assert completion.http_path == "/ok"
    assert completion.status_code == 200
    assert completion.duration_ms >= 0


def test_valid_request_id_is_propagated() -> None:
    client = build_test_client()

    response = client.get("/ok", headers={REQUEST_ID_HEADER: "client-request_123"})

    assert response.headers[REQUEST_ID_HEADER] == "client-request_123"


def test_invalid_request_id_is_replaced() -> None:
    client = build_test_client()

    response = client.get("/ok", headers={REQUEST_ID_HEADER: "invalid request id"})

    assert response.headers[REQUEST_ID_HEADER] != "invalid request id"
    assert UUID(response.headers[REQUEST_ID_HEADER])


def test_unhandled_error_returns_safe_public_response() -> None:
    client = build_test_client()

    response = client.get("/error", headers={REQUEST_ID_HEADER: "error-correlation-id"})

    assert response.status_code == 500
    assert response.headers[REQUEST_ID_HEADER] == "error-correlation-id"
    assert response.json() == {
        "detail": "Internal server error",
        "requestId": "error-correlation-id",
    }
    assert "sensitive database connection details" not in response.text


def test_json_formatter_serializes_request_context() -> None:
    record = logging.LogRecord(
        name="app.http",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="Request completed",
        args=(),
        exc_info=None,
    )
    record.request_id = "request-123"
    record.http_method = "GET"
    record.http_path = "/api/health"
    record.status_code = 200
    record.duration_ms = 1.25

    payload = json.loads(JsonFormatter().format(record))

    assert payload == {
        "timestamp": payload["timestamp"],
        "level": "INFO",
        "logger": "app.http",
        "message": "Request completed",
        "request_id": "request-123",
        "http_method": "GET",
        "http_path": "/api/health",
        "status_code": 200,
        "duration_ms": 1.25,
    }
    assert payload["timestamp"].endswith("Z")
