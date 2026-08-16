import re
from dataclasses import dataclass
from typing import Any

from sqlalchemy import Connection, text

IDENTIFIER_PATTERN = re.compile(r"^[a-z_][a-z0-9_]*$")


@dataclass(frozen=True)
class LayerSource:
    id: str
    name: str
    description: str
    source_schema: str
    source_table: str
    geometry_column: str
    geometry_type: str
    feature_id_column: str
    fields: list[dict[str, str]]
    style: dict[str, Any]
    attribution: str
    source_url: str
    license_name: str
    license_url: str
    default_visible: bool
    feature_limit: int


class LayerRepository:
    def list_layers(self, connection: Connection) -> list[LayerSource]:
        rows = connection.execute(
            text(
                """
                SELECT id, name, description, source_schema, source_table,
                       geometry_column, geometry_type, feature_id_column,
                       fields, style, attribution, source_url, license_name,
                       license_url, default_visible, feature_limit
                FROM core.layers
                ORDER BY name, id
                """
            )
        )
        return [self._to_source(dict(row._mapping)) for row in rows]

    def get_layer(self, connection: Connection, layer_id: str) -> LayerSource | None:
        row = (
            connection.execute(
                text(
                    """
                SELECT id, name, description, source_schema, source_table,
                       geometry_column, geometry_type, feature_id_column,
                       fields, style, attribution, source_url, license_name,
                       license_url, default_visible, feature_limit
                FROM core.layers
                WHERE id = :layer_id
                """
                ),
                {"layer_id": layer_id},
            )
            .mappings()
            .one_or_none()
        )
        return self._to_source(dict(row)) if row else None

    def get_features(
        self,
        connection: Connection,
        layer: LayerSource,
        bbox: tuple[float, float, float, float],
        limit: int,
    ) -> tuple[list[dict[str, Any]], bool]:
        identifiers = [
            layer.source_schema,
            layer.source_table,
            layer.geometry_column,
            layer.feature_id_column,
            *(field["name"] for field in layer.fields),
        ]
        for identifier in identifiers:
            self._validate_identifier(identifier)

        publishable_fields = ", ".join(
            f"'{field['name']}', source.{field['name']}" for field in layer.fields
        )
        query = text(
            f"""
            WITH viewport AS (
                SELECT ST_MakeEnvelope(:west, :south, :east, :north, 4326) AS geometry
            )
            SELECT source.{layer.feature_id_column}::text AS feature_id,
                   jsonb_build_object({publishable_fields}) AS properties,
                   ST_AsGeoJSON(source.{layer.geometry_column}, 6)::jsonb AS geometry
            FROM {layer.source_schema}.{layer.source_table} AS source
            CROSS JOIN viewport
            WHERE source.{layer.geometry_column} && viewport.geometry
              AND ST_Intersects(source.{layer.geometry_column}, viewport.geometry)
            ORDER BY source.{layer.feature_id_column}
            LIMIT :fetch_limit
            """
        )
        west, south, east, north = bbox
        rows = connection.execute(
            query,
            {
                "west": west,
                "south": south,
                "east": east,
                "north": north,
                "fetch_limit": limit + 1,
            },
        ).mappings()
        found = [
            {
                "type": "Feature",
                "id": row["feature_id"],
                "properties": row["properties"],
                "geometry": row["geometry"],
            }
            for row in rows
        ]
        return found[:limit], len(found) > limit

    @staticmethod
    def _validate_identifier(identifier: str) -> None:
        if not IDENTIFIER_PATTERN.fullmatch(identifier):
            raise ValueError(f"Invalid catalog identifier: {identifier!r}")

    @staticmethod
    def _to_source(row: dict[str, Any]) -> LayerSource:
        return LayerSource(**row)
