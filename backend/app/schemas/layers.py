from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class LayerField(BaseModel):
    name: str
    label: str
    type: Literal["string", "number", "boolean"]
    popup: Literal["title", "detail", "hidden"]


class FillLayerStyle(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    kind: Literal["fill"]
    fill_color: str = Field(alias="fillColor")
    fill_opacity: float = Field(alias="fillOpacity")
    line_color: str = Field(alias="lineColor")
    line_width: float = Field(alias="lineWidth")
    selected_fill_color: str = Field(alias="selectedFillColor")
    selected_line_color: str = Field(alias="selectedLineColor")
    selected_line_width: float = Field(alias="selectedLineWidth")


class CircleLayerStyle(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    kind: Literal["circle"]
    circle_color: str = Field(alias="circleColor")
    circle_radius: float = Field(alias="circleRadius")
    stroke_color: str = Field(alias="strokeColor")
    stroke_width: float = Field(alias="strokeWidth")
    selected_color: str = Field(alias="selectedColor")
    selected_radius: float = Field(alias="selectedRadius")
    selected_stroke_color: str = Field(alias="selectedStrokeColor")
    selected_stroke_width: float = Field(alias="selectedStrokeWidth")


LayerStyle = Annotated[FillLayerStyle | CircleLayerStyle, Field(discriminator="kind")]


class LayerMetadata(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    summary: str
    updated_at: str = Field(alias="updatedAt")
    feature_count: int = Field(alias="featureCount")


class LayerDefinition(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    description: str
    group_name: str = Field(alias="groupName")
    sort_order: int = Field(alias="sortOrder")
    geometry_type: str = Field(alias="geometryType")
    fields: list[LayerField]
    style: LayerStyle
    attribution: str
    source_url: str = Field(alias="sourceUrl")
    license_name: str = Field(alias="licenseName")
    license_url: str = Field(alias="licenseUrl")
    default_visible: bool = Field(alias="defaultVisible")
    default_opacity: float = Field(alias="defaultOpacity")
    feature_limit: int = Field(alias="featureLimit")
    metadata: LayerMetadata


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
