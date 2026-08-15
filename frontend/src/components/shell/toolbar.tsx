import { Focus, Home, Maximize2, Ruler } from 'lucide-react'

import { Button } from '../ui/button'
import { AppTooltip } from '../ui/tooltip'

interface ToolbarProps {
  mapReady: boolean
  onGoHome: () => void
  onFitHomeBounds: () => void
  onToggleFullscreen: () => Promise<void>
}

export function Toolbar({
  mapReady,
  onGoHome,
  onFitHomeBounds,
  onToggleFullscreen,
}: ToolbarProps) {
  const tools = [
    {
      label: 'Vista inicial',
      icon: Home,
      disabled: !mapReady,
      onClick: onGoHome,
    },
    {
      label: 'Enquadrar extensão inicial',
      icon: Focus,
      disabled: !mapReady,
      onClick: onFitHomeBounds,
    },
    {
      label: 'Tela cheia',
      icon: Maximize2,
      disabled: !mapReady,
      onClick: () => void onToggleFullscreen(),
    },
    {
      label: 'Medir · Fase 7',
      icon: Ruler,
      disabled: true,
      onClick: undefined,
    },
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
                variant="ghost"
                size="icon"
                disabled={tool.disabled}
                onClick={tool.onClick}
                aria-label={tool.label}
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
