import {
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  type LngLatBoundsLike,
  type MapMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl'

import type {
  MapAdapter,
  MapAdapterEvents,
  MapAdapterFactory,
  MapSettings,
} from './contracts'

const BASEMAP_SOURCE_ID = 'core-basemap-source'
const BASEMAP_LAYER_ID = 'core-basemap-layer'

function createBasemapStyle(settings: MapSettings): StyleSpecification {
  return {
    version: 8,
    sources: {
      [BASEMAP_SOURCE_ID]: {
        type: 'raster',
        tiles: settings.basemap.tiles,
        tileSize: settings.basemap.tileSize,
        maxzoom: settings.basemap.maxZoom,
        attribution: settings.basemap.attribution,
      },
    },
    layers: [
      {
        id: BASEMAP_LAYER_ID,
        type: 'raster',
        source: BASEMAP_SOURCE_ID,
      },
    ],
  }
}

export class MapLibreMapAdapter implements MapAdapter {
  private map: MapLibreMap | null = null
  private events: MapAdapterEvents | null = null
  private fullscreenContainer: HTMLElement | null = null
  private pointer: MapViewStatePointer | null = null

  constructor(private readonly settings: MapSettings) {}

  initialize(
    container: HTMLElement,
    fullscreenContainer: HTMLElement,
    events: MapAdapterEvents,
  ) {
    if (this.map) {
      throw new Error('O adaptador de mapa já foi inicializado')
    }

    this.events = events
    this.fullscreenContainer = fullscreenContainer

    try {
      const map = new MapLibreMap({
        container,
        style: createBasemapStyle(this.settings),
        center: [...this.settings.center],
        zoom: this.settings.zoom,
        minZoom: this.settings.minZoom,
        maxZoom: this.settings.maxZoom,
      })

      this.map = map
      map.addControl(
        new NavigationControl({ showCompass: false, showZoom: true }),
        'top-right',
      )
      map.addControl(
        new ScaleControl({ maxWidth: 120, unit: 'metric' }),
        'bottom-left',
      )

      map.on('load', this.handleLoad)
      map.on('move', this.handleMove)
      map.on('mousemove', this.handleMouseMove)
      map.on('mouseout', this.handleMouseOut)
      document.addEventListener('fullscreenchange', this.handleFullscreenChange)
    } catch (error) {
      this.map = null
      events.onError(
        error instanceof Error ? error : new Error('Falha ao iniciar o mapa'),
      )
    }
  }

  destroy() {
    document.removeEventListener(
      'fullscreenchange',
      this.handleFullscreenChange,
    )

    if (!this.map) {
      this.events = null
      this.fullscreenContainer = null
      return
    }

    this.map.off('load', this.handleLoad)
    this.map.off('move', this.handleMove)
    this.map.off('mousemove', this.handleMouseMove)
    this.map.off('mouseout', this.handleMouseOut)
    this.map.remove()
    this.map = null
    this.events = null
    this.fullscreenContainer = null
    this.pointer = null
  }

  goHome() {
    this.map?.easeTo({
      center: [...this.settings.center],
      zoom: this.settings.zoom,
      duration: 500,
    })
  }

  fitHomeBounds() {
    this.map?.fitBounds(this.settings.homeBounds as LngLatBoundsLike, {
      padding: 48,
      duration: 500,
    })
  }

  async toggleFullscreen() {
    const container = this.fullscreenContainer

    if (!container) return

    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    if (!container.requestFullscreen) {
      throw new Error('Tela cheia não é suportada neste navegador')
    }

    await container.requestFullscreen()
  }

  private readonly emitView = () => {
    if (!this.map || !this.events) return

    const center = this.map.getCenter()

    this.events.onViewChange({
      center: [center.lng, center.lat],
      pointer: this.pointer
        ? [this.pointer.longitude, this.pointer.latitude]
        : null,
      zoom: this.map.getZoom(),
    })
  }

  private readonly handleLoad = () => {
    this.events?.onReady()
    this.emitView()
  }

  private readonly handleMove = () => {
    if (!this.map || !this.events) return

    const center = this.map.getCenter()
    this.events.onViewChange({
      center: [center.lng, center.lat],
      pointer: this.pointer
        ? [this.pointer.longitude, this.pointer.latitude]
        : null,
      zoom: this.map.getZoom(),
    })
  }

  private readonly handleMouseMove = (event: MapMouseEvent) => {
    this.pointer = {
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
    }
    this.emitView()
  }

  private readonly handleMouseOut = () => {
    this.pointer = null
    this.emitView()
  }

  private readonly handleFullscreenChange = () => this.map?.resize()
}

interface MapViewStatePointer {
  longitude: number
  latitude: number
}

export const createMapLibreMapAdapter: MapAdapterFactory = (settings) =>
  new MapLibreMapAdapter(settings)
