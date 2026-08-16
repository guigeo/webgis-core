import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { AppTooltipProvider } from './components/ui/tooltip'
import { appConfig } from './config/app.config'
import { AppConfigProvider } from './config/provider'
import { appConfigSchema, type AppConfig } from './config/schema'
import type { LayerDefinition } from './core/layers/contracts'
import { useLayerStore } from './core/layers/store'
import type { WebGisModule } from './core/modules/contracts'
import { WebGisModulesProvider } from './core/modules/provider'
import { referenceModule } from './modules/reference'

const mapAdapterSpies = vi.hoisted(() => ({
  setLayerData: vi.fn(),
  clearLayer: vi.fn(),
  setLayerOpacity: vi.fn(),
  setLayerOrder: vi.fn(),
}))

vi.mock('./core/map/maplibre-map-adapter', () => ({
  createMapLibreMapAdapter: () => ({
    initialize: (
      _container: HTMLElement,
      _fullscreenContainer: HTMLElement,
      events: {
        onReady: () => void
        onFeatureSelect: (selection: null) => void
        onViewChange: (view: {
          center: [number, number]
          pointer: null
          zoom: number
        }) => void
        onViewportChange: (bounds: [[number, number], [number, number]]) => void
      },
    ) => {
      events.onReady()
      events.onViewChange({
        center: [-46.6333, -23.5505],
        pointer: null,
        zoom: 10,
      })
      events.onViewportChange([
        [-47.35, -24.05],
        [-45.92, -23.05],
      ])
    },
    destroy: () => undefined,
    goHome: () => undefined,
    fitHomeBounds: () => undefined,
    toggleFullscreen: () => Promise.resolve(),
    setLayerData: mapAdapterSpies.setLayerData,
    clearLayer: mapAdapterSpies.clearLayer,
    setLayerOpacity: mapAdapterSpies.setLayerOpacity,
    setLayerOrder: mapAdapterSpies.setLayerOrder,
  }),
}))

const defaultModules = [referenceModule]

function renderApp(
  config: AppConfig = appConfig,
  modules: readonly WebGisModule[] = defaultModules,
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider config={config}>
        <WebGisModulesProvider modules={modules}>
          <AppTooltipProvider>
            <App />
          </AppTooltipProvider>
        </WebGisModulesProvider>
      </AppConfigProvider>
    </QueryClientProvider>,
  )
}

function mockHealthyServices() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok', database: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
}

const polygonLayer: LayerDefinition = {
  id: 'ibge-rmsp-municipalities',
  name: 'Municípios da RMSP',
  description: 'Limites municipais',
  groupName: 'Referência territorial',
  sortOrder: 10,
  geometryType: 'MultiPolygon',
  fields: [
    { name: 'name', label: 'Município', type: 'string', popup: 'title' },
  ],
  style: {
    kind: 'fill',
    fillColor: '#175CD3',
    fillOpacity: 0.24,
    lineColor: '#175CD3',
    lineWidth: 1.4,
    selectedFillColor: '#F79009',
    selectedLineColor: '#B54708',
    selectedLineWidth: 3,
  },
  attribution: 'Fonte: IBGE',
  sourceUrl: 'https://example.com/source',
  licenseName: 'Dados abertos',
  licenseUrl: 'https://example.com/license',
  defaultVisible: true,
  defaultOpacity: 1,
  featureLimit: 50,
  metadata: {
    summary: 'Limites municipais',
    updatedAt: '2026-08-15',
    featureCount: 39,
  },
}

const pointLayer: LayerDefinition = {
  ...polygonLayer,
  id: 'ibge-rmsp-municipality-points',
  name: 'Pontos municipais da RMSP',
  sortOrder: 5,
  geometryType: 'Point',
  style: {
    kind: 'circle',
    circleColor: '#0E9384',
    circleRadius: 5,
    strokeColor: '#FFFFFF',
    strokeWidth: 1.5,
    selectedColor: '#F79009',
    selectedRadius: 9,
    selectedStrokeColor: '#B54708',
    selectedStrokeWidth: 2,
  },
}

function mockLayerServices() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/health')) {
        return new Response(JSON.stringify({ status: 'ok', database: 'ok' }), {
          status: 200,
        })
      }
      if (url.endsWith('/layers')) {
        return new Response(JSON.stringify([pointLayer, polygonLayer]), {
          status: 200,
        })
      }
      return new Response(
        JSON.stringify({
          type: 'FeatureCollection',
          features: [],
          metadata: {
            layerId: url.includes('municipality-points')
              ? 'ibge-rmsp-municipality-points'
              : 'ibge-rmsp-municipalities',
            returned: 0,
            limit: 50,
            truncated: false,
          },
        }),
        { status: 200 },
      )
    }),
  )
}

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    useLayerStore.setState({ order: [], runtime: {}, selection: null })
  })

  it('renderiza o shell e exibe a integração saudável', async () => {
    mockHealthyServices()

    renderApp()

    expect(screen.getByText('Geo Core')).toBeInTheDocument()
    expect(screen.getByLabelText('Área do mapa')).toBeInTheDocument()
    expect(screen.getByTestId('map-container')).toHaveClass('h-full', 'w-full')
    expect(screen.getByLabelText('Navegação geográfica')).toBeInTheDocument()
    expect(
      screen.getByRole('toolbar', { name: 'Ferramentas do mapa' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Serviços operacionais')).toBeInTheDocument()
    expect(screen.getByText('PostGIS conectado')).toBeInTheDocument()
  })

  it('mostra um estado de erro quando a API não responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    renderApp()

    expect(
      await screen.findByText('Serviços indisponíveis'),
    ).toBeInTheDocument()
  })

  it('aplica branding e capacidades de uma configuração derivada', () => {
    mockHealthyServices()
    const derivedConfig = appConfigSchema.parse({
      ...appConfig,
      app: {
        ...appConfig.app,
        name: 'Território Base',
        shortName: 'TB',
      },
      branding: {
        primaryColor: '#7C3AED',
        accentColor: '#C026D3',
      },
      ui: {
        sidebar: false,
        toolbar: false,
        statusBar: false,
      },
    })

    renderApp(derivedConfig)

    expect(screen.getByText('Território Base')).toBeInTheDocument()
    expect(screen.getByTestId('application-shell')).toHaveStyle({
      '--color-brand': '#7C3AED',
      '--color-accent': '#C026D3',
    })
    expect(
      screen.queryByLabelText('Navegação geográfica'),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()
    expect(screen.queryByText('PostGIS conectado')).not.toBeInTheDocument()
  })

  it('abre e fecha a navegação móvel', () => {
    mockHealthyServices()
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir navegação' }))

    expect(
      screen.getByRole('dialog', { name: 'Navegação geográfica' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar navegação' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('compõe duas camadas do catálogo sem lógica específica no shell', async () => {
    mockLayerServices()

    renderApp()

    expect(
      await screen.findByText('Pontos municipais da RMSP'),
    ).toBeInTheDocument()
    expect(screen.getByText('Municípios da RMSP')).toBeInTheDocument()
    await waitFor(() =>
      expect(mapAdapterSpies.setLayerData).toHaveBeenCalledTimes(2),
    )
    expect(
      mapAdapterSpies.setLayerData.mock.calls.map(([layer]) => layer.id),
    ).toEqual(
      expect.arrayContaining([
        'ibge-rmsp-municipality-points',
        'ibge-rmsp-municipalities',
      ]),
    )
  })

  it('remove todas as contribuições ao retirar o módulo da composição', async () => {
    mockLayerServices()

    renderApp(appConfig, [])

    expect(
      await screen.findByText('Nenhuma camada cadastrada'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Pontos municipais da RMSP'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Municípios da RMSP')).not.toBeInTheDocument()
    expect(mapAdapterSpies.setLayerData).not.toHaveBeenCalled()
  })
})
