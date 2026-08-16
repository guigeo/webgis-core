import {
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type ErrorEvent as MapLibreErrorEvent,
  type LngLatBoundsLike,
  type MapMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl'
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

import type {
  MapAdapter,
  MapAdapterEvents,
  MapAdapterFactory,
  MapSettings,
} from './contracts'

const BASEMAP_SOURCE_ID = 'core-basemap-source'
const BASEMAP_LAYER_ID = 'core-basemap-layer'

setWorkerUrl(mapLibreWorkerUrl)

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
  private loadTimeout: ReturnType<typeof setTimeout> | null = null
  private ready = false

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
      const { width, height } = container.getBoundingClientRect()

      if (width === 0 || height === 0) {
        throw new Error(
          `A área do mapa está sem dimensões (${Math.round(width)} × ${Math.round(height)} px)`,
        )
      }

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
      map.on('error', this.handleError)
      map.on('move', this.handleMove)
      map.on('mousemove', this.handleMouseMove)
      map.on('mouseout', this.handleMouseOut)
      document.addEventListener('fullscreenchange', this.handleFullscreenChange)
      this.loadTimeout = setTimeout(() => {
        if (!this.ready) {
          this.events?.onError(
            new Error(
              'O mapa não concluiu o primeiro carregamento em 15 segundos',
            ),
          )
        }
      }, 15_000)
    } catch (error) {
      this.map = null
      events.onError(
        error instanceof Error ? error : new Error('Falha ao iniciar o mapa'),
      )
    }
  }

  destroy() {
    this.clearLoadTimeout()
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
    this.map.off('error', this.handleError)
    this.map.off('move', this.handleMove)
    this.map.off('mousemove', this.handleMouseMove)
    this.map.off('mouseout', this.handleMouseOut)
    this.map.remove()
    this.map = null
    this.events = null
    this.fullscreenContainer = null
    this.pointer = null
    this.ready = false
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
    this.ready = true
    this.clearLoadTimeout()
    this.events?.onReady()
    this.emitView()
  }

  private readonly handleError = (event: MapLibreErrorEvent) => {
    if (this.ready) return

    this.clearLoadTimeout()
    this.events?.onError(new Error(event.error.message))
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

  private clearLoadTimeout() {
    if (this.loadTimeout === null) return

    clearTimeout(this.loadTimeout)
    this.loadTimeout = null
  }
}

interface MapViewStatePointer {
  longitude: number
  latitude: number
}

export const createMapLibreMapAdapter: MapAdapterFactory = (settings) =>
  new MapLibreMapAdapter(settings)
