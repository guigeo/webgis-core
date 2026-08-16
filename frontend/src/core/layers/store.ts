import { create } from 'zustand'

import type {
  LayerDefinition,
  LayerLoadState,
  LayerRuntimeState,
  LayerSelection,
} from './contracts'

interface LayerStoreState {
  order: string[]
  runtime: Record<string, LayerRuntimeState>
  selection: LayerSelection | null
  initializeLayers: (definitions: LayerDefinition[]) => void
  toggleLayer: (layerId: string) => void
  setOpacity: (layerId: string, opacity: number) => void
  moveLayer: (layerId: string, direction: 'up' | 'down') => void
  setLoadState: (
    layerId: string,
    loadState: LayerLoadState,
    errorMessage?: string | null,
  ) => void
  setSelection: (selection: LayerSelection | null) => void
}

export const useLayerStore = create<LayerStoreState>((set) => ({
  order: [],
  runtime: {},
  selection: null,

  initializeLayers: (definitions) =>
    set((state) => {
      const definitionIds = new Set(
        definitions.map((definition) => definition.id),
      )
      const existingOrder = state.order.filter((id) => definitionIds.has(id))
      const newDefinitions = definitions
        .filter((definition) => !existingOrder.includes(definition.id))
        .sort((left, right) => left.sortOrder - right.sortOrder)
      const runtime = Object.fromEntries(
        definitions.map((definition) => [
          definition.id,
          state.runtime[definition.id] ?? {
            visible: definition.defaultVisible,
            opacity: definition.defaultOpacity,
            loadState: 'idle',
            errorMessage: null,
          },
        ]),
      )

      return {
        order: [...existingOrder, ...newDefinitions.map(({ id }) => id)],
        runtime,
      }
    }),

  toggleLayer: (layerId) =>
    set((state) => {
      const layer = state.runtime[layerId]
      if (!layer) return state
      return {
        runtime: {
          ...state.runtime,
          [layerId]: { ...layer, visible: !layer.visible },
        },
      }
    }),

  setOpacity: (layerId, opacity) =>
    set((state) => {
      const layer = state.runtime[layerId]
      if (!layer) return state
      return {
        runtime: {
          ...state.runtime,
          [layerId]: {
            ...layer,
            opacity: Math.min(1, Math.max(0, opacity)),
          },
        },
      }
    }),

  moveLayer: (layerId, direction) =>
    set((state) => {
      const currentIndex = state.order.indexOf(layerId)
      const targetIndex = currentIndex + (direction === 'up' ? -1 : 1)
      if (
        currentIndex === -1 ||
        targetIndex < 0 ||
        targetIndex >= state.order.length
      ) {
        return state
      }

      const order = [...state.order]
      ;[order[currentIndex], order[targetIndex]] = [
        order[targetIndex],
        order[currentIndex],
      ]
      return { order }
    }),

  setLoadState: (layerId, loadState, errorMessage = null) =>
    set((state) => {
      const layer = state.runtime[layerId]
      if (!layer) return state
      return {
        runtime: {
          ...state.runtime,
          [layerId]: { ...layer, loadState, errorMessage },
        },
      }
    }),

  setSelection: (selection) => set({ selection }),
}))
