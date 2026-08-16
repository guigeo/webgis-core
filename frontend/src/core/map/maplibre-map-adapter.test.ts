import { describe, expect, it } from 'vitest'

import type { LayerDefinition } from '../layers/contracts'
import { createFeaturePopupContent } from './maplibre-map-adapter'

const layer: LayerDefinition = {
  id: 'ibge-rmsp-municipalities',
  name: 'Municípios da RMSP',
  description: 'Limites municipais',
  geometryType: 'MultiPolygon',
  fields: [
    { name: 'name', label: 'Município', type: 'string' },
    { name: 'ibge_code', label: 'Código IBGE', type: 'string' },
    { name: 'state_code', label: 'UF', type: 'string' },
  ],
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

describe('MapLibre layer popup', () => {
  it('deriva título e campos publicáveis da definição da camada', () => {
    const popup = createFeaturePopupContent(layer, {
      name: 'São Paulo',
      ibge_code: '3550308',
      state_code: 'SP',
    })

    expect(popup.textContent).toContain('Municípios da RMSP')
    expect(popup.textContent).toContain('São Paulo')
    expect(popup.textContent).toContain('Código IBGE3550308')
    expect(popup.textContent).toContain('UFSP')
  })

  it('usa somente textContent para valores externos', () => {
    const popup = createFeaturePopupContent(layer, {
      name: '<img src=x onerror=alert(1)>',
      ibge_code: '3550308',
      state_code: 'SP',
    })

    expect(popup.querySelector('img')).toBeNull()
    expect(popup.textContent).toContain('<img src=x onerror=alert(1)>')
  })
})
