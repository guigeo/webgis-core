import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { WebGisModule } from './contracts'
import { useWebGisModules } from './context'
import { WebGisModulesProvider } from './provider'

function ModuleConsumer() {
  const registry = useWebGisModules()
  return <span>{registry.modules.map(({ id }) => id).join(',')}</span>
}

describe('WebGisModulesProvider', () => {
  it('expõe o registro e conecta setup ao lifecycle do React', async () => {
    const cleanup = vi.fn()
    const setup = vi.fn(() => cleanup)
    const modules: WebGisModule[] = [
      { id: 'reference', version: '1.0.0', setup },
    ]

    const rendered = render(
      <WebGisModulesProvider modules={modules}>
        <ModuleConsumer />
      </WebGisModulesProvider>,
    )

    expect(screen.getByText('reference')).toBeInTheDocument()
    await waitFor(() => expect(setup).toHaveBeenCalledOnce())

    rendered.unmount()
    expect(cleanup).toHaveBeenCalledOnce()
  })
})
