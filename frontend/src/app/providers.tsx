import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { AppTooltipProvider } from '../components/ui/tooltip'
import { appConfig } from '../config/app.config'
import { AppConfigProvider } from '../config/provider'
import { WebGisModulesProvider } from '../core/modules/provider'
import { appModules } from './modules'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 10_000,
    },
  },
})

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider config={appConfig}>
        <WebGisModulesProvider modules={appModules}>
          <AppTooltipProvider>{children}</AppTooltipProvider>
        </WebGisModulesProvider>
      </AppConfigProvider>
    </QueryClientProvider>
  )
}
