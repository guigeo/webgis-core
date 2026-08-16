import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MeasurementPanel } from './measurement-panel'

describe('MeasurementPanel', () => {
  it('mostra progresso, resultado e ações da medição', () => {
    const onClose = vi.fn()
    const onReset = vi.fn()

    render(
      <MeasurementPanel
        measurement={{
          mode: 'distance',
          coordinates: [
            [-46.6, -23.5],
            [-46.5, -23.4],
          ],
          value: 15_000,
          formatted: '15,00 km',
        }}
        onClose={onClose}
        onReset={onReset}
      />,
    )

    expect(screen.getByText('2 vértices')).toBeInTheDocument()
    expect(screen.getByText('15,00 km')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Recomeçar medição' }))
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar medição' }))
    expect(onReset).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })
})
