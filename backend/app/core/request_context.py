from __future__ import annotations

import logging
import re
from contextvars import ContextVar, Token
from time import perf_counter
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

REQUEST_ID_HEADER = "X-Request-ID"
_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")
_request_id: ContextVar[str | None] = ContextVar("request_id", default=None)

logger = logging.getLogger("app.http")


def get_request_id() -> str | None:
    return _request_id.get()


def normalize_request_id(value: str | None) -> str:
    if value and _REQUEST_ID_PATTERN.fullmatch(value):
        return value
    return str(uuid4())


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        request_id = normalize_request_id(request.headers.get(REQUEST_ID_HEADER))
        token: Token[str | None] = _request_id.set(request_id)
        request.state.request_id = request_id
        started_at = perf_counter()
        status_code = 500

        try:
            try:
                response = await call_next(request)
                status_code = response.status_code
            except Exception:
                logger.exception(
                    "Unhandled request error",
                    extra=self._log_context(request, request_id, status_code, started_at),
                )
                response = JSONResponse(
                    status_code=status_code,
                    content={
                        "detail": "Internal server error",
                        "requestId": request_id,
                    },
                )

            response.headers[REQUEST_ID_HEADER] = request_id
            logger.info(
                "Request completed",
                extra=self._log_context(request, request_id, status_code, started_at),
            )
            return response
        finally:
            _request_id.reset(token)

    @staticmethod
    def _log_context(
        request: Request,
        request_id: str,
        status_code: int,
        started_at: float,
    ) -> dict[str, str | int | float]:
        return {
            "request_id": request_id,
            "http_method": request.method,
            "http_path": request.url.path,
            "status_code": status_code,
            "duration_ms": round((perf_counter() - started_at) * 1000, 2),
        }
