from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.layers import get_layer_service
from app.main import app
from app.schemas.layers import LayerDefinition
from app.services.layers import InvalidFeatureQueryError, LayerNotFoundError

client = TestClient(app)


class StubLayerService:
    def list_layers(self) -> list[dict[str, Any]]:
        return [
            {
                "id": "ibge-rmsp-municipalities",
                "name": "Municípios da RMSP",
                "description": "Limites municipais",
                "group_name": "Referência territorial",
                "sort_order": 10,
                "geometry_type": "MultiPolygon",
                "fields": [
                    {
                        "name": "name",
                        "label": "Município",
                        "type": "string",
                        "popup": "title",
                    },
                ],
                "style": {
                    "kind": "fill",
                    "fillColor": "#175CD3",
                    "fillOpacity": 0.24,
                    "lineColor": "#175CD3",
                    "lineWidth": 1.4,
                    "selectedFillColor": "#F79009",
                    "selectedLineColor": "#B54708",
                    "selectedLineWidth": 3,
                },
                "attribution": "Fonte: IBGE",
                "source_url": "https://servicodados.ibge.gov.br/",
                "license_name": "Dados abertos do IBGE",
                "license_url": "https://www.ibge.gov.br/",
                "default_visible": True,
                "default_opacity": 1,
                "feature_limit": 50,
                "metadata": {
                    "summary": "Limites municipais",
                    "updatedAt": "2026-08-15",
                    "featureCount": 39,
                },
            }
        ]

    def get_features(self, layer_id: str, bbox: str, limit: int) -> dict[str, Any]:
        if layer_id == "missing":
            raise LayerNotFoundError(layer_id)
        if limit > 50:
            raise InvalidFeatureQueryError("limit deve ser menor ou igual a 50")
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "id": "3550308",
                    "properties": {"name": "São Paulo"},
                    "geometry": {"type": "Polygon", "coordinates": []},
                }
            ],
            "metadata": {
                "layerId": layer_id,
                "returned": 1,
                "limit": limit,
                "truncated": False,
            },
        }


@pytest.fixture(autouse=True)
def override_layer_service():
    app.dependency_overrides[get_layer_service] = StubLayerService
    yield
    app.dependency_overrides.clear()


def test_catalog_exposes_public_definition_without_database_identifiers() -> None:
    response = client.get("/api/layers")

    assert response.status_code == 200
    layer = response.json()[0]
    assert layer["id"] == "ibge-rmsp-municipalities"
    assert layer["groupName"] == "Referência territorial"
    assert layer["featureLimit"] == 50
    assert "source_table" not in layer
    assert layer["style"]["selectedFillColor"] == "#F79009"


def test_features_return_stable_id_and_query_metadata() -> None:
    response = client.get(
        "/api/layers/ibge-rmsp-municipalities/features",
        params={"bbox": "-47,-24,-46,-23", "limit": 50},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["features"][0]["id"] == "3550308"
    assert body["metadata"] == {
        "layerId": "ibge-rmsp-municipalities",
        "returned": 1,
        "limit": 50,
        "truncated": False,
    }


def test_features_reject_unknown_layer() -> None:
    response = client.get(
        "/api/layers/missing/features",
        params={"bbox": "-47,-24,-46,-23"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Layer not found"}


def test_features_reject_limit_above_catalog_policy() -> None:
    response = client.get(
        "/api/layers/ibge-rmsp-municipalities/features",
        params={"bbox": "-47,-24,-46,-23", "limit": 51},
    )

    assert response.status_code == 422
    assert response.json() == {"detail": "limit deve ser menor ou igual a 50"}


def test_catalog_contract_accepts_circle_style_without_layer_specific_schema() -> None:
    definition = StubLayerService().list_layers()[0]
    definition["geometry_type"] = "Point"
    definition["style"] = {
        "kind": "circle",
        "circleColor": "#0E9384",
        "circleRadius": 5,
        "strokeColor": "#FFFFFF",
        "strokeWidth": 1.5,
        "selectedColor": "#F79009",
        "selectedRadius": 9,
        "selectedStrokeColor": "#B54708",
        "selectedStrokeWidth": 2,
    }

    serialized = LayerDefinition.model_validate(definition).model_dump(by_alias=True)

    assert serialized["geometryType"] == "Point"
    assert serialized["style"]["kind"] == "circle"
