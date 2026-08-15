import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { AppTooltipProvider } from './components/ui/tooltip'
import { appConfig } from './config/app.config'
import { AppConfigProvider } from './config/provider'
import { appConfigSchema, type AppConfig } from './config/schema'

vi.mock('./core/map/maplibre-map-adapter', () => ({
  createMapLibreMapAdapter: () => ({
    initialize: (
      _container: HTMLElement,
      _fullscreenContainer: HTMLElement,
      events: {
        onReady: () => void
        onViewChange: (view: {
          center: [number, number]
          pointer: null
          zoom: number
        }) => void
      },
    ) => {
      events.onReady()
      events.onViewChange({
        center: [-46.6333, -23.5505],
        pointer: null,
        zoom: 10,
      })
    },
    destroy: () => undefined,
    goHome: () => undefined,
    fitHomeBounds: () => undefined,
    toggleFullscreen: () => Promise.resolve(),
  }),
}))

function renderApp(config: AppConfig = appConfig) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider config={config}>
        <AppTooltipProvider>
          <App />
        </AppTooltipProvider>
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

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renderiza o shell e exibe a integração saudável', async () => {
    mockHealthyServices()

    renderApp()

    expect(screen.getByText('Geo Core')).toBeInTheDocument()
    expect(screen.getByLabelText('Área do mapa')).toBeInTheDocument()
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
})
