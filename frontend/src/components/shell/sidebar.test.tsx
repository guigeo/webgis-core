import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppTooltipProvider } from '../ui/tooltip'
import { appConfig } from '../../config/app.config'
import { AppConfigProvider } from '../../config/provider'
import type { LayerDefinition } from '../../core/layers/contracts'
import { useLayerStore } from '../../core/layers/store'
import { Sidebar } from './sidebar'

const layer: LayerDefinition = {
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
  sourceUrl: 'https://servicodados.ibge.gov.br/',
  licenseName: 'Dados abertos do IBGE',
  licenseUrl: 'https://www.ibge.gov.br/',
  defaultVisible: true,
  defaultOpacity: 1,
  featureLimit: 50,
  metadata: {
    summary: 'Limites municipais',
    updatedAt: '2026-08-15',
    featureCount: 39,
  },
}

describe('Sidebar layer visibility', () => {
  it('transforma o marcador da camada em um controle liga/desliga', () => {
    useLayerStore.setState({ order: [], runtime: {}, selection: null })
    useLayerStore.getState().initializeLayers([layer])

    render(
      <AppConfigProvider config={appConfig}>
        <AppTooltipProvider>
          <Sidebar
            layerCatalogStatus="ready"
            layers={[layer]}
            serviceStatus="ready"
          />
        </AppTooltipProvider>
      </AppConfigProvider>,
    )

    const toggle = screen.getByRole('button', {
      name: 'Ocultar Municípios da RMSP',
    })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(toggle)

    expect(useLayerStore.getState().runtime[layer.id].visible).toBe(false)
  })
})
