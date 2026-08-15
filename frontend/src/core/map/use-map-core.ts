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
  onFeatureSelect?: (selection: LayerSelection | null) => void,
) {
  const workspaceRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<MapAdapter | null>(null)
  const [loadState, setLoadState] = useState<MapLoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewportBounds, setViewportBounds] = useState<MapBounds | null>(null)
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
      onFeatureSelect: (selection) => onFeatureSelect?.(selection),
      onViewChange: setViewState,
      onViewportChange: setViewportBounds,
    })

    return () => {
      adapter.destroy()
      adapterRef.current = null
    }
  }, [createAdapter, onFeatureSelect, settings])

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
    (
      layer: LayerDefinition,
      features: LayerFeatureCollection,
      opacity: number,
    ) => adapterRef.current?.setLayerData(layer, features, opacity),
    [],
  )
  const clearLayer = useCallback(
    (layerId: string) => adapterRef.current?.clearLayer(layerId),
    [],
  )
  const setLayerOpacity = useCallback(
    (layerId: string, opacity: number) =>
      adapterRef.current?.setLayerOpacity(layerId, opacity),
    [],
  )
  const setLayerOrder = useCallback(
    (layerIds: string[]) => adapterRef.current?.setLayerOrder(layerIds),
    [],
  )

  return {
    workspaceRef,
    containerRef,
    loadState,
    errorMessage,
    viewState,
    viewportBounds,
    goHome,
    fitHomeBounds,
    toggleFullscreen,
    setLayerData,
    clearLayer,
    setLayerOpacity,
    setLayerOrder,
  }
}
