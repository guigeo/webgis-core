import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Database,
  ExternalLink,
  Layers3,
  List,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useState } from 'react'

import { useAppConfig } from '../../config/context'
import type { LayerDefinition } from '../../core/layers/contracts'
import { useLayerStore } from '../../core/layers/store'
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

const layerStatusLabel = {
  idle: 'Oculta',
  loading: 'Carregando',
  ready: 'Visível',
  error: 'Erro',
} as const

interface SidebarProps {
  collapsed?: boolean
  layerCatalogStatus: ServiceStatus
  layers: LayerDefinition[]
  mobile?: boolean
  serviceStatus: ServiceStatus
  onToggleCollapse?: () => void
}

function LayerSwatch({
  layer,
  opacity,
}: {
  layer: LayerDefinition
  opacity: number
}) {
  if (layer.style.kind === 'circle') {
    return (
      <span
        className="size-4 rounded-full border-2"
        style={{
          backgroundColor: layer.style.circleColor,
          borderColor: layer.style.strokeColor,
          opacity,
        }}
        aria-hidden="true"
      />
    )
  }

  return (
    <span
      className="size-5 rounded border-2"
      style={{
        backgroundColor: layer.style.fillColor,
        borderColor: layer.style.lineColor,
        opacity: Math.max(layer.style.fillOpacity * opacity, 0.25),
      }}
      aria-hidden="true"
    />
  )
}

interface SectionContentProps {
  layerCatalogStatus: ServiceStatus
  layers: LayerDefinition[]
  section: SidebarSection
}

function SectionContent({
  layerCatalogStatus,
  layers,
  section,
}: SectionContentProps) {
  const order = useLayerStore((state) => state.order)
  const runtime = useLayerStore((state) => state.runtime)
  const toggleLayer = useLayerStore((state) => state.toggleLayer)
  const setOpacity = useLayerStore((state) => state.setOpacity)
  const moveLayer = useLayerStore((state) => state.moveLayer)
  const orderedLayers = (order.length ? order : layers.map(({ id }) => id))
    .map((layerId) => layers.find((layer) => layer.id === layerId))
    .filter((layer): layer is LayerDefinition => Boolean(layer))

  if (layerCatalogStatus === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 px-5 py-10 text-xs text-slate-500">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Carregando catálogo
      </div>
    )
  }

  if (layerCatalogStatus === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
        <AlertTriangle aria-hidden="true" className="size-5 text-amber-600" />
        <p className="mt-3 text-sm font-medium text-slate-800">
          Catálogo indisponível
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Não foi possível consultar as camadas publicadas pela API.
        </p>
      </div>
    )
  }

  if (layers.length === 0) {
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
      </div>
    )
  }

  if (section === 'legend') {
    const visibleLayers = orderedLayers.filter(
      (layer) => runtime[layer.id]?.visible,
    )
    return (
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {visibleLayers.length ? (
          visibleLayers.map((layer) => (
            <div key={layer.id} className="flex items-center gap-3 text-sm">
              <LayerSwatch
                layer={layer}
                opacity={runtime[layer.id]?.opacity ?? layer.defaultOpacity}
              />
              <span className="text-slate-700">{layer.name}</span>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-xs text-slate-500">
            Ative uma camada para visualizar sua legenda.
          </p>
        )}
      </div>
    )
  }

  const groups = orderedLayers.reduce((result, layer) => {
    const group = result.get(layer.groupName) ?? []
    group.push(layer)
    result.set(layer.groupName, group)
    return result
  }, new Map<string, LayerDefinition[]>())

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-3">
      {[...groups.entries()].map(([groupName, groupLayers]) => (
        <section key={groupName} aria-label={groupName}>
          <h2 className="mb-2 px-1 text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-slate-400">
            {groupName}
          </h2>
          <div className="space-y-2">
            {groupLayers.map((layer) => {
              const state = runtime[layer.id] ?? {
                visible: layer.defaultVisible,
                opacity: layer.defaultOpacity,
                loadState: 'idle' as const,
                errorMessage: null,
              }
              const orderIndex = orderedLayers.findIndex(
                (candidate) => candidate.id === layer.id,
              )

              return (
                <article
                  key={layer.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className={cn(
                        'mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]',
                        state.visible
                          ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white'
                          : 'border-slate-300 bg-white text-transparent hover:border-slate-400',
                      )}
                      aria-label={`${state.visible ? 'Ocultar' : 'Mostrar'} ${layer.name}`}
                      aria-pressed={state.visible}
                      onClick={() => toggleLayer(layer.id)}
                    >
                      <Check aria-hidden="true" className="size-3.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {layer.name}
                        </h3>
                        <div className="flex shrink-0 gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="size-6"
                            aria-label={`Mover ${layer.name} para cima`}
                            disabled={orderIndex === 0}
                            onClick={() => moveLayer(layer.id, 'up')}
                          >
                            <ArrowUp aria-hidden="true" className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="size-6"
                            aria-label={`Mover ${layer.name} para baixo`}
                            disabled={orderIndex === orderedLayers.length - 1}
                            onClick={() => moveLayer(layer.id, 'down')}
                          >
                            <ArrowDown
                              aria-hidden="true"
                              className="size-3.5"
                            />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {layer.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <label
                      htmlFor={`opacity-${layer.id}`}
                      className="text-[0.6875rem] text-slate-500"
                    >
                      Opacidade
                    </label>
                    <input
                      id={`opacity-${layer.id}`}
                      className="h-1.5 min-w-0 flex-1 accent-[var(--color-brand)]"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={Math.round(state.opacity * 100)}
                      onChange={(event) =>
                        setOpacity(layer.id, Number(event.target.value) / 100)
                      }
                    />
                    <output className="w-8 text-right text-[0.6875rem] tabular-nums text-slate-500">
                      {Math.round(state.opacity * 100)}%
                    </output>
                  </div>

                  <div className="mt-3 border-t border-slate-200 pt-2 text-[0.6875rem] leading-4 text-slate-500">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            'size-1.5 rounded-full bg-slate-400',
                            state.loadState === 'ready' && 'bg-emerald-500',
                            state.loadState === 'loading' &&
                              'animate-pulse bg-amber-500',
                            state.loadState === 'error' && 'bg-red-500',
                          )}
                          aria-hidden="true"
                        />
                        {layerStatusLabel[state.loadState]}
                      </span>
                      <span>{layer.metadata.featureCount} feições</span>
                    </div>
                    {state.errorMessage && (
                      <p className="mt-1 text-red-600">{state.errorMessage}</p>
                    )}
                    <p className="mt-2">{layer.metadata.summary}</p>
                    <div className="mt-1 flex gap-3">
                      <a
                        className="inline-flex items-center gap-1 text-[var(--color-brand)] hover:underline"
                        href={layer.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Fonte{' '}
                        <ExternalLink aria-hidden="true" className="size-3" />
                      </a>
                      <a
                        className="inline-flex items-center gap-1 text-[var(--color-brand)] hover:underline"
                        href={layer.licenseUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Licença{' '}
                        <ExternalLink aria-hidden="true" className="size-3" />
                      </a>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

export function Sidebar({
  collapsed = false,
  layerCatalogStatus,
  layers,
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
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Explorar
          </p>
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

      {!collapsed && (
        <SectionContent
          layerCatalogStatus={layerCatalogStatus}
          layers={layers}
          section={activeSection}
        />
      )}

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
