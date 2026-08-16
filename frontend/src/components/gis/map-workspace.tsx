import { AlertTriangle, LoaderCircle, Map as MapIcon } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import { useAppConfig } from '../../config/context'
import type {
  LayerDefinition,
  LayerFeatureCollection,
} from '../../core/layers/contracts'
import { useLayerStore } from '../../core/layers/store'
import type { MapAdapterFactory, MapBounds } from '../../core/map/contracts'
import { createMapLibreMapAdapter } from '../../core/map/maplibre-map-adapter'
import { useMapCore } from '../../core/map/use-map-core'
import { useLayerFeaturesQuery } from '../../services/layers'
import { MeasurementPanel } from './measurement-panel'
import { StatusBar } from '../shell/status-bar'
import { Toolbar } from '../shell/toolbar'
import type { ServiceStatus } from '../shell/types'

interface LayerControllerProps {
  bounds: MapBounds | null
  clearLayer: (layerId: string) => void
  layer: LayerDefinition
  mapReady: boolean
  orderedVisibleIds: string[]
  setLayerData: (
    layer: LayerDefinition,
    features: LayerFeatureCollection,
    opacity: number,
  ) => void
  setLayerOpacity: (layerId: string, opacity: number) => void
  setLayerOrder: (layerIds: string[]) => void
}

function LayerController({
  bounds,
  clearLayer,
  layer,
  mapReady,
  orderedVisibleIds,
  setLayerData,
  setLayerOpacity,
  setLayerOrder,
}: LayerControllerProps) {
  const runtime = useLayerStore((state) => state.runtime[layer.id])
  const setLoadState = useLayerStore((state) => state.setLoadState)
  const visible = runtime?.visible ?? false
  const opacity = runtime?.opacity ?? layer.defaultOpacity
  const features = useLayerFeaturesQuery(layer, bounds, mapReady && visible)

  useEffect(() => {
    if (!visible) {
      clearLayer(layer.id)
      setLoadState(layer.id, 'idle')
      return
    }
    if (features.isError) {
      setLoadState(layer.id, 'error', features.error.message)
      return
    }
    if (features.isFetching && !features.data) {
      setLoadState(layer.id, 'loading')
      return
    }
    if (features.data && mapReady) {
      setLayerData(layer, features.data, opacity)
      setLayerOrder(orderedVisibleIds)
      setLoadState(layer.id, 'ready')
    }
  }, [
    clearLayer,
    features.data,
    features.error,
    features.isError,
    features.isFetching,
    layer,
    mapReady,
    opacity,
    orderedVisibleIds,
    setLayerData,
    setLayerOrder,
    setLoadState,
    visible,
  ])

  useEffect(() => {
    if (visible) setLayerOpacity(layer.id, opacity)
  }, [layer.id, opacity, setLayerOpacity, visible])

  useEffect(
    () => () => {
      clearLayer(layer.id)
    },
    [clearLayer, layer.id],
  )

  return null
}

interface MapWorkspaceProps {
  layers: LayerDefinition[]
  serviceStatus: ServiceStatus
  createAdapter?: MapAdapterFactory
}

export function MapWorkspace({
  layers,
  serviceStatus,
  createAdapter = createMapLibreMapAdapter,
}: MapWorkspaceProps) {
  const config = useAppConfig()
  const order = useLayerStore((state) => state.order)
  const runtime = useLayerStore((state) => state.runtime)
  const setSelection = useLayerStore((state) => state.setSelection)
  const map = useMapCore(config.map, createAdapter, setSelection)
  const { setLayerOrder } = map
  const orderedLayers = useMemo(
    () =>
      order
        .map((layerId) => layers.find((layer) => layer.id === layerId))
        .filter((layer): layer is LayerDefinition => Boolean(layer)),
    [layers, order],
  )
  const visibleOrderSignature = order
    .filter((layerId) => runtime[layerId]?.visible)
    .join('|')
  const orderedVisibleIds = useMemo(
    () => (visibleOrderSignature ? visibleOrderSignature.split('|') : []),
    [visibleOrderSignature],
  )
  const visibleStates = orderedVisibleIds.map(
    (layerId) => runtime[layerId]?.loadState,
  )
  const layersLoading = visibleStates.some((state) => state === 'loading')
  const layersWithError = visibleStates.filter(
    (state) => state === 'error',
  ).length

  useEffect(() => {
    if (map.loadState === 'ready') setLayerOrder(orderedVisibleIds)
  }, [map.loadState, orderedVisibleIds, setLayerOrder])

  return (
    <div
      ref={map.workspaceRef}
      data-map-workspace
      className="relative flex min-h-0 flex-1 flex-col bg-slate-100"
    >
      {orderedLayers.map((layer) => (
        <LayerController
          key={layer.id}
          bounds={map.viewportBounds}
          clearLayer={map.clearLayer}
          layer={layer}
          mapReady={map.loadState === 'ready'}
          orderedVisibleIds={orderedVisibleIds}
          setLayerData={map.setLayerData}
          setLayerOpacity={map.setLayerOpacity}
          setLayerOrder={map.setLayerOrder}
        />
      ))}

      <main
        className="map-canvas relative min-h-0 flex-1 overflow-hidden"
        aria-label="Área do mapa"
      >
        <div
          ref={map.containerRef}
          className="absolute inset-0 h-full w-full"
          data-testid="map-container"
        />

        <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-white/80 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm backdrop-blur">
          <MapIcon
            aria-hidden="true"
            className="size-3.5 text-[var(--color-brand)]"
          />
          Área de trabalho
          <span className="text-slate-300">/</span>
          {config.map.basemap.name}
        </div>

        {map.loadState === 'ready' && orderedVisibleIds.length > 0 && (
          <div
            className="pointer-events-none absolute right-14 top-4 z-10 flex items-center gap-2 rounded-lg border border-white/80 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm backdrop-blur"
            role={layersWithError ? 'alert' : 'status'}
          >
            {layersLoading ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-3.5 animate-spin text-[var(--color-brand)]"
              />
            ) : layersWithError ? (
              <AlertTriangle
                aria-hidden="true"
                className="size-3.5 text-amber-600"
              />
            ) : (
              <span
                className="size-2 rounded-full bg-[var(--color-brand)]"
                aria-hidden="true"
              />
            )}
            {layersLoading
              ? 'Atualizando camadas'
              : layersWithError
                ? `${layersWithError} camada indisponível`
                : `${orderedVisibleIds.length} camadas visíveis`}
          </div>
        )}

        <MeasurementPanel
          measurement={map.measurement}
          onClose={map.clearMeasurement}
          onReset={map.resetMeasurement}
        />

        {map.loadState !== 'ready' && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-slate-100/75 px-6 backdrop-blur-[2px]">
            <div
              className="max-w-sm rounded-2xl border border-white/80 bg-white/95 px-7 py-6 text-center shadow-xl"
              role={map.loadState === 'error' ? 'alert' : 'status'}
            >
              {map.loadState === 'loading' ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="mx-auto size-6 animate-spin text-[var(--color-brand)]"
                />
              ) : (
                <AlertTriangle
                  aria-hidden="true"
                  className="mx-auto size-6 text-amber-600"
                />
              )}
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {map.loadState === 'loading'
                  ? 'Preparando mapa'
                  : 'Não foi possível iniciar o mapa'}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {map.loadState === 'loading'
                  ? 'Carregando o basemap e os controles essenciais.'
                  : map.errorMessage}
              </p>
            </div>
          </div>
        )}
      </main>

      {config.ui.toolbar && (
        <Toolbar
          mapReady={map.loadState === 'ready'}
          measureAreaEnabled={config.capabilities.measureArea}
          measureDistanceEnabled={config.capabilities.measureDistance}
          measurementMode={map.measurement.mode}
          onFitHomeBounds={map.fitHomeBounds}
          onGoHome={map.goHome}
          onStartMeasurement={map.startMeasurement}
          onToggleFullscreen={map.toggleFullscreen}
        />
      )}
      {config.ui.statusBar && (
        <StatusBar
          serviceStatus={serviceStatus}
          mapLoadState={map.loadState}
          viewState={map.viewState}
        />
      )}
    </div>
  )
}
