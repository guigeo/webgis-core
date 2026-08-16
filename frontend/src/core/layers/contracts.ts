import type { Feature, FeatureCollection, Geometry } from 'geojson'

export interface LayerFieldDefinition {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean'
  popup: 'title' | 'detail' | 'hidden'
}

export interface FillLayerStyleDefinition {
  kind: 'fill'
  fillColor: string
  fillOpacity: number
  lineColor: string
  lineWidth: number
  selectedFillColor: string
  selectedLineColor: string
  selectedLineWidth: number
}

export interface CircleLayerStyleDefinition {
  kind: 'circle'
  circleColor: string
  circleRadius: number
  strokeColor: string
  strokeWidth: number
  selectedColor: string
  selectedRadius: number
  selectedStrokeColor: string
  selectedStrokeWidth: number
}

export type LayerStyleDefinition =
  FillLayerStyleDefinition | CircleLayerStyleDefinition

export interface LayerMetadata {
  summary: string
  updatedAt: string
  featureCount: number
}

export interface LayerDefinition {
  id: string
  name: string
  description: string
  groupName: string
  sortOrder: number
  geometryType: string
  fields: LayerFieldDefinition[]
  style: LayerStyleDefinition
  attribution: string
  sourceUrl: string
  licenseName: string
  licenseUrl: string
  defaultVisible: boolean
  defaultOpacity: number
  featureLimit: number
  metadata: LayerMetadata
}

export type LayerProperties = Record<string, string | number | boolean | null>

export type LayerFeature = Feature<Geometry, LayerProperties> & { id: string }

export interface LayerFeatureCollection extends FeatureCollection<
  Geometry,
  LayerProperties
> {
  features: LayerFeature[]
  metadata: {
    layerId: string
    returned: number
    limit: number
    truncated: boolean
  }
}

export interface LayerSelection {
  layerId: string
  featureId: string
  properties: LayerProperties
}

export type LayerLoadState = 'idle' | 'loading' | 'ready' | 'error'

export interface LayerRuntimeState {
  visible: boolean
  opacity: number
  loadState: LayerLoadState
  errorMessage: string | null
}
