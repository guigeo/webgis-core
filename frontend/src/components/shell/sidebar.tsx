import {
  Database,
  Layers3,
  List,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useState } from 'react'

import { useAppConfig } from '../../config/context'
import { cn } from '../../lib/cn'
import { Button } from '../ui/button'
import { AppTooltip } from '../ui/tooltip'
import type { ServiceStatus } from './types'

type SidebarSection = 'layers' | 'legend'

const dataStatusLabel: Record<ServiceStatus, string> = {
  loading: 'Verificando dados',
  ready: 'Dados conectados',
  error: 'Dados indisponíveis',
}

interface SidebarProps {
  collapsed?: boolean
  mobile?: boolean
  serviceStatus: ServiceStatus
  onToggleCollapse?: () => void
}

function EmptySection({ section }: { section: SidebarSection }) {
  const isLayers = section === 'layers'

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
      <span className="mb-3 grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
        {isLayers ? (
          <Database aria-hidden="true" className="size-5" />
        ) : (
          <List aria-hidden="true" className="size-5" />
        )}
      </span>
      <p className="text-sm font-medium text-slate-800">
        {isLayers ? 'Nenhuma camada cadastrada' : 'Legenda ainda vazia'}
      </p>
      <p className="mt-1 max-w-52 text-xs leading-5 text-slate-500">
        {isLayers
          ? 'O catálogo de camadas será conectado ao PostGIS nas próximas fases.'
          : 'A legenda será construída a partir dos estilos das camadas visíveis.'}
      </p>
    </div>
  )
}

export function Sidebar({
  collapsed = false,
  mobile = false,
  serviceStatus,
  onToggleCollapse,
}: SidebarProps) {
  const config = useAppConfig()
  const firstSection: SidebarSection = config.capabilities.layers
    ? 'layers'
    : 'legend'
  const [activeSection, setActiveSection] =
    useState<SidebarSection>(firstSection)

  const navigation = [
    {
      id: 'layers' as const,
      label: 'Camadas',
      icon: Layers3,
      enabled: config.capabilities.layers,
    },
    {
      id: 'legend' as const,
      label: 'Legenda',
      icon: List,
      enabled: config.capabilities.legend,
    },
  ].filter((item) => item.enabled)

  return (
    <aside
      className={cn(
        'flex min-h-0 shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200',
        mobile ? 'h-full w-full border-r-0' : collapsed ? 'w-[4.5rem]' : 'w-72',
      )}
      aria-label="Navegação geográfica"
    >
      <div
        className={cn(
          'flex h-12 shrink-0 items-center border-b border-slate-100',
          collapsed ? 'justify-center px-2' : 'px-3',
        )}
      >
        {!collapsed && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Explorar
            </p>
          </div>
        )}

        {!mobile && onToggleCollapse && (
          <AppTooltip label={collapsed ? 'Expandir painel' : 'Recolher painel'}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(!collapsed && 'ml-auto')}
              aria-label={
                collapsed
                  ? 'Expandir painel lateral'
                  : 'Recolher painel lateral'
              }
              onClick={onToggleCollapse}
            >
              {collapsed ? (
                <PanelLeftOpen aria-hidden="true" className="size-4" />
              ) : (
                <PanelLeftClose aria-hidden="true" className="size-4" />
              )}
            </Button>
          </AppTooltip>
        )}
      </div>

      <nav
        className={cn(
          'flex shrink-0 border-b border-slate-100',
          collapsed ? 'flex-col gap-1 p-2' : 'gap-1 p-2',
        )}
        aria-label="Seções do painel"
      >
        {navigation.map((item) => {
          const Icon = item.icon
          const active = item.id === activeSection
          const button = (
            <Button
              key={item.id}
              type="button"
              variant={active ? 'subtle' : 'ghost'}
              size={collapsed ? 'icon' : 'sm'}
              className={cn(
                !collapsed && 'flex-1',
                active && 'text-[var(--color-brand)]',
              )}
              aria-pressed={active}
              onClick={() => setActiveSection(item.id)}
            >
              <Icon aria-hidden="true" className="size-4" />
              {!collapsed && item.label}
            </Button>
          )

          return collapsed ? (
            <AppTooltip key={item.id} label={item.label}>
              {button}
            </AppTooltip>
          ) : (
            button
          )
        })}
      </nav>

      {!collapsed && <EmptySection section={activeSection} />}

      <div
        className={cn(
          'mt-auto flex shrink-0 items-center border-t border-slate-100 text-xs text-slate-500',
          collapsed ? 'justify-center p-3' : 'gap-2 px-4 py-3',
        )}
      >
        <span
          className={`service-dot service-dot--${serviceStatus}`}
          aria-hidden="true"
        />
        {!collapsed && dataStatusLabel[serviceStatus]}
      </div>
    </aside>
  )
}
