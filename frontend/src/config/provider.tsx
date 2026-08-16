import type { PropsWithChildren } from 'react'

import { AppConfigContext } from './context'
import type { AppConfig } from './schema'

interface AppConfigProviderProps extends PropsWithChildren {
  config: AppConfig
}

export function AppConfigProvider({
  config,
  children,
}: AppConfigProviderProps) {
  return <AppConfigContext value={config}>{children}</AppConfigContext>
}
