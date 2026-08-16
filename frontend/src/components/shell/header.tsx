import { HelpCircle, Menu } from 'lucide-react'

import { useAppConfig } from '../../config/context'
import { Button } from '../ui/button'
import { AppTooltip } from '../ui/tooltip'
import type { ServiceStatus } from './types'

interface HeaderProps {
  serviceStatus: ServiceStatus
  onOpenNavigation: () => void
}

const statusLabel: Record<ServiceStatus, string> = {
  loading: 'Verificando serviços',
  ready: 'Serviços operacionais',
  error: 'Serviços indisponíveis',
}

export function Header({ serviceStatus, onOpenNavigation }: HeaderProps) {
  const config = useAppConfig()

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-3 shadow-sm md:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        {config.ui.sidebar && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir navegação"
            onClick={onOpenNavigation}
          >
            <Menu aria-hidden="true" className="size-5" />
          </Button>
        )}

        {config.app.logoUrl ? (
          <img
            src={config.app.logoUrl}
            alt=""
            className="size-8 rounded-lg object-contain"
          />
        ) : (
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--color-brand)] text-xs font-bold tracking-wide text-white shadow-sm"
            aria-hidden="true"
          >
            {config.app.shortName}
          </span>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            {config.app.name}
          </p>
          <p className="hidden truncate text-[11px] text-slate-500 sm:block">
            {config.app.description}
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div
          className="hidden items-center gap-2 rounded-md px-2 py-1.5 sm:flex"
          role="status"
          aria-live="polite"
        >
          <span
            className={`service-dot service-dot--${serviceStatus}`}
            aria-hidden="true"
          />
          <span className="text-xs text-slate-600">
            {statusLabel[serviceStatus]}
          </span>
        </div>

        <AppTooltip
          label="Ajuda será conectada em uma fase futura"
          side="bottom"
        >
          <span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              aria-label="Ajuda"
            >
              <HelpCircle aria-hidden="true" className="size-4.5" />
            </Button>
          </span>
        </AppTooltip>
      </div>
    </header>
  )
}
