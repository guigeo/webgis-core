import math
from dataclasses import asdict
from typing import Any

from sqlalchemy import Engine

from app.repositories.layers import LayerRepository, LayerSource


class LayerNotFoundError(Exception):
    pass


class InvalidFeatureQueryError(ValueError):
    pass


class LayerService:
    def __init__(self, engine: Engine, repository: LayerRepository | None = None) -> None:
        self.engine = engine
        self.repository = repository or LayerRepository()

    def list_layers(self) -> list[dict[str, Any]]:
        with self.engine.connect() as connection:
            layers = self.repository.list_layers(connection)
        return [self._public_definition(layer) for layer in layers]

    def get_features(
        self,
        layer_id: str,
        bbox_value: str,
        limit: int,
    ) -> dict[str, Any]:
        bbox = parse_bbox(bbox_value)
        with self.engine.connect() as connection:
            layer = self.repository.get_layer(connection, layer_id)
            if layer is None:
                raise LayerNotFoundError(layer_id)
            if limit > layer.feature_limit:
                raise InvalidFeatureQueryError(
                    f"limit deve ser menor ou igual a {layer.feature_limit} para esta camada"
                )
            features, truncated = self.repository.get_features(connection, layer, bbox, limit)

        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "layerId": layer.id,
                "returned": len(features),
                "limit": limit,
                "truncated": truncated,
            },
        }

    @staticmethod
    def _public_definition(layer: LayerSource) -> dict[str, Any]:
        private_fields = {
            "source_schema",
            "source_table",
            "geometry_column",
            "feature_id_column",
        }
        definition = asdict(layer)
        for field in private_fields:
            definition.pop(field)
        return definition


def parse_bbox(value: str) -> tuple[float, float, float, float]:
    try:
        parts = tuple(float(part.strip()) for part in value.split(","))
    except ValueError as error:
        raise InvalidFeatureQueryError(
            "bbox deve conter quatro números separados por vírgula"
        ) from error

    if len(parts) != 4 or not all(math.isfinite(part) for part in parts):
        raise InvalidFeatureQueryError("bbox deve conter quatro números finitos")

    west, south, east, north = parts
    if not (-180 <= west <= 180 and -180 <= east <= 180):
        raise InvalidFeatureQueryError("longitudes de bbox devem estar entre -180 e 180")
    if not (-90 <= south <= 90 and -90 <= north <= 90):
        raise InvalidFeatureQueryError("latitudes de bbox devem estar entre -90 e 90")
    if west >= east or south >= north:
        raise InvalidFeatureQueryError("bbox deve seguir west,south,east,north")
    return west, south, east, north
