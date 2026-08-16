from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import Any

from app.core.request_context import get_request_id

_STRUCTURED_HANDLER_NAME = "geo-core-json"
_CONTEXT_FIELDS = (
    "request_id",
    "http_method",
    "http_path",
    "status_code",
    "duration_ms",
)


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, UTC)
            .isoformat(timespec="milliseconds")
            .replace("+00:00", "Z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        request_id = getattr(record, "request_id", None) or get_request_id()
        if request_id:
            payload["request_id"] = request_id

        for field in _CONTEXT_FIELDS[1:]:
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False)


def configure_logging(level: str) -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    structured_handler: logging.Handler | None = None
    for handler in root_logger.handlers:
        if handler.get_name() == _STRUCTURED_HANDLER_NAME:
            handler.setLevel(level)
            structured_handler = handler
            break

    if structured_handler is None:
        structured_handler = logging.StreamHandler()
        structured_handler.set_name(_STRUCTURED_HANDLER_NAME)
        structured_handler.setLevel(level)
        structured_handler.setFormatter(JsonFormatter())
        root_logger.addHandler(structured_handler)

    server_logger = logging.getLogger("uvicorn")
    server_logger.handlers = [structured_handler]
    server_logger.setLevel(level)
    server_logger.propagate = False
