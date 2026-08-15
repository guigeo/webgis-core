import { Crosshair, Database, ScanLine } from 'lucide-react'

import type { ServiceStatus } from './types'

interface StatusBarProps {
  serviceStatus: ServiceStatus
}

const databaseStatusLabel: Record<ServiceStatus, string> = {
  loading: 'PostGIS verificando',
  ready: 'PostGIS conectado',
  error: 'PostGIS indisponível',
}

export function StatusBar({ serviceStatus }: StatusBarProps) {
  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-slate-200 bg-white px-3 text-[11px] text-slate-500 md:px-4">
      <span className="flex items-center gap-1.5">
        <Crosshair aria-hidden="true" className="size-3" />
        <span className="hidden sm:inline">Coordenadas</span> —
      </span>
      <span className="hidden items-center gap-1.5 sm:flex">
        <ScanLine aria-hidden="true" className="size-3" />
        Zoom — · Escala —
      </span>
      <span className="ml-auto flex items-center gap-1.5">
        <Database aria-hidden="true" className="size-3" />
        {databaseStatusLabel[serviceStatus]}
      </span>
    </footer>
  )
}
