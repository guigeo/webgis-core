from functools import lru_cache

from sqlalchemy import Engine, create_engine, text

from app.core.config import get_settings


@lru_cache
def get_engine() -> Engine:
    settings = get_settings()
    return create_engine(settings.database_url, pool_pre_ping=True)


def check_database() -> None:
    with get_engine().connect() as connection:
        connection.execute(text("SELECT PostGIS_Version()"))
