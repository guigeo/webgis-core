import { createContext, useContext } from 'react'

import type { WebGisModuleRegistry } from './registry'

export const WebGisModulesContext = createContext<WebGisModuleRegistry | null>(
  null,
)

export function useWebGisModules(): WebGisModuleRegistry {
  const registry = useContext(WebGisModulesContext)

  if (!registry) {
    throw new Error('WebGisModulesProvider não foi configurado')
  }
  return registry
}
