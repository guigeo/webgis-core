import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  MapAdapter,
  MapAdapterFactory,
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
      onViewChange: setViewState,
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

  return {
    workspaceRef,
    containerRef,
    loadState,
    errorMessage,
    viewState,
    goHome,
    fitHomeBounds,
    toggleFullscreen,
  }
}
