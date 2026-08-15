import type { CSSProperties } from 'react'
import { useState } from 'react'

import { useAppConfig } from '../../config/context'
import { useHealthQuery } from '../../services/health'
import { useLayerCatalogQuery } from '../../services/layers'
import { MapWorkspace } from '../gis/map-workspace'
import { Header } from './header'
import { MobileNavigation } from './mobile-navigation'
import { Sidebar } from './sidebar'
import type { ServiceStatus } from './types'

export function ApplicationShell() {
  const config = useAppConfig()
  const health = useHealthQuery()
  const layerCatalog = useLayerCatalogQuery()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [layerVisible, setLayerVisible] = useState(true)

  const serviceStatus: ServiceStatus = health.isPending
    ? 'loading'
    : health.isError
      ? 'error'
      : 'ready'
  const defaultLayer = layerCatalog.data?.find((layer) => layer.defaultVisible)
  const activeLayer = layerVisible ? defaultLayer : undefined
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
              layers={layerCatalog.data ?? []}
              visibleLayerId={activeLayer?.id ?? null}
              serviceStatus={serviceStatus}
              onToggleLayer={(layerId) =>
                setLayerVisible(
                  (current) => defaultLayer?.id !== layerId || !current,
                )
              }
              onToggleCollapse={() =>
                setSidebarCollapsed((current) => !current)
              }
            />
          </div>
        )}

        <MapWorkspace activeLayer={activeLayer} serviceStatus={serviceStatus} />
      </div>

      {config.ui.sidebar && (
        <MobileNavigation
          open={mobileNavigationOpen}
          layerCatalogStatus={layerCatalogStatus}
          layers={layerCatalog.data ?? []}
          visibleLayerId={activeLayer?.id ?? null}
          serviceStatus={serviceStatus}
          onToggleLayer={(layerId) =>
            setLayerVisible(
              (current) => defaultLayer?.id !== layerId || !current,
            )
          }
          onOpenChange={setMobileNavigationOpen}
        />
      )}
    </div>
  )
}
