import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedApiKey {
  id: string;
  label: string;
  apiKey: string;
  endpoint: string;
  createdAt: string;
}

interface SavedKeysState {
  keys: SavedApiKey[];
  addKey: (label: string, apiKey: string, endpoint: string) => void;
  removeKey: (id: string) => void;
  updateKey: (id: string, updates: Partial<Pick<SavedApiKey, "label" | "apiKey" | "endpoint">>) => void;
}

export const useSavedKeysStore = create<SavedKeysState>()(
  persist(
    (set) => ({
      keys: [],
      addKey: (label, apiKey, endpoint) =>
        set((state) => ({
          keys: [
            ...state.keys,
            {
              id: crypto.randomUUID(),
              label,
              apiKey,
              endpoint,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removeKey: (id) =>
        set((state) => ({
          keys: state.keys.filter((k) => k.id !== id),
        })),
      updateKey: (id, updates) =>
        set((state) => ({
          keys: state.keys.map((k) =>
            k.id === id ? { ...k, ...updates } : k
          ),
        })),
    }),
    {
      name: "pyxpay-saved-keys",
    }
  )
);
