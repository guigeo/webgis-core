import { Compass, Map as MapIcon } from 'lucide-react'

import { useAppConfig } from '../../config/context'

export function MapPlaceholder() {
  const config = useAppConfig()
  const [longitude, latitude] = config.map.center

  return (
    <main
      className="map-canvas relative min-h-0 flex-1 overflow-hidden"
      aria-label="Área do mapa"
    >
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-white/80 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm backdrop-blur">
        <MapIcon
          aria-hidden="true"
          className="size-3.5 text-[var(--color-brand)]"
        />
        Área de trabalho
        <span className="text-slate-300">/</span>
        Mapa
      </div>

      <section className="absolute inset-0 z-[1] grid place-items-center px-6 text-center">
        <div className="max-w-sm rounded-2xl border border-white/80 bg-white/88 px-7 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-md">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-brand)_10%,white)] text-[var(--color-brand)] ring-1 ring-[color-mix(in_srgb,var(--color-brand)_20%,white)]">
            <Compass aria-hidden="true" className="size-6" />
          </span>
          <h1 className="text-base font-semibold text-slate-950">
            MapViewport preparado
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            O shell já reservou o ciclo de vida do mapa. O MapLibre será
            conectado na Fase 3.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-left text-xs">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-slate-400">Centro</dt>
              <dd className="mt-0.5 font-medium text-slate-700">
                {longitude.toFixed(2)}, {latitude.toFixed(2)}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-slate-400">Zoom inicial</dt>
              <dd className="mt-0.5 font-medium text-slate-700">
                {config.map.zoom}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  )
}
