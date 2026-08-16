import { Focus, Home, Maximize2, Pentagon, Ruler } from 'lucide-react'

import type { MapMeasurementMode } from '../../core/map/contracts'
import { cn } from '../../lib/cn'
import { Button } from '../ui/button'
import { AppTooltip } from '../ui/tooltip'

interface ToolbarProps {
  mapReady: boolean
  measureAreaEnabled: boolean
  measureDistanceEnabled: boolean
  measurementMode: MapMeasurementMode | null
  onGoHome: () => void
  onFitHomeBounds: () => void
  onStartMeasurement: (mode: MapMeasurementMode) => void
  onToggleFullscreen: () => Promise<void>
}

export function Toolbar({
  mapReady,
  measureAreaEnabled,
  measureDistanceEnabled,
  measurementMode,
  onGoHome,
  onFitHomeBounds,
  onStartMeasurement,
  onToggleFullscreen,
}: ToolbarProps) {
  const tools = [
    {
      label: 'Vista inicial',
      icon: Home,
      disabled: !mapReady,
      active: false,
      onClick: onGoHome,
    },
    {
      label: 'Enquadrar extensão inicial',
      icon: Focus,
      disabled: !mapReady,
      active: false,
      onClick: onFitHomeBounds,
    },
    {
      label: 'Tela cheia',
      icon: Maximize2,
      disabled: !mapReady,
      active: false,
      onClick: () => void onToggleFullscreen(),
    },
    ...(measureDistanceEnabled
      ? [
          {
            label: 'Medir distância',
            icon: Ruler,
            disabled: !mapReady,
            active: measurementMode === 'distance',
            onClick: () => onStartMeasurement('distance'),
          },
        ]
      : []),
    ...(measureAreaEnabled
      ? [
          {
            label: 'Medir área',
            icon: Pentagon,
            disabled: !mapReady,
            active: measurementMode === 'area',
            onClick: () => onStartMeasurement('area'),
          },
        ]
      : []),
  ]

  return (
    <div
      className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-xl border border-slate-200/80 bg-white/95 p-1.5 shadow-lg backdrop-blur"
      role="toolbar"
      aria-label="Ferramentas do mapa"
    >
      {tools.map((tool) => {
        const Icon = tool.icon

        return (
          <AppTooltip key={tool.label} label={tool.label} side="left">
            <span>
              <Button
                type="button"
                variant={tool.active ? 'subtle' : 'ghost'}
                size="icon"
                className={cn(
                  tool.active &&
                    'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand)] hover:text-white',
                )}
                disabled={tool.disabled}
                onClick={tool.onClick}
                aria-label={tool.label}
                aria-pressed={
                  tool.label.startsWith('Medir') ? tool.active : undefined
                }
              >
                <Icon aria-hidden="true" className="size-4" />
              </Button>
            </span>
          </AppTooltip>
        )
      })}
    </div>
  )
}
