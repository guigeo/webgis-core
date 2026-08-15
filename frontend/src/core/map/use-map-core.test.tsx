import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { appConfig } from '../../config/app.config'
import type {
  MapAdapter,
  MapAdapterEvents,
  MapAdapterFactory,
} from './contracts'
import { useMapCore } from './use-map-core'

function MapCoreHarness({
  createAdapter,
}: {
  createAdapter: MapAdapterFactory
}) {
  const map = useMapCore(appConfig.map, createAdapter)

  return (
    <div ref={map.workspaceRef}>
      <div ref={map.containerRef} />
      <span>{map.loadState}</span>
      <span>{map.viewState.zoom}</span>
      <button type="button" onClick={map.goHome}>
        Início
      </button>
      <button type="button" onClick={map.fitHomeBounds}>
        Enquadrar
      </button>
      <button type="button" onClick={() => void map.toggleFullscreen()}>
        Tela cheia
      </button>
    </div>
  )
}

describe('useMapCore', () => {
  it('controla lifecycle, eventos e ações pelo contrato do adaptador', () => {
    const goHome = vi.fn()
    const fitHomeBounds = vi.fn()
    const toggleFullscreen = vi.fn().mockResolvedValue(undefined)
    const setLayerData = vi.fn()
    const clearLayer = vi.fn()
    const destroy = vi.fn()
    let receivedEvents: MapAdapterEvents | undefined

    const adapter: MapAdapter = {
      initialize: (_container, _fullscreenContainer, events) => {
        receivedEvents = events
        events.onReady()
        events.onViewChange({
          center: [-43.2, -22.9],
          pointer: [-43.21, -22.91],
          zoom: 12,
        })
        events.onViewportChange([
          [-47, -24],
          [-46, -23],
        ])
      },
      destroy,
      goHome,
      fitHomeBounds,
      toggleFullscreen,
      setLayerData,
      clearLayer,
    }
    const createAdapter = vi.fn(() => adapter)

    const rendered = render(<MapCoreHarness createAdapter={createAdapter} />)

    expect(createAdapter).toHaveBeenCalledWith(appConfig.map)
    expect(screen.getByText('ready')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Início' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enquadrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tela cheia' }))

    expect(goHome).toHaveBeenCalledOnce()
    expect(fitHomeBounds).toHaveBeenCalledOnce()
    expect(toggleFullscreen).toHaveBeenCalledOnce()
    expect(receivedEvents).toBeDefined()

    rendered.unmount()
    expect(destroy).toHaveBeenCalledOnce()
  })

  it('expõe falhas de inicialização sem vazar detalhes do MapLibre', () => {
    const adapter: MapAdapter = {
      initialize: (_container, _fullscreenContainer, events) =>
        events.onError(new Error('WebGL indisponível')),
      destroy: vi.fn(),
      goHome: vi.fn(),
      fitHomeBounds: vi.fn(),
      toggleFullscreen: vi.fn().mockResolvedValue(undefined),
      setLayerData: vi.fn(),
      clearLayer: vi.fn(),
    }
    const createAdapter: MapAdapterFactory = () => adapter

    function ErrorHarness() {
      const map = useMapCore(appConfig.map, createAdapter)

      return (
        <div ref={map.workspaceRef}>
          <div ref={map.containerRef} />
          <span>{map.loadState}</span>
          <span>{map.errorMessage}</span>
        </div>
      )
    }

    render(<ErrorHarness />)

    expect(screen.getByText('error')).toBeInTheDocument()
    expect(screen.getByText('WebGL indisponível')).toBeInTheDocument()
  })
})
