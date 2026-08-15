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
