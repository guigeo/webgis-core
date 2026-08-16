import { describe, expect, it } from 'vitest'

import {
  calculateAreaSquareMeters,
  calculateDistanceMeters,
  createMeasurementState,
  formatMeasurement,
} from './measurement'

describe('map measurement', () => {
  it('calcula distância geodésica acumulada', () => {
    const distance = calculateDistanceMeters([
      [0, 0],
      [1, 0],
      [2, 0],
    ])

    expect(distance).toBeGreaterThan(222_000)
    expect(distance).toBeLessThan(223_000)
  })

  it('calcula área geodésica de um polígono', () => {
    const area = calculateAreaSquareMeters([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ])

    expect(area).toBeGreaterThan(12_300_000_000)
    expect(area).toBeLessThan(12_400_000_000)
  })

  it('só publica resultado após o número mínimo de vértices', () => {
    expect(createMeasurementState('distance', [[0, 0]]).value).toBeNull()
    expect(
      createMeasurementState('area', [
        [0, 0],
        [1, 0],
      ]).value,
    ).toBeNull()
    expect(
      createMeasurementState('distance', [
        [0, 0],
        [1, 0],
      ]).value,
    ).not.toBeNull()
  })

  it('formata unidades métricas legíveis', () => {
    expect(formatMeasurement('distance', 950)).toBe('950 m')
    expect(formatMeasurement('distance', 1_500)).toBe('1,50 km')
    expect(formatMeasurement('area', 500_000)).toBe('500.000 m²')
    expect(formatMeasurement('area', 2_500_000)).toBe('2,50 km²')
  })
})
