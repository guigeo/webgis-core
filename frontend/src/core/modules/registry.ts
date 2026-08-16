import type { LayerDefinition } from '../layers/contracts'
import type { ModuleCleanup, WebGisModule } from './contracts'

const moduleIdPattern = /^[a-z][a-z0-9-]*$/

function validateAvailableModules(modules: readonly WebGisModule[]) {
  const moduleIds = new Set<string>()

  for (const module of modules) {
    if (!moduleIdPattern.test(module.id)) {
      throw new Error(`Módulo com id inválido: ${module.id}`)
    }
    if (!module.version.trim()) {
      throw new Error(`Módulo ${module.id} precisa declarar uma versão`)
    }
    if (moduleIds.has(module.id)) {
      throw new Error(`Módulo duplicado: ${module.id}`)
    }
    moduleIds.add(module.id)
  }
}

export function resolveConfiguredModules(
  configuredModuleIds: readonly string[],
  availableModules: readonly WebGisModule[],
): WebGisModule[] {
  validateAvailableModules(availableModules)

  const modulesById = new Map(
    availableModules.map((module) => [module.id, module]),
  )
  const configuredIds = new Set<string>()

  return configuredModuleIds.map((moduleId) => {
    if (configuredIds.has(moduleId)) {
      throw new Error(`Módulo configurado mais de uma vez: ${moduleId}`)
    }
    configuredIds.add(moduleId)

    const module = modulesById.get(moduleId)
    if (!module) {
      throw new Error(`Módulo configurado não foi registrado: ${moduleId}`)
    }
    return module
  })
}

export interface WebGisModuleRegistry {
  modules: readonly WebGisModule[]
  layerIds: readonly string[]
  selectLayers: (catalog: readonly LayerDefinition[]) => LayerDefinition[]
  setup: () => ModuleCleanup
}

export function createWebGisModuleRegistry(
  modules: readonly WebGisModule[],
): WebGisModuleRegistry {
  validateAvailableModules(modules)

  const layerOwners = new Map<string, string>()
  const layerIds: string[] = []

  for (const module of modules) {
    for (const contribution of module.layers ?? []) {
      const layerId = contribution.layerId.trim()
      if (!layerId) {
        throw new Error(`Módulo ${module.id} declarou uma camada sem id`)
      }

      const owner = layerOwners.get(layerId)
      if (owner) {
        throw new Error(
          `Camada ${layerId} pertence simultaneamente aos módulos ${owner} e ${module.id}`,
        )
      }
      layerOwners.set(layerId, module.id)
      layerIds.push(layerId)
    }
  }

  return {
    modules: [...modules],
    layerIds,
    selectLayers: (catalog) => {
      const catalogById = new Map(catalog.map((layer) => [layer.id, layer]))
      return layerIds
        .map((layerId) => catalogById.get(layerId))
        .filter((layer): layer is LayerDefinition => Boolean(layer))
    },
    setup: () => {
      const cleanups: ModuleCleanup[] = []

      try {
        for (const module of modules) {
          const cleanup = module.setup?.()
          if (cleanup) cleanups.push(cleanup)
        }
      } catch (error) {
        for (const cleanup of cleanups.reverse()) cleanup()
        throw error
      }

      let cleaned = false
      return () => {
        if (cleaned) return
        cleaned = true
        for (const cleanup of cleanups.reverse()) cleanup()
      }
    },
  }
}
