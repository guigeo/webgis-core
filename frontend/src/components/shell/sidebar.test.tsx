import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AppTooltipProvider } from '../ui/tooltip'
import { appConfig } from '../../config/app.config'
import { AppConfigProvider } from '../../config/provider'
import type { LayerDefinition } from '../../core/layers/contracts'
import { Sidebar } from './sidebar'

const layer: LayerDefinition = {
  id: 'ibge-rmsp-municipalities',
  name: 'Municípios da RMSP',
  description: 'Limites municipais',
  geometryType: 'MultiPolygon',
  fields: [{ name: 'name', label: 'Município', type: 'string' }],
  style: {
    fillColor: '#175CD3',
    fillOpacity: 0.24,
    lineColor: '#175CD3',
    lineWidth: 1.4,
    selectedFillColor: '#F79009',
    selectedLineColor: '#B54708',
    selectedLineWidth: 3,
  },
  attribution: 'Fonte: IBGE',
  sourceUrl: 'https://servicodados.ibge.gov.br/',
  licenseName: 'Dados abertos do IBGE',
  licenseUrl: 'https://www.ibge.gov.br/',
  defaultVisible: true,
  featureLimit: 50,
}

describe('Sidebar layer visibility', () => {
  it('transforma o marcador da camada em um controle liga/desliga', () => {
    const onToggleLayer = vi.fn()

    render(
      <AppConfigProvider config={appConfig}>
        <AppTooltipProvider>
          <Sidebar
            layerCatalogStatus="ready"
            layers={[layer]}
            visibleLayerId={layer.id}
            serviceStatus="ready"
            onToggleLayer={onToggleLayer}
          />
        </AppTooltipProvider>
      </AppConfigProvider>,
    )

    const toggle = screen.getByRole('button', {
      name: 'Ocultar Municípios da RMSP',
    })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(toggle)

    expect(onToggleLayer).toHaveBeenCalledWith(layer.id)
  })
})
