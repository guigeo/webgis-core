import { Focus, Home, Maximize2, Ruler } from 'lucide-react'

import { Button } from '../ui/button'
import { AppTooltip } from '../ui/tooltip'

const tools = [
  { label: 'Extensão inicial', icon: Home, phase: 'Fase 3' },
  { label: 'Enquadrar mapa', icon: Focus, phase: 'Fase 3' },
  { label: 'Tela cheia', icon: Maximize2, phase: 'Fase 3' },
  { label: 'Medir', icon: Ruler, phase: 'Fase 7' },
]

export function Toolbar() {
  return (
    <div
      className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-xl border border-slate-200/80 bg-white/95 p-1.5 shadow-lg backdrop-blur"
      role="toolbar"
      aria-label="Ferramentas do mapa"
    >
      {tools.map((tool) => {
        const Icon = tool.icon

        return (
          <AppTooltip
            key={tool.label}
            label={`${tool.label} · ${tool.phase}`}
            side="left"
          >
            <span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled
                aria-label={`${tool.label} indisponível`}
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
