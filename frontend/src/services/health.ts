import { useQuery } from '@tanstack/react-query'

export interface HealthResponse {
  status: 'ok'
  database: 'ok'
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`, { signal })

  if (!response.ok) {
    throw new Error(`Health check falhou com status ${response.status}`)
  }

  return (await response.json()) as HealthResponse
}

export function useHealthQuery() {
  return useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => getHealth(signal),
    refetchInterval: 30_000,
  })
}
