import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  LayerDefinition,
  LayerFeatureCollection,
  LayerSelection,
} from '../layers/contracts'
import type {
  MapAdapter,
  MapAdapterFactory,
  MapBounds,
  MapLoadState,
  MapSettings,
  MapViewState,
} from './contracts'

export function useMapCore(
  settings: MapSettings,
  createAdapter: MapAdapterFactory,
) {
  const workspaceRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<MapAdapter | null>(null)
  const [loadState, setLoadState] = useState<MapLoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewportBounds, setViewportBounds] = useState<MapBounds | null>(null)
  const [selection, setSelection] = useState<LayerSelection | null>(null)
  const [viewState, setViewState] = useState<MapViewState>({
    center: settings.center,
    pointer: null,
    zoom: settings.zoom,
  })

  useEffect(() => {
    const container = containerRef.current
    const workspace = workspaceRef.current

    if (!container || !workspace) return

    const adapter = createAdapter(settings)
    adapterRef.current = adapter
    setLoadState('loading')
    setErrorMessage(null)

    adapter.initialize(container, workspace, {
      onReady: () => setLoadState('ready'),
      onError: (error) => {
        setLoadState('error')
        setErrorMessage(error.message)
      },
      onFeatureSelect: setSelection,
      onViewChange: setViewState,
      onViewportChange: setViewportBounds,
    })

    return () => {
      adapter.destroy()
      adapterRef.current = null
    }
  }, [createAdapter, settings])

  const goHome = useCallback(() => adapterRef.current?.goHome(), [])
  const fitHomeBounds = useCallback(
    () => adapterRef.current?.fitHomeBounds(),
    [],
  )
  const toggleFullscreen = useCallback(
    () => adapterRef.current?.toggleFullscreen() ?? Promise.resolve(),
    [],
  )
  const setLayerData = useCallback(
    (layer: LayerDefinition, features: LayerFeatureCollection) =>
      adapterRef.current?.setLayerData(layer, features),
    [],
  )
  const clearLayer = useCallback(
    (layerId: string) => adapterRef.current?.clearLayer(layerId),
    [],
  )

  return {
    workspaceRef,
    containerRef,
    loadState,
    errorMessage,
    viewState,
    viewportBounds,
    selection,
    goHome,
    fitHomeBounds,
    toggleFullscreen,
    setLayerData,
    clearLayer,
  }
}
