import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exibe a integração saudável com a API e o PostGIS', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 'ok', database: 'ok' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    render(<App />)

    expect(screen.getByText('Verificando serviços…')).toBeInTheDocument()
    expect(await screen.findByText('API ok · PostGIS ok')).toBeInTheDocument()
  })

  it('mostra um estado de erro quando a API não responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    render(<App />)

    expect(
      await screen.findByText('Serviços indisponíveis'),
    ).toBeInTheDocument()
  })
})
