import type { FilterSpecification } from '@maplibre/maplibre-gl-style-spec'
import {
  GeoJSONSource,
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  ScaleControl,
  setWorkerUrl,
  type ErrorEvent as MapLibreErrorEvent,
  type LngLatBoundsLike,
  type MapLayerMouseEvent,
  type MapMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl'
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

import type {
  LayerDefinition,
  LayerFeatureCollection,
  LayerProperties,
} from '../layers/contracts'
import type {
  MapAdapter,
  MapAdapterEvents,
  MapAdapterFactory,
  MapSettings,
} from './contracts'

const BASEMAP_SOURCE_ID = 'core-basemap-source'
const BASEMAP_LAYER_ID = 'core-basemap-layer'
const EMPTY_SELECTION_FILTER: FilterSpecification = ['==', ['id'], '']

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

function layerIds(layerId: string) {
  return {
    source: `core-layer-source-${layerId}`,
    main: `core-layer-main-${layerId}`,
    outline: `core-layer-outline-${layerId}`,
    selected: `core-layer-selected-${layerId}`,
    selectedOutline: `core-layer-selected-outline-${layerId}`,
  }
}

export function createFeaturePopupContent(
  layer: LayerDefinition,
  properties: LayerProperties,
) {
  const content = document.createElement('article')
  content.className = 'core-feature-popup'

  const eyebrow = document.createElement('p')
  eyebrow.className = 'core-feature-popup__eyebrow'
  eyebrow.textContent = layer.name
  content.append(eyebrow)

  const titleField = layer.fields.find((field) => field.popup === 'title')
  const title = document.createElement('h2')
  title.className = 'core-feature-popup__title'
  title.textContent = String(
    (titleField ? properties[titleField.name] : null) ?? 'Feição selecionada',
  )
  content.append(title)

  const details = document.createElement('dl')
  details.className = 'core-feature-popup__details'
  for (const field of layer.fields.filter(
    (candidate) => candidate.popup === 'detail',
  )) {
    const row = document.createElement('div')
    const label = document.createElement('dt')
    const value = document.createElement('dd')
    label.textContent = field.label
    value.textContent = String(properties[field.name] ?? '—')
    row.append(label, value)
    details.append(row)
  }
  content.append(details)
  return content
}

interface LayerRegistration {
  click: (event: MapLayerMouseEvent) => void
  definition: LayerDefinition
  enter: () => void
  interactiveLayerId: string
  leave: () => void
  ids: ReturnType<typeof layerIds>
  renderLayerIds: string[]
  selectedLayerIds: string[]
}

export class MapLibreMapAdapter implements MapAdapter {
  private map: MapLibreMap | null = null
  private events: MapAdapterEvents | null = null
  private fullscreenContainer: HTMLElement | null = null
  private pointer: MapViewStatePointer | null = null
  private loadTimeout: ReturnType<typeof setTimeout> | null = null
  private readonly layers = new Map<string, LayerRegistration>()
  private popup: Popup | null = null
  private selectedLayerId: string | null = null
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
      map.on('moveend', this.handleMoveEnd)
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
    this.clearSelection()
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
    this.map.off('moveend', this.handleMoveEnd)
    this.map.off('mousemove', this.handleMouseMove)
    this.map.off('mouseout', this.handleMouseOut)
    for (const registration of this.layers.values()) {
      this.removeLayerListeners(registration)
    }
    this.layers.clear()
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

  setLayerData(
    layer: LayerDefinition,
    features: LayerFeatureCollection,
    opacity: number,
  ) {
    const map = this.map
    if (!map || !this.ready) return

    const ids = layerIds(layer.id)
    const existingSource = map.getSource(ids.source)
    if (existingSource instanceof GeoJSONSource) {
      existingSource.setData(features)
      if (
        this.selectedLayerId === layer.id &&
        !features.features.some(
          (feature) => String(feature.id) === this.selectedFeatureId,
        )
      ) {
        this.clearSelection()
      }
      this.setLayerOpacity(layer.id, opacity)
      return
    }

    map.addSource(ids.source, {
      type: 'geojson',
      data: features,
      attribution: layer.attribution,
    })
    const { renderLayerIds, selectedLayerIds } = this.addPresentationLayers(
      layer,
      ids,
    )

    const click = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (feature?.id === undefined) return

      const featureId = String(feature.id)
      this.selectFeature(layer, featureId, feature.properties ?? {}, event)
    }
    const enter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const leave = () => {
      map.getCanvas().style.cursor = ''
    }
    const registration = {
      click,
      definition: layer,
      enter,
      interactiveLayerId: ids.main,
      leave,
      ids,
      renderLayerIds,
      selectedLayerIds,
    }
    map.on('click', registration.interactiveLayerId, click)
    map.on('mouseenter', registration.interactiveLayerId, enter)
    map.on('mouseleave', registration.interactiveLayerId, leave)
    this.layers.set(layer.id, registration)
    this.setLayerOpacity(layer.id, opacity)
  }

  clearLayer(layerId: string) {
    const map = this.map
    const registration = this.layers.get(layerId)
    if (!map || !registration) return

    if (this.selectedLayerId === layerId) this.clearSelection()
    this.removeLayerListeners(registration)
    for (const id of [...registration.renderLayerIds].reverse()) {
      if (map.getLayer(id)) map.removeLayer(id)
    }
    if (map.getSource(registration.ids.source)) {
      map.removeSource(registration.ids.source)
    }
    this.layers.delete(layerId)
  }

  setLayerOpacity(layerId: string, opacity: number) {
    const map = this.map
    const registration = this.layers.get(layerId)
    if (!map || !registration) return

    const normalizedOpacity = Math.min(1, Math.max(0, opacity))
    const { definition, ids } = registration
    if (definition.style.kind === 'fill') {
      map.setPaintProperty(
        ids.main,
        'fill-opacity',
        definition.style.fillOpacity * normalizedOpacity,
      )
      map.setPaintProperty(ids.outline, 'line-opacity', normalizedOpacity)
      map.setPaintProperty(
        ids.selected,
        'fill-opacity',
        0.54 * normalizedOpacity,
      )
      map.setPaintProperty(
        ids.selectedOutline,
        'line-opacity',
        normalizedOpacity,
      )
      return
    }

    map.setPaintProperty(ids.main, 'circle-opacity', normalizedOpacity)
    map.setPaintProperty(ids.main, 'circle-stroke-opacity', normalizedOpacity)
    map.setPaintProperty(ids.selected, 'circle-opacity', normalizedOpacity)
    map.setPaintProperty(
      ids.selected,
      'circle-stroke-opacity',
      normalizedOpacity,
    )
  }

  setLayerOrder(layerIds: string[]) {
    const map = this.map
    if (!map) return

    for (const layerId of [...layerIds].reverse()) {
      const registration = this.layers.get(layerId)
      for (const renderLayerId of registration?.renderLayerIds ?? []) {
        if (map.getLayer(renderLayerId)) map.moveLayer(renderLayerId)
      }
    }
  }

  private addPresentationLayers(
    layer: LayerDefinition,
    ids: ReturnType<typeof layerIds>,
  ) {
    const map = this.map
    if (!map) return { renderLayerIds: [], selectedLayerIds: [] }

    if (layer.style.kind === 'fill') {
      map.addLayer({
        id: ids.main,
        type: 'fill',
        source: ids.source,
        paint: {
          'fill-color': layer.style.fillColor,
          'fill-opacity': layer.style.fillOpacity,
        },
      })
      map.addLayer({
        id: ids.outline,
        type: 'line',
        source: ids.source,
        paint: {
          'line-color': layer.style.lineColor,
          'line-width': layer.style.lineWidth,
        },
      })
      map.addLayer({
        id: ids.selected,
        type: 'fill',
        source: ids.source,
        filter: EMPTY_SELECTION_FILTER,
        paint: {
          'fill-color': layer.style.selectedFillColor,
          'fill-opacity': 0.54,
        },
      })
      map.addLayer({
        id: ids.selectedOutline,
        type: 'line',
        source: ids.source,
        filter: EMPTY_SELECTION_FILTER,
        paint: {
          'line-color': layer.style.selectedLineColor,
          'line-width': layer.style.selectedLineWidth,
        },
      })
      return {
        renderLayerIds: [
          ids.main,
          ids.outline,
          ids.selected,
          ids.selectedOutline,
        ],
        selectedLayerIds: [ids.selected, ids.selectedOutline],
      }
    }

    map.addLayer({
      id: ids.main,
      type: 'circle',
      source: ids.source,
      paint: {
        'circle-color': layer.style.circleColor,
        'circle-radius': layer.style.circleRadius,
        'circle-stroke-color': layer.style.strokeColor,
        'circle-stroke-width': layer.style.strokeWidth,
      },
    })
    map.addLayer({
      id: ids.selected,
      type: 'circle',
      source: ids.source,
      filter: EMPTY_SELECTION_FILTER,
      paint: {
        'circle-color': layer.style.selectedColor,
        'circle-radius': layer.style.selectedRadius,
        'circle-stroke-color': layer.style.selectedStrokeColor,
        'circle-stroke-width': layer.style.selectedStrokeWidth,
      },
    })
    return {
      renderLayerIds: [ids.main, ids.selected],
      selectedLayerIds: [ids.selected],
    }
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
    this.emitViewport()
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

  private readonly handleMoveEnd = () => this.emitViewport()

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

  private selectedFeatureId: string | null = null

  private selectFeature(
    layer: LayerDefinition,
    featureId: string,
    properties: LayerProperties,
    event: MapLayerMouseEvent,
  ) {
    const map = this.map
    if (!map) return

    this.clearSelection()
    const selectionFilter: FilterSpecification = ['==', ['id'], featureId]
    const registration = this.layers.get(layer.id)
    for (const selectedLayerId of registration?.selectedLayerIds ?? []) {
      map.setFilter(selectedLayerId, selectionFilter)
    }
    this.selectedLayerId = layer.id
    this.selectedFeatureId = featureId

    const popup = new Popup({ offset: 12, closeButton: true })
      .setLngLat(event.lngLat)
      .setDOMContent(createFeaturePopupContent(layer, properties))
      .addTo(map)
    popup.on('close', () => {
      if (this.popup !== popup) return
      this.popup = null
      this.resetSelectionFilter(layer.id)
      this.events?.onFeatureSelect(null)
    })
    this.popup = popup
    this.events?.onFeatureSelect({
      layerId: layer.id,
      featureId,
      properties,
    })
  }

  private clearSelection() {
    const popup = this.popup
    this.popup = null
    popup?.remove()
    if (this.selectedLayerId) {
      this.resetSelectionFilter(this.selectedLayerId)
    }
    if (this.selectedLayerId || this.selectedFeatureId) {
      this.events?.onFeatureSelect(null)
    }
    this.selectedLayerId = null
    this.selectedFeatureId = null
  }

  private resetSelectionFilter(layerId: string) {
    const map = this.map
    const registration = this.layers.get(layerId)
    if (!map || !registration) return

    for (const selectedLayerId of registration.selectedLayerIds) {
      if (map.getLayer(selectedLayerId)) {
        map.setFilter(selectedLayerId, EMPTY_SELECTION_FILTER)
      }
    }
  }

  private removeLayerListeners(registration: LayerRegistration) {
    const map = this.map
    if (!map) return

    map.off('click', registration.interactiveLayerId, registration.click)
    map.off('mouseenter', registration.interactiveLayerId, registration.enter)
    map.off('mouseleave', registration.interactiveLayerId, registration.leave)
  }

  private emitViewport() {
    if (!this.map || !this.events) return

    const bounds = this.map.getBounds()
    this.events.onViewportChange([
      [bounds.getWest(), bounds.getSouth()],
      [bounds.getEast(), bounds.getNorth()],
    ])
  }

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
