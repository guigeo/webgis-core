import { useEffect, useMemo } from 'react'
import type { PropsWithChildren } from 'react'

import type { WebGisModule } from './contracts'
import { WebGisModulesContext } from './context'
import { createWebGisModuleRegistry } from './registry'

interface WebGisModulesProviderProps extends PropsWithChildren {
  modules: readonly WebGisModule[]
}

export function WebGisModulesProvider({
  modules,
  children,
}: WebGisModulesProviderProps) {
  const registry = useMemo(() => createWebGisModuleRegistry(modules), [modules])

  useEffect(() => registry.setup(), [registry])

  return (
    <WebGisModulesContext value={registry}>{children}</WebGisModulesContext>
  )
}
