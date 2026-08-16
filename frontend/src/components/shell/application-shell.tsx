import type { CSSProperties } from 'react'
import { useState } from 'react'

import { useAppConfig } from '../../config/context'
import { useHealthQuery } from '../../services/health'
import { Header } from './header'
import { MapPlaceholder } from './map-placeholder'
import { MobileNavigation } from './mobile-navigation'
import { Sidebar } from './sidebar'
import { StatusBar } from './status-bar'
import { Toolbar } from './toolbar'
import type { ServiceStatus } from './types'

export function ApplicationShell() {
  const config = useAppConfig()
  const health = useHealthQuery()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)

  const serviceStatus: ServiceStatus = health.isPending
    ? 'loading'
    : health.isError
      ? 'error'
      : 'ready'

  const brandingStyle = {
    '--color-brand': config.branding.primaryColor,
    '--color-accent': config.branding.accentColor,
  } as CSSProperties

  return (
    <div
      className="flex h-dvh min-h-[32rem] flex-col overflow-hidden bg-slate-100 text-slate-950"
      style={brandingStyle}
      data-testid="application-shell"
    >
      <Header
        serviceStatus={serviceStatus}
        onOpenNavigation={() => setMobileNavigationOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        {config.ui.sidebar && (
          <div className="hidden md:flex">
            <Sidebar
              collapsed={sidebarCollapsed}
              serviceStatus={serviceStatus}
              onToggleCollapse={() =>
                setSidebarCollapsed((current) => !current)
              }
            />
          </div>
        )}

        <div className="relative flex min-w-0 flex-1 flex-col">
          <MapPlaceholder />
          {config.ui.toolbar && <Toolbar />}
          {config.ui.statusBar && <StatusBar serviceStatus={serviceStatus} />}
        </div>
      </div>

      {config.ui.sidebar && (
        <MobileNavigation
          open={mobileNavigationOpen}
          serviceStatus={serviceStatus}
          onOpenChange={setMobileNavigationOpen}
        />
      )}
    </div>
  )
}
