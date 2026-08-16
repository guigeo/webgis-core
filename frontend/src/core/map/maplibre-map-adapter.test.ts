import { describe, expect, it } from 'vitest'

import type { LayerDefinition } from '../layers/contracts'
import { createFeaturePopupContent } from './maplibre-map-adapter'

const layer: LayerDefinition = {
  id: 'ibge-rmsp-municipalities',
  name: 'Municípios da RMSP',
  description: 'Limites municipais',
  groupName: 'Referência territorial',
  sortOrder: 10,
  geometryType: 'MultiPolygon',
  fields: [
    {
      name: 'name',
      label: 'Município',
      type: 'string',
      popup: 'title',
    },
    {
      name: 'ibge_code',
      label: 'Código IBGE',
      type: 'string',
      popup: 'detail',
    },
    { name: 'state_code', label: 'UF', type: 'string', popup: 'detail' },
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

  it('não publica campos marcados como ocultos no popup', () => {
    const popup = createFeaturePopupContent(
      {
        ...layer,
        fields: [
          ...layer.fields,
          {
            name: 'internal_code',
            label: 'Código interno',
            type: 'string',
            popup: 'hidden',
          },
        ],
      },
      {
        name: 'São Paulo',
        ibge_code: '3550308',
        state_code: 'SP',
        internal_code: 'não exibir',
      },
    )

    expect(popup.textContent).not.toContain('Código interno')
    expect(popup.textContent).not.toContain('não exibir')
  })
})
