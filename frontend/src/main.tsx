import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'maplibre-gl/dist/maplibre-gl.css'

import { App } from './App'
import { AppProviders } from './app/providers'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento raiz da aplicação não encontrado')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
