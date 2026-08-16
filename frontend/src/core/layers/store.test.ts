import { beforeEach, describe, expect, it } from 'vitest'

import type { LayerDefinition } from './contracts'
import { useLayerStore } from './store'

function layer(id: string, sortOrder: number): LayerDefinition {
  return {
    id,
    name: id,
    description: 'Camada de teste',
    groupName: 'Teste',
    sortOrder,
    geometryType: 'Point',
    fields: [{ name: 'name', label: 'Nome', type: 'string', popup: 'title' }],
    style: {
      kind: 'circle',
      circleColor: '#0E9384',
      circleRadius: 5,
      strokeColor: '#FFFFFF',
      strokeWidth: 1,
      selectedColor: '#F79009',
      selectedRadius: 8,
      selectedStrokeColor: '#B54708',
      selectedStrokeWidth: 2,
    },
    attribution: 'Fonte de teste',
    sourceUrl: 'https://example.com/source',
    licenseName: 'Licença de teste',
    licenseUrl: 'https://example.com/license',
    defaultVisible: true,
    defaultOpacity: 0.8,
    featureLimit: 50,
    metadata: {
      summary: 'Resumo',
      updatedAt: '2026-08-15',
      featureCount: 1,
    },
  }
}

describe('layer store', () => {
  beforeEach(() => {
    useLayerStore.setState({ order: [], runtime: {}, selection: null })
  })

  it('inicializa camadas pela ordem do catálogo e preserva defaults', () => {
    useLayerStore
      .getState()
      .initializeLayers([layer('polygons', 10), layer('points', 5)])

    const state = useLayerStore.getState()
    expect(state.order).toEqual(['points', 'polygons'])
    expect(state.runtime.points).toMatchObject({
      visible: true,
      opacity: 0.8,
      loadState: 'idle',
    })
  })

  it('controla visibilidade, opacidade, ordem e estado por camada', () => {
    const store = useLayerStore.getState()
    store.initializeLayers([layer('points', 5), layer('polygons', 10)])
    store.toggleLayer('points')
    store.setOpacity('polygons', 1.5)
    store.moveLayer('polygons', 'up')
    store.setLoadState('polygons', 'error', 'Falha espacial')

    const state = useLayerStore.getState()
    expect(state.runtime.points.visible).toBe(false)
    expect(state.runtime.polygons.opacity).toBe(1)
    expect(state.order).toEqual(['polygons', 'points'])
    expect(state.runtime.polygons).toMatchObject({
      loadState: 'error',
      errorMessage: 'Falha espacial',
    })
  })

  it('mantém a seleção compartilhada fora da instância do mapa', () => {
    useLayerStore.getState().setSelection({
      layerId: 'points',
      featureId: '3550308',
      properties: { name: 'São Paulo' },
    })

    expect(useLayerStore.getState().selection?.featureId).toBe('3550308')
  })
})
