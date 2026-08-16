import { z } from 'zod'

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor hexadecimal com seis dígitos')

const centerSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
])

const boundsSchema = z.tuple([centerSchema, centerSchema])

export const appConfigSchema = z
  .object({
    version: z.literal(1),
    app: z.object({
      name: z.string().trim().min(1).max(80),
      shortName: z.string().trim().min(2).max(4),
      description: z.string().trim().min(1).max(160),
      logoUrl: z.string().trim().min(1).nullable(),
    }),
    branding: z.object({
      primaryColor: hexColorSchema,
      accentColor: hexColorSchema,
    }),
    map: z.object({
      center: centerSchema,
      zoom: z.number().min(0).max(24),
      minZoom: z.number().min(0).max(24),
      maxZoom: z.number().min(0).max(24),
      homeBounds: boundsSchema,
      basemap: z.object({
        id: z.string().trim().min(1),
        name: z.string().trim().min(1),
        tiles: z.array(z.url()).min(1),
        tileSize: z.union([z.literal(256), z.literal(512)]),
        maxZoom: z.number().int().min(0).max(24),
        attribution: z.string().trim().min(1),
        termsUrl: z.url(),
      }),
    }),
    ui: z.object({
      sidebar: z.boolean(),
      toolbar: z.boolean(),
      statusBar: z.boolean(),
    }),
    capabilities: z.object({
      layers: z.boolean(),
      legend: z.boolean(),
      measureDistance: z.boolean(),
      measureArea: z.boolean(),
    }),
    modules: z
      .array(z.string().regex(/^[a-z][a-z0-9-]*$/))
      .refine((modules) => new Set(modules).size === modules.length, {
        message: 'modules não pode conter ids duplicados',
      }),
  })
  .superRefine((config, context) => {
    if (config.map.minZoom > config.map.maxZoom) {
      context.addIssue({
        code: 'custom',
        message: 'minZoom não pode ser maior que maxZoom',
        path: ['map', 'minZoom'],
      })
    }

    if (
      config.map.zoom < config.map.minZoom ||
      config.map.zoom > config.map.maxZoom
    ) {
      context.addIssue({
        code: 'custom',
        message: 'zoom deve estar entre minZoom e maxZoom',
        path: ['map', 'zoom'],
      })
    }

    const [[west, south], [east, north]] = config.map.homeBounds

    if (west >= east || south >= north) {
      context.addIssue({
        code: 'custom',
        message: 'homeBounds deve seguir [sudoeste, nordeste]',
        path: ['map', 'homeBounds'],
      })
    }

    if (
      config.ui.sidebar &&
      !config.capabilities.layers &&
      !config.capabilities.legend
    ) {
      context.addIssue({
        code: 'custom',
        message: 'sidebar habilitada exige ao menos uma seção disponível',
        path: ['capabilities'],
      })
    }
  })

export type AppConfig = z.infer<typeof appConfigSchema>
