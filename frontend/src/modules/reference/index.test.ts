import { describe, expect, it } from 'vitest'

import { referenceModule } from '.'

describe('referenceModule', () => {
  it('contribui as camadas de referência sem duplicar suas definições', () => {
    expect(referenceModule).toEqual({
      id: 'reference',
      version: '1.0.0',
      layers: [
        { layerId: 'ibge-rmsp-municipality-points' },
        { layerId: 'ibge-rmsp-municipalities' },
      ],
    })
  })
})
