from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import get_engine
from app.schemas.layers import GeoJsonFeatureCollection, LayerDefinition
from app.services.layers import (
    InvalidFeatureQueryError,
    LayerNotFoundError,
    LayerService,
)

router = APIRouter(prefix="/layers", tags=["layers"])


def get_layer_service() -> LayerService:
    return LayerService(get_engine())


@router.get("", response_model=list[LayerDefinition], response_model_by_alias=True)
def list_layers(service: Annotated[LayerService, Depends(get_layer_service)]) -> list[dict]:
    return service.list_layers()


@router.get(
    "/{layer_id}/features",
    response_model=GeoJsonFeatureCollection,
    response_model_by_alias=True,
)
def get_layer_features(
    layer_id: str,
    bbox: Annotated[str, Query(description="west,south,east,north em EPSG:4326")],
    service: Annotated[LayerService, Depends(get_layer_service)],
    limit: Annotated[int, Query(ge=1)] = 100,
) -> dict:
    try:
        return service.get_features(layer_id, bbox, limit)
    except LayerNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Layer not found",
        ) from error
    except InvalidFeatureQueryError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
