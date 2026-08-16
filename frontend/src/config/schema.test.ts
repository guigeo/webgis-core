import { describe, expect, it } from 'vitest'

import { appConfig } from './app.config'
import { appConfigSchema } from './schema'

describe('appConfigSchema', () => {
  it('aceita uma aplicação derivada válida', () => {
    const derived = appConfigSchema.parse({
      ...appConfig,
      app: {
        ...appConfig.app,
        name: 'Geo Cliente',
        shortName: 'GCL',
      },
      map: {
        ...appConfig.map,
        center: [-43.1729, -22.9068],
        zoom: 11,
      },
    })

    expect(derived.app.name).toBe('Geo Cliente')
    expect(derived.map.center).toEqual([-43.1729, -22.9068])
  })

  it('rejeita cor de branding inválida', () => {
    expect(() =>
      appConfigSchema.parse({
        ...appConfig,
        branding: {
          ...appConfig.branding,
          primaryColor: 'azul',
        },
      }),
    ).toThrow()
  })

  it('rejeita zoom inicial fora dos limites declarados', () => {
    expect(() =>
      appConfigSchema.parse({
        ...appConfig,
        map: {
          ...appConfig.map,
          zoom: 18,
          maxZoom: 14,
        },
      }),
    ).toThrow('zoom deve estar entre minZoom e maxZoom')
  })

  it('rejeita sidebar sem uma seção habilitada', () => {
    expect(() =>
      appConfigSchema.parse({
        ...appConfig,
        capabilities: {
          layers: false,
          legend: false,
        },
      }),
    ).toThrow('sidebar habilitada exige ao menos uma seção disponível')
  })
})
