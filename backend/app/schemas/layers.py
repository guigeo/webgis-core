from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class LayerField(BaseModel):
    name: str
    label: str
    type: Literal["string", "number", "boolean"]


class LayerStyle(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    fill_color: str = Field(alias="fillColor")
    fill_opacity: float = Field(alias="fillOpacity")
    line_color: str = Field(alias="lineColor")
    line_width: float = Field(alias="lineWidth")
    selected_fill_color: str = Field(alias="selectedFillColor")
    selected_line_color: str = Field(alias="selectedLineColor")
    selected_line_width: float = Field(alias="selectedLineWidth")


class LayerDefinition(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    description: str
    geometry_type: str = Field(alias="geometryType")
    fields: list[LayerField]
    style: LayerStyle
    attribution: str
    source_url: str = Field(alias="sourceUrl")
    license_name: str = Field(alias="licenseName")
    license_url: str = Field(alias="licenseUrl")
    default_visible: bool = Field(alias="defaultVisible")
    feature_limit: int = Field(alias="featureLimit")


class GeoJsonFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: str
    properties: dict[str, Any]
    geometry: dict[str, Any]


class FeatureCollectionMetadata(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    layer_id: str = Field(alias="layerId")
    returned: int
    limit: int
    truncated: bool


class GeoJsonFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[GeoJsonFeature]
    metadata: FeatureCollectionMetadata
