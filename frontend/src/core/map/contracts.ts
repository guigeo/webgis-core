import type {
  LayerDefinition,
  LayerFeatureCollection,
  LayerSelection,
} from '../layers/contracts'

export type MapCoordinate = readonly [longitude: number, latitude: number]

export type MapBounds = readonly [
  southwest: MapCoordinate,
  northeast: MapCoordinate,
]

export interface BasemapDefinition {
  id: string
  name: string
  tiles: string[]
  tileSize: 256 | 512
  maxZoom: number
  attribution: string
  termsUrl: string
}

export interface MapSettings {
  center: MapCoordinate
  zoom: number
  minZoom: number
  maxZoom: number
  homeBounds: MapBounds
  basemap: BasemapDefinition
}

export interface MapViewState {
  center: MapCoordinate
  pointer: MapCoordinate | null
  zoom: number
}

export type MapLoadState = 'loading' | 'ready' | 'error'

export interface MapAdapterEvents {
  onError: (error: Error) => void
  onFeatureSelect: (selection: LayerSelection | null) => void
  onReady: () => void
  onViewChange: (view: MapViewState) => void
  onViewportChange: (bounds: MapBounds) => void
}

export interface MapAdapter {
  initialize(
    container: HTMLElement,
    fullscreenContainer: HTMLElement,
    events: MapAdapterEvents,
  ): void
  destroy(): void
  goHome(): void
  fitHomeBounds(): void
  toggleFullscreen(): Promise<void>
  setLayerData(
    layer: LayerDefinition,
    features: LayerFeatureCollection,
    opacity: number,
  ): void
  clearLayer(layerId: string): void
  setLayerOpacity(layerId: string, opacity: number): void
  setLayerOrder(layerIds: string[]): void
}

export type MapAdapterFactory = (settings: MapSettings) => MapAdapter
