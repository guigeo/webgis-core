import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type {
  LayerDefinition,
  LayerFeatureCollection,
} from '../core/layers/contracts'
import type { MapBounds } from '../core/map/contracts'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function getLayerCatalog(
  signal?: AbortSignal,
): Promise<LayerDefinition[]> {
  const response = await fetch(`${apiBaseUrl}/layers`, { signal })

  if (!response.ok) {
    throw new Error(`Catálogo de camadas falhou com status ${response.status}`)
  }

  const catalog: unknown = await response.json()
  if (!Array.isArray(catalog)) {
    throw new Error('Catálogo de camadas retornou um formato inválido')
  }
  return catalog as LayerDefinition[]
}

export async function getLayerFeatures(
  layer: LayerDefinition,
  bounds: MapBounds,
  signal?: AbortSignal,
): Promise<LayerFeatureCollection> {
  const bbox = [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]].join(
    ',',
  )
  const parameters = new URLSearchParams({
    bbox,
    limit: String(layer.featureLimit),
  })
  const response = await fetch(
    `${apiBaseUrl}/layers/${encodeURIComponent(layer.id)}/features?${parameters}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(
      `Consulta da camada ${layer.name} falhou com status ${response.status}`,
    )
  }
  return (await response.json()) as LayerFeatureCollection
}

export function useLayerCatalogQuery() {
  return useQuery({
    queryKey: ['layers'],
    queryFn: ({ signal }) => getLayerCatalog(signal),
    staleTime: 5 * 60_000,
  })
}

function normalizedBounds(bounds: MapBounds | null) {
  return bounds?.map(([longitude, latitude]) => [
    Number(longitude.toFixed(5)),
    Number(latitude.toFixed(5)),
  ]) as MapBounds | undefined
}

export function useLayerFeaturesQuery(
  layer: LayerDefinition | undefined,
  bounds: MapBounds | null,
  enabled: boolean,
) {
  const queryBounds = normalizedBounds(bounds)

  return useQuery({
    queryKey: ['layer-features', layer?.id, queryBounds],
    queryFn: ({ signal }) => {
      if (!layer || !queryBounds) {
        throw new Error('Camada e viewport são obrigatórios')
      }
      return getLayerFeatures(layer, queryBounds, signal)
    },
    enabled: enabled && Boolean(layer && queryBounds),
    placeholderData: keepPreviousData,
  })
}
