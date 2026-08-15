import { describe, expect, it, vi } from 'vitest'

import type { LayerDefinition } from '../core/layers/contracts'
import { getLayerCatalog, getLayerFeatures } from './layers'

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

describe('layer services', () => {
  it('consulta o catálogo pelo endpoint público', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([layer]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getLayerCatalog()).resolves.toEqual([layer])
    expect(fetchMock).toHaveBeenCalledWith('/api/layers', {
      signal: undefined,
    })

    vi.unstubAllGlobals()
  })

  it('envia bbox e limite cadastrados ao consultar feições', async () => {
    const collection = {
      type: 'FeatureCollection',
      features: [],
      metadata: {
        layerId: layer.id,
        returned: 0,
        limit: 50,
        truncated: false,
      },
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(collection), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      getLayerFeatures(layer, [
        [-47, -24],
        [-46, -23],
      ]),
    ).resolves.toEqual(collection)
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      'bbox=-47%2C-24%2C-46%2C-23&limit=50',
    )

    vi.unstubAllGlobals()
  })

  it('rejeita respostas de catálogo com formato inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
        ),
    )

    await expect(getLayerCatalog()).rejects.toThrow('formato inválido')

    vi.unstubAllGlobals()
  })
})
