import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AppTooltipProvider } from '../ui/tooltip'
import { Toolbar } from './toolbar'

describe('Toolbar measurement tools', () => {
  it('expõe ações configuradas e indica o modo ativo', () => {
    const onStartMeasurement = vi.fn()

    render(
      <AppTooltipProvider>
        <Toolbar
          mapReady
          measureAreaEnabled
          measureDistanceEnabled
          measurementMode="area"
          onFitHomeBounds={vi.fn()}
          onGoHome={vi.fn()}
          onStartMeasurement={onStartMeasurement}
          onToggleFullscreen={vi.fn().mockResolvedValue(undefined)}
        />
      </AppTooltipProvider>,
    )

    expect(screen.getByRole('button', { name: 'Medir área' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Medir distância' }))
    expect(onStartMeasurement).toHaveBeenCalledWith('distance')
  })

  it('não renderiza capacidades desabilitadas', () => {
    render(
      <AppTooltipProvider>
        <Toolbar
          mapReady
          measureAreaEnabled={false}
          measureDistanceEnabled={false}
          measurementMode={null}
          onFitHomeBounds={vi.fn()}
          onGoHome={vi.fn()}
          onStartMeasurement={vi.fn()}
          onToggleFullscreen={vi.fn().mockResolvedValue(undefined)}
        />
      </AppTooltipProvider>,
    )

    expect(screen.queryByLabelText('Medir distância')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Medir área')).not.toBeInTheDocument()
  })
})
