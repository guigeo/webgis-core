import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { useAppConfig } from '../../config/context'
import { useLayerStore } from '../../core/layers/store'
import { useWebGisModules } from '../../core/modules/context'
import { useHealthQuery } from '../../services/health'
import { useLayerCatalogQuery } from '../../services/layers'
import { MapWorkspace } from '../gis/map-workspace'
import { Header } from './header'
import { MobileNavigation } from './mobile-navigation'
import { Sidebar } from './sidebar'
import type { ServiceStatus } from './types'

export function ApplicationShell() {
  const config = useAppConfig()
  const moduleRegistry = useWebGisModules()
  const health = useHealthQuery()
  const layerCatalog = useLayerCatalogQuery()
  const initializeLayers = useLayerStore((state) => state.initializeLayers)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const layers = useMemo(
    () => moduleRegistry.selectLayers(layerCatalog.data ?? []),
    [layerCatalog.data, moduleRegistry],
  )

  useEffect(() => {
    if (layerCatalog.data) initializeLayers(layers)
  }, [initializeLayers, layerCatalog.data, layers])

  const serviceStatus: ServiceStatus = health.isPending
    ? 'loading'
    : health.isError
      ? 'error'
      : 'ready'
  const layerCatalogStatus = layerCatalog.isPending
    ? 'loading'
    : layerCatalog.isError
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
              layerCatalogStatus={layerCatalogStatus}
              layers={layers}
              serviceStatus={serviceStatus}
              onToggleCollapse={() =>
                setSidebarCollapsed((current) => !current)
              }
            />
          </div>
        )}

        <MapWorkspace layers={layers} serviceStatus={serviceStatus} />
      </div>

      {config.ui.sidebar && (
        <MobileNavigation
          open={mobileNavigationOpen}
          layerCatalogStatus={layerCatalogStatus}
          layers={layers}
          serviceStatus={serviceStatus}
          onOpenChange={setMobileNavigationOpen}
        />
      )}
    </div>
  )
}
