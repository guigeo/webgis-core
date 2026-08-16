import { describe, expect, it, vi } from 'vitest'

import type { LayerDefinition } from '../layers/contracts'
import type { WebGisModule } from './contracts'
import {
  createWebGisModuleRegistry,
  resolveConfiguredModules,
} from './registry'

const moduleA: WebGisModule = {
  id: 'module-a',
  version: '1.0.0',
  layers: [{ layerId: 'layer-a' }],
}

const moduleB: WebGisModule = {
  id: 'module-b',
  version: '1.0.0',
  layers: [{ layerId: 'layer-b' }],
}

describe('WebGisModule registry', () => {
  it('resolve módulos explícitos na ordem da configuração', () => {
    expect(resolveConfiguredModules(['module-b'], [moduleA, moduleB])).toEqual([
      moduleB,
    ])
    expect(resolveConfiguredModules([], [moduleA, moduleB])).toEqual([])
  })

  it('falha cedo para módulo ausente ou configuração duplicada', () => {
    expect(() => resolveConfiguredModules(['unknown'], [moduleA])).toThrow(
      'Módulo configurado não foi registrado: unknown',
    )
    expect(() =>
      resolveConfiguredModules(['module-a', 'module-a'], [moduleA]),
    ).toThrow('Módulo configurado mais de uma vez: module-a')
  })

  it('seleciona somente as camadas contribuídas e prova a remoção do módulo', () => {
    const catalog = [
      { id: 'layer-a' },
      { id: 'layer-b' },
      { id: 'core-unowned-layer' },
    ] as LayerDefinition[]

    const registry = createWebGisModuleRegistry([moduleB, moduleA])

    expect(registry.layerIds).toEqual(['layer-b', 'layer-a'])
    expect(registry.selectLayers(catalog).map(({ id }) => id)).toEqual([
      'layer-b',
      'layer-a',
    ])
    expect(createWebGisModuleRegistry([]).selectLayers(catalog)).toEqual([])
  })

  it('impede que dois módulos assumam a mesma camada', () => {
    expect(() =>
      createWebGisModuleRegistry([
        moduleA,
        {
          ...moduleB,
          layers: [{ layerId: 'layer-a' }],
        },
      ]),
    ).toThrow(
      'Camada layer-a pertence simultaneamente aos módulos module-a e module-b',
    )
  })

  it('executa setup na ordem e cleanup reverso uma única vez', () => {
    const events: string[] = []
    const firstCleanup = vi.fn(() => events.push('cleanup-a'))
    const secondCleanup = vi.fn(() => events.push('cleanup-b'))
    const registry = createWebGisModuleRegistry([
      {
        ...moduleA,
        setup: () => {
          events.push('setup-a')
          return firstCleanup
        },
      },
      {
        ...moduleB,
        setup: () => {
          events.push('setup-b')
          return secondCleanup
        },
      },
    ])

    const cleanup = registry.setup()
    cleanup()
    cleanup()

    expect(events).toEqual(['setup-a', 'setup-b', 'cleanup-b', 'cleanup-a'])
    expect(firstCleanup).toHaveBeenCalledOnce()
    expect(secondCleanup).toHaveBeenCalledOnce()
  })
})
