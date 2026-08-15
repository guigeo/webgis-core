import { useEffect, useState } from 'react'

import { getHealth, type HealthResponse } from './services/health'

type HealthState =
  | { status: 'loading' }
  | { status: 'ready'; data: HealthResponse }
  | { status: 'error' }

export function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    getHealth(controller.signal)
      .then((data) => setHealth({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setHealth({ status: 'error' })
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="bootstrap">
      <section className="bootstrap__card" aria-labelledby="app-title">
        <p className="bootstrap__eyebrow">Bootstrap da Fase 1</p>
        <h1 id="app-title">Geo Core</h1>
        <p>Fundação WebGIS derivável.</p>

        <div className="health" role="status" aria-live="polite">
          <span
            className={`health__indicator health__indicator--${health.status}`}
            aria-hidden="true"
          />
          {health.status === 'loading' && 'Verificando serviços…'}
          {health.status === 'ready' &&
            `API ${health.data.status} · PostGIS ${health.data.database}`}
          {health.status === 'error' && 'Serviços indisponíveis'}
        </div>
      </section>
    </main>
  )
}
