import { appConfig } from '../config/app.config'
import { resolveConfiguredModules } from '../core/modules/registry'
import { referenceModule } from '../modules/reference'

const availableModules = [referenceModule]

export const appModules = resolveConfiguredModules(
  appConfig.modules,
  availableModules,
)
