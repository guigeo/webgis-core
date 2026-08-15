import { Crosshair, Database, ScanLine } from 'lucide-react'

import type { MapLoadState, MapViewState } from '../../core/map/contracts'
import type { ServiceStatus } from './types'

interface StatusBarProps {
  serviceStatus: ServiceStatus
  mapLoadState: MapLoadState
  viewState: MapViewState
}

const databaseStatusLabel: Record<ServiceStatus, string> = {
  loading: 'PostGIS verificando',
  ready: 'PostGIS conectado',
  error: 'PostGIS indisponível',
}

function approximateScale(viewState: MapViewState) {
  const latitudeRadians = (viewState.center[1] * Math.PI) / 180
  const metersPerPixel =
    (Math.cos(latitudeRadians) * 2 * Math.PI * 6_378_137) /
    (256 * 2 ** viewState.zoom)
  const denominator = metersPerPixel * (96 / 0.0254)

  return new Intl.NumberFormat('pt-BR', {
    maximumSignificantDigits: 2,
  }).format(denominator)
}

export function StatusBar({
  serviceStatus,
  mapLoadState,
  viewState,
}: StatusBarProps) {
  const coordinates = viewState.pointer
    ? `${viewState.pointer[1].toFixed(5)}, ${viewState.pointer[0].toFixed(5)}`
    : 'mova o cursor sobre o mapa'

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-slate-200 bg-white px-3 text-[11px] text-slate-500 md:px-4">
      <span className="flex items-center gap-1.5">
        <Crosshair aria-hidden="true" className="size-3" />
        <span className="hidden sm:inline">Coordenadas</span>{' '}
        {mapLoadState === 'ready' ? coordinates : '—'}
      </span>
      <span className="hidden items-center gap-1.5 sm:flex">
        <ScanLine aria-hidden="true" className="size-3" />
        Zoom {viewState.zoom.toFixed(1)} · Escala ~1:
        {approximateScale(viewState)}
      </span>
      <span className="ml-auto flex items-center gap-1.5">
        <Database aria-hidden="true" className="size-3" />
        {databaseStatusLabel[serviceStatus]}
      </span>
    </footer>
  )
}
