import type { WebGisModule } from '../../core/modules/contracts'

export const referenceModule = {
  id: 'reference',
  version: '1.0.0',
  layers: [
    { layerId: 'ibge-rmsp-municipality-points' },
    { layerId: 'ibge-rmsp-municipalities' },
  ],
} satisfies WebGisModule
