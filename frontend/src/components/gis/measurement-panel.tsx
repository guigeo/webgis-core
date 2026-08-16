import { RotateCcw, X } from 'lucide-react'

import type { MapMeasurementState } from '../../core/map/contracts'
import { Button } from '../ui/button'

interface MeasurementPanelProps {
  measurement: MapMeasurementState
  onClose: () => void
  onReset: () => void
}

export function MeasurementPanel({
  measurement,
  onClose,
  onReset,
}: MeasurementPanelProps) {
  if (!measurement.mode) return null

  const isDistance = measurement.mode === 'distance'
  const minimumPoints = isDistance ? 2 : 3
  const remainingPoints = minimumPoints - measurement.coordinates.length

  return (
    <section
      className="absolute bottom-12 left-4 z-10 w-[min(20rem,calc(100%-2rem))] rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur"
      aria-label={isDistance ? 'Medição de distância' : 'Medição de área'}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-violet-600">
            Ferramenta ativa
          </p>
          <h2 className="mt-1 text-sm font-semibold text-slate-900">
            {isDistance ? 'Medição de distância' : 'Medição de área'}
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Encerrar medição"
          onClick={onClose}
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Clique no mapa para adicionar vértices. Pressione Esc para encerrar.
      </p>

      <div
        className="mt-3 rounded-lg bg-violet-50 px-3 py-2.5"
        aria-live="polite"
      >
        <p className="text-[0.6875rem] text-violet-700">
          {measurement.coordinates.length} vértice
          {measurement.coordinates.length === 1 ? '' : 's'}
        </p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums text-violet-950">
          {measurement.formatted ??
            `Adicione ${remainingPoints} ponto${remainingPoints === 1 ? '' : 's'}`}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        disabled={measurement.coordinates.length === 0}
        onClick={onReset}
      >
        <RotateCcw aria-hidden="true" className="size-3.5" />
        Recomeçar medição
      </Button>
    </section>
  )
}
