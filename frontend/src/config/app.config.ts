import { appConfigSchema } from './schema'

export const appConfig = appConfigSchema.parse({
  version: 1,
  app: {
    name: 'Geo Core',
    shortName: 'GC',
    description: 'Fundação WebGIS derivável',
    logoUrl: null,
  },
  branding: {
    primaryColor: '#175CD3',
    accentColor: '#0E9384',
  },
  map: {
    center: [-46.6333, -23.5505],
    zoom: 10,
    minZoom: 2,
    maxZoom: 20,
    homeBounds: [
      [-47.35, -24.05],
      [-45.92, -23.05],
    ],
    basemap: {
      id: 'carto-positron',
      name: 'CARTO Positron',
      tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxZoom: 20,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>, © <a href="https://carto.com/attribution/" target="_blank">CARTO</a>',
      termsUrl: 'https://carto.com/basemaps/',
    },
  },
  ui: {
    sidebar: true,
    toolbar: true,
    statusBar: true,
  },
  capabilities: {
    layers: true,
    legend: true,
  },
})
