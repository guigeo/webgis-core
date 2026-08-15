import type { Feature, FeatureCollection, Geometry } from 'geojson'

export interface LayerFieldDefinition {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean'
}

export interface LayerStyleDefinition {
  fillColor: string
  fillOpacity: number
  lineColor: string
  lineWidth: number
  selectedFillColor: string
  selectedLineColor: string
  selectedLineWidth: number
}

export interface LayerDefinition {
  id: string
  name: string
  description: string
  geometryType: string
  fields: LayerFieldDefinition[]
  style: LayerStyleDefinition
  attribution: string
  sourceUrl: string
  licenseName: string
  licenseUrl: string
  defaultVisible: boolean
  featureLimit: number
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
