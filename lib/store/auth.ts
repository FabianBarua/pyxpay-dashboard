import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApiCredentials } from "@/lib/actions/api";

const DEFAULT_ENDPOINT = "https://pyxpay.com.br/v1";

interface AuthState {
  apiKey: string;
  endpoint: string;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  login: (apiKey: string, endpoint?: string) => void;
  logout: () => void;
  getCredentials: () => ApiCredentials;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      apiKey: "",
      endpoint: DEFAULT_ENDPOINT,
      isAuthenticated: false,
      _hasHydrated: false,
      login: (apiKey: string, endpoint?: string) => {
        const ep = endpoint || DEFAULT_ENDPOINT;
        set({ apiKey, endpoint: ep, isAuthenticated: true });
      },
      logout: () => {
        set({
          apiKey: "",
          endpoint: DEFAULT_ENDPOINT,
          isAuthenticated: false,
        });
      },
      getCredentials: () => {
        const { apiKey, endpoint } = get();
        return { apiKey, endpoint };
      },
    }),
    {
      name: "pyxpay-auth",
      partialize: (state) => ({
        apiKey: state.apiKey,
        endpoint: state.endpoint,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Register hydration listener AFTER the store variable is assigned
if (typeof window !== "undefined") {
  useAuthStore.persist.onFinishHydration(() => {
    useAuthStore.setState({ _hasHydrated: true });
  });
  // Handle case where hydration already completed synchronously
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.setState({ _hasHydrated: true });
  }
}
