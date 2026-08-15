import { AlertTriangle, LoaderCircle, Map as MapIcon } from 'lucide-react'
import { useEffect } from 'react'

import { useAppConfig } from '../../config/context'
import type { LayerDefinition } from '../../core/layers/contracts'
import type { MapAdapterFactory } from '../../core/map/contracts'
import { createMapLibreMapAdapter } from '../../core/map/maplibre-map-adapter'
import { useMapCore } from '../../core/map/use-map-core'
import { useLayerFeaturesQuery } from '../../services/layers'
import { StatusBar } from '../shell/status-bar'
import { Toolbar } from '../shell/toolbar'
import type { ServiceStatus } from '../shell/types'

interface MapWorkspaceProps {
  activeLayer?: LayerDefinition
  serviceStatus: ServiceStatus
  createAdapter?: MapAdapterFactory
}

export function MapWorkspace({
  activeLayer,
  serviceStatus,
  createAdapter = createMapLibreMapAdapter,
}: MapWorkspaceProps) {
  const config = useAppConfig()
  const map = useMapCore(config.map, createAdapter)
  const { clearLayer, setLayerData } = map
  const layerFeatures = useLayerFeaturesQuery(
    activeLayer,
    map.viewportBounds,
    map.loadState === 'ready',
  )

  useEffect(() => {
    if (activeLayer && layerFeatures.data && map.loadState === 'ready') {
      setLayerData(activeLayer, layerFeatures.data)
    }
  }, [activeLayer, layerFeatures.data, map.loadState, setLayerData])

  useEffect(() => {
    const layerId = activeLayer?.id
    return () => {
      if (layerId) clearLayer(layerId)
    }
  }, [activeLayer?.id, clearLayer])

  return (
    <div
      ref={map.workspaceRef}
      data-map-workspace
      className="relative flex min-h-0 flex-1 flex-col bg-slate-100"
    >
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

        {activeLayer && map.loadState === 'ready' && (
          <div
            className="pointer-events-none absolute right-14 top-4 z-10 flex items-center gap-2 rounded-lg border border-white/80 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm backdrop-blur"
            role={layerFeatures.isError ? 'alert' : 'status'}
          >
            {layerFeatures.isFetching ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-3.5 animate-spin text-[var(--color-brand)]"
              />
            ) : layerFeatures.isError ? (
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
            {layerFeatures.isFetching
              ? 'Atualizando camada'
              : layerFeatures.isError
                ? 'Camada indisponível'
                : `${layerFeatures.data?.metadata.returned ?? 0} feições no mapa`}
          </div>
        )}

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
          onFitHomeBounds={map.fitHomeBounds}
          onGoHome={map.goHome}
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
