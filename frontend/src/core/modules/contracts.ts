export type ModuleCleanup = () => void

export interface CatalogLayerContribution {
  layerId: string
}

export interface WebGisModule {
  id: string
  version: string
  layers?: readonly CatalogLayerContribution[]
  setup?: () => void | ModuleCleanup
}
